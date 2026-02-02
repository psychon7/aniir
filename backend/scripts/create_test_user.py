"""
Script to create a test user for auth flow testing.

Run this before running Playwright auth tests:
    python scripts/create_test_user.py

Creates a test user with:
    - username: testuser
    - password: Test@123456
"""
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import bcrypt
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.config.settings import get_settings


def hash_password(password: str) -> str:
    """Hash a password using bcrypt directly."""
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

# Test user credentials
TEST_USERNAME = "testuser"
TEST_PASSWORD = "Test@123456"


def create_test_user():
    """Create or update the test user."""
    settings = get_settings()

    # Convert async URL to sync URL if needed
    db_url = settings.DATABASE_URL
    if db_url.startswith("mssql+aioodbc://"):
        db_url = db_url.replace("mssql+aioodbc://", "mssql+pyodbc://")

    # Create sync engine
    engine = create_engine(db_url, echo=False)

    Session = sessionmaker(bind=engine)

    with Session() as session:
        try:
            # Hash the password
            hashed_password = hash_password(TEST_PASSWORD)

            # Check if test user exists
            check_query = text(
                "SELECT usr_id FROM TM_USR_User WHERE usr_login = :login"
            )
            result = session.execute(check_query, {"login": TEST_USERNAME})
            existing_user = result.scalar_one_or_none()

            if existing_user:
                # Update password
                update_query = text("""
                    UPDATE TM_USR_User
                    SET usr_pwd = :password,
                        usr_is_actived = 1
                    WHERE usr_login = :login
                """)
                session.execute(update_query, {
                    "password": hashed_password,
                    "login": TEST_USERNAME
                })
                print(f"Updated test user: {TEST_USERNAME}")
            else:
                # Get default role and society IDs
                role_query = text("SELECT TOP 1 rol_id FROM TR_ROL_Role WHERE rol_active = 1")
                role_result = session.execute(role_query)
                role_id = role_result.scalar_one_or_none()

                society_query = text("SELECT TOP 1 soc_id FROM TM_SOC_Society")
                society_result = session.execute(society_query)
                society_id = society_result.scalar_one_or_none()

                civility_query = text("SELECT TOP 1 civ_id FROM TR_CIV_Civility WHERE civ_active = 1")
                civility_result = session.execute(civility_query)
                civility_id = civility_result.scalar_one_or_none()

                if not role_id or not society_id or not civility_id:
                    print("Error: Missing required reference data (role, society, or civility)")
                    print(f"  - role_id: {role_id}")
                    print(f"  - society_id: {society_id}")
                    print(f"  - civility_id: {civility_id}")
                    return False

                # Insert new test user
                insert_query = text("""
                    INSERT INTO TM_USR_User (
                        rol_id, usr_login, usr_pwd, usr_firstname, usr_lastname,
                        usr_initial, usr_d_creation, usr_d_update, civ_id,
                        usr_is_actived, soc_id, usr_super_right
                    ) VALUES (
                        :rol_id, :login, :password, :firstname, :lastname,
                        :initial, GETDATE(), GETDATE(), :civ_id,
                        1, :soc_id, 0
                    )
                """)
                session.execute(insert_query, {
                    "rol_id": role_id,
                    "login": TEST_USERNAME,
                    "password": hashed_password,
                    "firstname": "Test",
                    "lastname": "User",
                    "initial": "TU",
                    "civ_id": civility_id,
                    "soc_id": society_id
                })
                print(f"Created test user: {TEST_USERNAME}")

            session.commit()
            print(f"Test credentials:")
            print(f"  Username: {TEST_USERNAME}")
            print(f"  Password: {TEST_PASSWORD}")
            return True

        except Exception as e:
            print(f"Error creating test user: {e}")
            session.rollback()
            return False

    engine.dispose()


if __name__ == "__main__":
    result = create_test_user()
    sys.exit(0 if result else 1)
