"""
CLI commands for the ERP application.
"""
import click
import sys


@click.group()
def cli():
    """ERP Application CLI."""
    pass


@cli.command()
def test_db():
    """Test database connection."""
    from app.tests.test_db_connection import run_all_tests
    success = run_all_tests()
    sys.exit(0 if success else 1)


@cli.command()
def show_config():
    """Show current configuration."""
    from app.core.config import settings
    
    click.echo("Current Configuration:")
    click.echo("-" * 40)
    click.echo(f"App Name: {settings.APP_NAME}")
    click.echo(f"Debug: {settings.DEBUG}")
    click.echo(f"DB Host: {settings.DB_HOST}")
    click.echo(f"DB Port: {settings.DB_PORT}")
    click.echo(f"DB Name: {settings.DB_NAME}")
    click.echo(f"DB User: {settings.DB_USER}")
    click.echo(f"DB Driver: {settings.DB_DRIVER}")


# =============================================================================
# Migration Commands
# =============================================================================

@cli.group()
def migrate():
    """Database migration commands."""
    pass


@migrate.command("status")
def migrate_status():
    """Show migration status."""
    from app.migrations.runner import MigrationRunner
    
    click.echo("\n📊 Database Migration Status")
    click.echo("=" * 50)
    
    try:
        runner = MigrationRunner()
        status = runner.get_migration_status()
        
        if status["status"] == "error":
            click.echo(f"❌ Error: {status['error']}")
            sys.exit(1)
        
        if status["status"] == "ok":
            click.echo("✅ Database is up to date - no pending migrations")
        else:
            click.echo(f"⚠️ {status['pending_count']} pending migration(s):")
            for m in status["pending_migrations"]:
                click.echo(f"   - {m['version']}: {m['description']}")
        
        click.echo("")
        
    except Exception as e:
        click.echo(f"❌ Error: {e}")
        sys.exit(1)


@migrate.command("run")
@click.option("--dry-run", is_flag=True, help="Show what would be executed without running")
def migrate_run(dry_run: bool):
    """Run pending migrations."""
    from app.migrations.runner import MigrationRunner
    
    click.echo("\n🚀 Database Migration Runner")
    click.echo("=" * 50)
    
    try:
        runner = MigrationRunner()
        
        if dry_run:
            pending = runner.get_pending_migrations()
            if not pending:
                click.echo("✅ No pending migrations")
            else:
                click.echo(f"📋 Would run {len(pending)} migration(s):")
                for m in pending:
                    click.echo(f"   - {m.version}: {m.description}")
            return
        
        successful, failed = runner.run_pending_migrations()
        
        if failed > 0:
            click.echo(f"\n⚠️ Completed with errors. Success: {successful}, Failed: {failed}")
            sys.exit(1)
        else:
            click.echo(f"\n✅ All migrations applied successfully!")
            
    except Exception as e:
        click.echo(f"❌ Error: {e}")
        sys.exit(1)


@migrate.command("pending")
def migrate_pending():
    """List pending migrations."""
    from app.migrations.runner import MigrationRunner
    
    try:
        runner = MigrationRunner()
        pending = runner.get_pending_migrations()
        
        if not pending:
            click.echo("\n✅ No pending migrations")
        else:
            click.echo(f"\n📋 Pending Migrations ({len(pending)}):")
            click.echo("-" * 50)
            for m in pending:
                click.echo(f"\n  Version: {m.version}")
                click.echo(f"  Description: {m.description}")
                click.echo(f"  File: {m.filename}")
                click.echo(f"  Checksum: {m.checksum}")
        
        click.echo("")
        
    except Exception as e:
        click.echo(f"❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    cli()
