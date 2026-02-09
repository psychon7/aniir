"""
Migration Runner

Automatically detects and executes pending database migrations.
Similar to Flyway/Alembic but lightweight and SQL-file based.

Usage:
    from app.migrations.runner import MigrationRunner
    
    runner = MigrationRunner()
    runner.run_pending_migrations()
"""

import os
import re
import logging
from pathlib import Path
from datetime import datetime
from typing import List, Optional, Tuple
from dataclasses import dataclass

import pymssql

from app.config import get_settings

logger = logging.getLogger(__name__)


@dataclass
class Migration:
    """Represents a single migration file."""
    version: str
    description: str
    filename: str
    filepath: Path
    checksum: str = ""
    
    def __lt__(self, other):
        """Enable sorting by version."""
        return self._version_tuple() < other._version_tuple()
    
    def _version_tuple(self) -> Tuple[int, ...]:
        """Convert version string to tuple for comparison."""
        # Handle versions like V1.0.0.2 -> (1, 0, 0, 2)
        version_str = self.version.lstrip('V').lstrip('v')
        parts = version_str.split('.')
        return tuple(int(p) for p in parts if p.isdigit())


class MigrationRunner:
    """
    Handles database migration detection and execution.
    
    Migration files should follow the naming convention:
        V{version}__{description}.sql
        
    Example:
        V1.0.0.1__initial_schema.sql
        V1.0.0.2__create_client_product_price.sql
    """
    
    # Regex pattern for migration file names
    MIGRATION_PATTERN = re.compile(
        r'^V(\d+(?:\.\d+)*)__(.+)\.sql$',
        re.IGNORECASE
    )
    
    # Migration history table name
    HISTORY_TABLE = "_MigrationHistory"
    
    def __init__(self, migrations_dir: Optional[Path] = None):
        """
        Initialize the migration runner.
        
        Args:
            migrations_dir: Path to migrations folder. Defaults to database/migrations/
        """
        self.settings = get_settings()
        
        # Default migrations directory
        if migrations_dir is None:
            # Try Docker path first (/app/migrations), then local development path
            docker_path = Path("/app/migrations")
            if docker_path.exists():
                self.migrations_dir = docker_path
            else:
                # Local development: go up from backend/app/migrations to project root
                project_root = Path(__file__).parent.parent.parent.parent
                self.migrations_dir = project_root / "database" / "migrations"
        else:
            self.migrations_dir = migrations_dir
            
        logger.info(f"Migration runner initialized. Migrations dir: {self.migrations_dir}")
        logger.info(f"Migrations dir exists: {self.migrations_dir.exists()}")
    
    def _get_connection(self):
        """Create a database connection using pymssql."""
        from urllib.parse import unquote

        # Try to get DATABASE_URL from environment first (Docker sets this),
        # then fall back to the settings computed value
        import os
        url = os.environ.get("DATABASE_URL", "") or self.settings.DATABASE_URL

        logger.info(f"Parsing DATABASE_URL (masked): {url[:40]}...")

        # Remove any SQLAlchemy driver prefix
        for prefix in ("mssql+pymssql://", "mssql+pyodbc://", "mssql://"):
            if url.startswith(prefix):
                url = url[len(prefix):]
                break

        # Split off query parameters from the path portion
        # Format after prefix removal: user:pass@host:port/database?params
        #   or for Windows Auth:      @host:port/database?params

        if "@" not in url:
            raise ValueError(
                "DATABASE_URL missing '@' separator between credentials and host. "
                f"Ensure DATABASE_URL env var is set correctly (got prefix: {url[:20]}...)"
            )

        # rsplit on '@' to handle passwords that may contain '@'
        user_pass, host_db = url.rsplit("@", 1)

        # Extract database name (before any query string)
        if "/" not in host_db:
            raise ValueError("DATABASE_URL missing database path separator '/'")

        host_port, db_params = host_db.split("/", 1)
        database = db_params.split("?")[0]

        # Parse credentials (may be empty for Windows Auth)
        if ":" in user_pass:
            user, password = user_pass.split(":", 1)
        else:
            user = user_pass
            password = ""

        user = unquote(user)
        password = unquote(password)

        # Parse host:port
        if ":" in host_port:
            host, port_str = host_port.split(":")
            port = int(port_str)
        else:
            host = host_port
            port = 1433

        logger.info(f"Connecting to {host}:{port}/{database} as {user or '(Windows Auth)'}")

        return pymssql.connect(
            server=host,
            port=port,
            user=user,
            password=password,
            database=database,
            tds_version="7.0"
        )
    
    def _ensure_history_table(self, cursor) -> None:
        """Create the migration history table if it doesn't exist."""
        cursor.execute(f"""
            IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = '{self.HISTORY_TABLE}')
            BEGIN
                CREATE TABLE [dbo].[{self.HISTORY_TABLE}] (
                    [id] INT IDENTITY(1,1) PRIMARY KEY,
                    [version] NVARCHAR(50) NOT NULL UNIQUE,
                    [description] NVARCHAR(500) NOT NULL,
                    [filename] NVARCHAR(255) NOT NULL,
                    [checksum] NVARCHAR(64) NULL,
                    [executed_at] DATETIME NOT NULL DEFAULT GETDATE(),
                    [executed_by] NVARCHAR(100) NOT NULL DEFAULT SYSTEM_USER,
                    [execution_time_ms] INT NULL,
                    [success] BIT NOT NULL DEFAULT 1
                );
                
                CREATE INDEX [IX_{self.HISTORY_TABLE}_Version] 
                    ON [dbo].[{self.HISTORY_TABLE}] ([version]);
                    
                PRINT 'Migration history table created';
            END
        """)
        logger.info("Migration history table ensured")
    
    def _get_applied_migrations(self, cursor) -> set:
        """Get list of already applied migration versions."""
        cursor.execute(f"""
            SELECT [version] FROM [dbo].[{self.HISTORY_TABLE}]
            WHERE [success] = 1
            ORDER BY [version]
        """)
        
        applied = {row[0] for row in cursor.fetchall()}
        logger.info(f"Found {len(applied)} applied migrations")
        return applied
    
    def _discover_migrations(self) -> List[Migration]:
        """Discover all migration files in the migrations directory."""
        migrations = []
        
        if not self.migrations_dir.exists():
            logger.warning(f"Migrations directory does not exist: {self.migrations_dir}")
            return migrations
        
        for filepath in self.migrations_dir.glob("*.sql"):
            match = self.MIGRATION_PATTERN.match(filepath.name)
            if match:
                version = f"V{match.group(1)}"
                description = match.group(2).replace("_", " ")
                
                # Calculate checksum for integrity checking
                import hashlib
                content = filepath.read_text(encoding='utf-8')
                checksum = hashlib.sha256(content.encode()).hexdigest()[:16]
                
                migrations.append(Migration(
                    version=version,
                    description=description,
                    filename=filepath.name,
                    filepath=filepath,
                    checksum=checksum
                ))
        
        # Sort by version
        migrations.sort()
        logger.info(f"Discovered {len(migrations)} migration files")
        
        return migrations
    
    def _execute_migration(self, cursor, migration: Migration) -> int:
        """
        Execute a single migration file.
        
        Returns execution time in milliseconds.
        """
        logger.info(f"Executing migration: {migration.version} - {migration.description}")
        
        start_time = datetime.now()
        
        # Read SQL content
        sql_content = migration.filepath.read_text(encoding='utf-8')
        
        # Split by GO statements (SQL Server batch separator)
        # We need to execute each batch separately
        batches = re.split(r'^\s*GO\s*$', sql_content, flags=re.MULTILINE | re.IGNORECASE)
        
        for batch in batches:
            batch = batch.strip()
            if batch:
                try:
                    cursor.execute(batch)
                except Exception as e:
                    logger.error(f"Error executing batch: {e}")
                    logger.error(f"Batch content: {batch[:500]}...")
                    raise
        
        execution_time = int((datetime.now() - start_time).total_seconds() * 1000)
        logger.info(f"Migration {migration.version} completed in {execution_time}ms")
        
        return execution_time
    
    def _record_migration(self, cursor, migration: Migration, execution_time: int, success: bool) -> None:
        """Record a migration execution in the history table."""
        cursor.execute(f"""
            INSERT INTO [dbo].[{self.HISTORY_TABLE}] 
                ([version], [description], [filename], [checksum], [execution_time_ms], [success])
            VALUES 
                (%s, %s, %s, %s, %s, %s)
        """, (
            migration.version,
            migration.description,
            migration.filename,
            migration.checksum,
            execution_time,
            1 if success else 0
        ))
    
    def get_pending_migrations(self) -> List[Migration]:
        """Get list of migrations that haven't been applied yet."""
        conn = self._get_connection()
        try:
            cursor = conn.cursor()
            
            # Ensure history table exists
            self._ensure_history_table(cursor)
            conn.commit()
            
            # Get applied migrations
            applied = self._get_applied_migrations(cursor)
            
            # Discover all migrations
            all_migrations = self._discover_migrations()
            
            # Filter to pending only
            pending = [m for m in all_migrations if m.version not in applied]
            
            logger.info(f"Found {len(pending)} pending migrations")
            return pending
            
        finally:
            conn.close()
    
    def run_pending_migrations(self) -> Tuple[int, int]:
        """
        Run all pending migrations.
        
        Returns:
            Tuple of (successful_count, failed_count)
        """
        conn = self._get_connection()
        successful = 0
        failed = 0
        
        try:
            cursor = conn.cursor()
            
            # Ensure history table exists
            self._ensure_history_table(cursor)
            conn.commit()
            
            # Get applied migrations
            applied = self._get_applied_migrations(cursor)
            
            # Discover and filter migrations
            all_migrations = self._discover_migrations()
            pending = [m for m in all_migrations if m.version not in applied]
            
            if not pending:
                logger.info("No pending migrations to run")
                print("✅ Database is up to date - no pending migrations")
                return (0, 0)
            
            print(f"🚀 Running {len(pending)} pending migration(s)...")
            
            for migration in pending:
                try:
                    print(f"  ⏳ Applying {migration.version}: {migration.description}")
                    
                    execution_time = self._execute_migration(cursor, migration)
                    self._record_migration(cursor, migration, execution_time, success=True)
                    conn.commit()
                    
                    print(f"  ✅ Applied {migration.version} ({execution_time}ms)")
                    successful += 1
                    
                except Exception as e:
                    logger.error(f"Migration {migration.version} failed: {e}")
                    print(f"  ❌ Failed {migration.version}: {e}")
                    
                    # Record failure
                    try:
                        self._record_migration(cursor, migration, 0, success=False)
                        conn.commit()
                    except:
                        conn.rollback()
                    
                    failed += 1
                    # Stop on first failure
                    break
            
            if failed == 0:
                print(f"✅ All {successful} migration(s) applied successfully!")
            else:
                print(f"⚠️ Migration failed! Applied: {successful}, Failed: {failed}")
            
            return (successful, failed)
            
        except Exception as e:
            logger.error(f"Migration runner error: {e}")
            print(f"❌ Migration error: {e}")
            raise
            
        finally:
            conn.close()
    
    def get_migration_status(self) -> dict:
        """Get current migration status for health checks."""
        try:
            pending = self.get_pending_migrations()
            return {
                "status": "ok" if len(pending) == 0 else "pending",
                "pending_count": len(pending),
                "pending_migrations": [
                    {"version": m.version, "description": m.description}
                    for m in pending
                ]
            }
        except Exception as e:
            return {
                "status": "error",
                "error": str(e)
            }


def run_migrations_on_startup():
    """
    Run pending migrations on application startup.
    Called from main.py during app initialization.
    """
    logger.info("=" * 60)
    logger.info("Database Migration Check")
    logger.info("=" * 60)
    
    try:
        runner = MigrationRunner()
        successful, failed = runner.run_pending_migrations()
        
        if failed > 0:
            logger.error(f"Migrations failed! Successful: {successful}, Failed: {failed}")
            # Don't exit - let the app start and show errors
            # The app can still function with partial migrations
        else:
            logger.info(f"Migration check complete. Applied: {successful}")
            
        return successful, failed
        
    except Exception as e:
        logger.error(f"Migration system error: {e}")
        print(f"⚠️ Migration check failed: {e}")
        # Don't crash the app, but log the error
        return 0, 1


# CLI entry point
if __name__ == "__main__":
    import sys
    
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    runner = MigrationRunner()
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "status":
            # Show migration status
            status = runner.get_migration_status()
            print(f"\n📊 Migration Status: {status['status']}")
            if status.get('pending_count', 0) > 0:
                print(f"\n📋 Pending Migrations ({status['pending_count']}):")
                for m in status['pending_migrations']:
                    print(f"   - {m['version']}: {m['description']}")
            else:
                print("   No pending migrations")
                
        elif command == "run":
            # Run migrations
            successful, failed = runner.run_pending_migrations()
            sys.exit(1 if failed > 0 else 0)
            
        elif command == "pending":
            # List pending migrations
            pending = runner.get_pending_migrations()
            if pending:
                print(f"\n📋 Pending Migrations ({len(pending)}):")
                for m in pending:
                    print(f"   {m.version}: {m.description}")
                    print(f"      File: {m.filename}")
            else:
                print("\n✅ No pending migrations")
                
        else:
            print(f"Unknown command: {command}")
            print("Usage: python -m app.migrations.runner [status|run|pending]")
            sys.exit(1)
    else:
        # Default: run migrations
        successful, failed = runner.run_pending_migrations()
        sys.exit(1 if failed > 0 else 0)
