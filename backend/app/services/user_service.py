"""
User Service Module.

Provides functionality for:
- User CRUD operations
- User search and filtering
- Password hashing for user creation/update
"""
from typing import List, Optional, Tuple
from datetime import datetime
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from fastapi import Depends
from passlib.context import CryptContext

from app.database import get_db
from app.models.user import User, Civility
from app.models.role import Role
from app.models.society import Society
from app.schemas.user import (
    UserCreate, UserUpdate, UserSearchParams
)


# Password hashing context using bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ==========================================================================
# Custom Exceptions
# ==========================================================================

class UserServiceError(Exception):
    """Base exception for user service."""
    def __init__(self, code: str, message: str, details: dict = None):
        self.code = code
        self.message = message
        self.details = details or {}
        super().__init__(self.message)


class UserNotFoundError(UserServiceError):
    """Raised when user is not found."""
    def __init__(self, user_id: int):
        super().__init__(
            code="USER_NOT_FOUND",
            message=f"User with ID {user_id} not found",
            details={"user_id": user_id}
        )


class UserLoginNotFoundError(UserServiceError):
    """Raised when user login is not found."""
    def __init__(self, login: str):
        super().__init__(
            code="USER_LOGIN_NOT_FOUND",
            message=f"User with login '{login}' not found",
            details={"login": login}
        )


class UserValidationError(UserServiceError):
    """Raised when user data is invalid."""
    def __init__(self, message: str, details: dict = None):
        super().__init__(
            code="USER_VALIDATION_ERROR",
            message=message,
            details=details or {}
        )


class DuplicateUserError(UserServiceError):
    """Raised when user already exists."""
    def __init__(self, field: str, value: str):
        super().__init__(
            code="DUPLICATE_USER",
            message=f"User with {field} '{value}' already exists",
            details={"field": field, "value": value}
        )


class RoleNotFoundError(UserServiceError):
    """Raised when role is not found."""
    def __init__(self, role_id: int):
        super().__init__(
            code="ROLE_NOT_FOUND",
            message=f"Role with ID {role_id} not found",
            details={"role_id": role_id}
        )


class CivilityNotFoundError(UserServiceError):
    """Raised when civility is not found."""
    def __init__(self, civility_id: int):
        super().__init__(
            code="CIVILITY_NOT_FOUND",
            message=f"Civility with ID {civility_id} not found",
            details={"civility_id": civility_id}
        )


class SocietyNotFoundError(UserServiceError):
    """Raised when society is not found."""
    def __init__(self, society_id: int):
        super().__init__(
            code="SOCIETY_NOT_FOUND",
            message=f"Society with ID {society_id} not found",
            details={"society_id": society_id}
        )


# ==========================================================================
# User Service Class
# ==========================================================================

class UserService:
    """
    Service class for user operations.

    Handles CRUD operations, search, and password management for users.
    """

    def __init__(self, db: AsyncSession):
        """
        Initialize the user service.

        Args:
            db: Database session for operations.
        """
        self.db = db

    # ==========================================================================
    # Password Utilities
    # ==========================================================================

    @staticmethod
    def hash_password(password: str) -> str:
        """
        Hash a password using bcrypt.

        Args:
            password: Plain text password.

        Returns:
            Hashed password string.
        """
        return pwd_context.hash(password)

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """
        Verify a password against its hash.

        Args:
            plain_password: Plain text password.
            hashed_password: Hashed password to compare against.

        Returns:
            True if password matches, False otherwise.
        """
        return pwd_context.verify(plain_password, hashed_password)

    # ==========================================================================
    # Validation Helpers
    # ==========================================================================

    async def _validate_role(self, role_id: int) -> Role:
        """Validate that role exists."""
        result = await self.db.get(Role, role_id)
        if not result:
            raise RoleNotFoundError(role_id)
        return result

    async def _validate_civility(self, civility_id: int) -> Civility:
        """Validate that civility exists."""
        result = await self.db.get(Civility, civility_id)
        if not result:
            raise CivilityNotFoundError(civility_id)
        return result

    async def _validate_society(self, society_id: int) -> Society:
        """Validate that society exists."""
        result = await self.db.get(Society, society_id)
        if not result:
            raise SocietyNotFoundError(society_id)
        return result

    async def _get_user_by_login(self, login: str) -> Optional[User]:
        """Get user by login (internal helper)."""
        query = select(User).where(User.usr_login == login)
        result = await self.db.execute(query)
        return result.scalars().first()

    async def _get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email (internal helper)."""
        query = select(User).where(User.usr_email == email)
        result = await self.db.execute(query)
        return result.scalars().first()

    # ==========================================================================
    # User CRUD Operations
    # ==========================================================================

    async def create_user(
        self,
        data: UserCreate,
        creator_id: Optional[int] = None
    ) -> User:
        """
        Create a new user.

        Args:
            data: User creation data.
            creator_id: ID of the user creating this user.

        Returns:
            Created User object.

        Raises:
            DuplicateUserError: If a user with the same login or email already exists.
            RoleNotFoundError: If role doesn't exist.
            CivilityNotFoundError: If civility doesn't exist.
            SocietyNotFoundError: If society doesn't exist.
        """
        # Check for duplicate login
        existing = await self._get_user_by_login(data.usr_login)
        if existing:
            raise DuplicateUserError("login", data.usr_login)

        # Check for duplicate email if provided
        if data.usr_email:
            existing = await self._get_user_by_email(data.usr_email)
            if existing:
                raise DuplicateUserError("email", data.usr_email)

        # Validate foreign keys
        await self._validate_role(data.rol_id)
        await self._validate_civility(data.civ_id)
        await self._validate_society(data.soc_id)

        # Create user
        user_data = data.model_dump()

        # Hash the password
        user_data["usr_pwd"] = self.hash_password(user_data["usr_pwd"])

        # Set timestamps
        now = datetime.now()
        user_data["usr_d_creation"] = now
        user_data["usr_d_update"] = now

        # Set creator if provided
        if creator_id:
            user_data["usr_creator_id"] = creator_id

        user = User(**user_data)

        self.db.add(user)
        await self.db.flush()
        await self.db.refresh(user)

        # Reload with relationships
        return await self.get_user(user.usr_id)

    async def get_user(self, user_id: int) -> User:
        """
        Get user by ID with related data.

        Args:
            user_id: The user ID.

        Returns:
            User object with relationships loaded.

        Raises:
            UserNotFoundError: If user not found.
        """
        query = (
            select(User)
            .options(
                selectinload(User.role),
                selectinload(User.civility),
                selectinload(User.society)
            )
            .where(User.usr_id == user_id)
        )
        result = await self.db.execute(query)
        user = result.scalars().first()
        if not user:
            raise UserNotFoundError(user_id)
        return user

    async def get_user_by_login(self, login: str) -> User:
        """
        Get user by login with related data.

        Args:
            login: The user's login/username.

        Returns:
            User object with relationships loaded.

        Raises:
            UserLoginNotFoundError: If user not found.
        """
        query = (
            select(User)
            .options(
                selectinload(User.role),
                selectinload(User.civility),
                selectinload(User.society)
            )
            .where(User.usr_login == login)
        )
        result = await self.db.execute(query)
        user = result.scalars().first()
        if not user:
            raise UserLoginNotFoundError(login)
        return user

    async def list_users(
        self,
        skip: int = 0,
        limit: int = 100,
        search_params: Optional[UserSearchParams] = None
    ) -> Tuple[List[User], int]:
        """
        List users with pagination and filtering.

        Args:
            skip: Number of records to skip.
            limit: Maximum number of records to return.
            search_params: Optional search/filter parameters.

        Returns:
            Tuple of (users list, total count).
        """
        # Build base query with filters
        base_filters = []

        if search_params:
            # Text search across multiple fields
            if search_params.search:
                search_term = f"%{search_params.search}%"
                base_filters.append(
                    or_(
                        User.usr_login.ilike(search_term),
                        User.usr_firstname.ilike(search_term),
                        User.usr_lastname.ilike(search_term),
                        User.usr_email.ilike(search_term)
                    )
                )

            # Exact match filters
            if search_params.role_id is not None:
                base_filters.append(User.rol_id == search_params.role_id)

            if search_params.society_id is not None:
                base_filters.append(User.soc_id == search_params.society_id)

            if search_params.is_active is not None:
                base_filters.append(User.usr_is_actived == search_params.is_active)

            if search_params.is_admin is not None:
                if search_params.is_admin:
                    # Filter for admins (super_right=True OR rol_id in (1, 5))
                    base_filters.append(
                        or_(
                            User.usr_super_right == True,
                            User.rol_id.in_([1, 5])
                        )
                    )
                else:
                    # Filter for non-admins
                    base_filters.append(User.usr_super_right == False)
                    base_filters.append(~User.rol_id.in_([1, 5]))

        # Get total count
        count_query = select(func.count(User.usr_id))
        if base_filters:
            count_query = count_query.where(*base_filters)
        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        # Get users with relationships
        query = (
            select(User)
            .options(
                selectinload(User.role),
                selectinload(User.civility),
                selectinload(User.society)
            )
            .order_by(User.usr_login)
            .offset(skip)
            .limit(limit)
        )
        if base_filters:
            query = query.where(*base_filters)

        result = await self.db.execute(query)
        users = list(result.scalars().all())

        return users, total

    async def update_user(
        self,
        user_id: int,
        data: UserUpdate,
        updater_id: Optional[int] = None
    ) -> User:
        """
        Update a user.

        Args:
            user_id: The user ID.
            data: Update data.
            updater_id: ID of the user performing the update.

        Returns:
            Updated User object.

        Raises:
            UserNotFoundError: If user not found.
            DuplicateUserError: If new login/email already exists for another user.
            RoleNotFoundError: If role doesn't exist.
            CivilityNotFoundError: If civility doesn't exist.
            SocietyNotFoundError: If society doesn't exist.
        """
        user = await self.get_user(user_id)

        update_data = data.model_dump(exclude_unset=True)

        # Check for duplicate login if changing
        if "usr_login" in update_data and update_data["usr_login"]:
            existing = await self._get_user_by_login(update_data["usr_login"])
            if existing and existing.usr_id != user_id:
                raise DuplicateUserError("login", update_data["usr_login"])

        # Check for duplicate email if changing
        if "usr_email" in update_data and update_data["usr_email"]:
            existing = await self._get_user_by_email(update_data["usr_email"])
            if existing and existing.usr_id != user_id:
                raise DuplicateUserError("email", update_data["usr_email"])

        # Validate foreign keys if changing
        if "rol_id" in update_data:
            await self._validate_role(update_data["rol_id"])

        if "civ_id" in update_data:
            await self._validate_civility(update_data["civ_id"])

        if "soc_id" in update_data:
            await self._validate_society(update_data["soc_id"])

        # Hash password if being updated
        if "usr_pwd" in update_data and update_data["usr_pwd"]:
            update_data["usr_pwd"] = self.hash_password(update_data["usr_pwd"])

        # Update fields
        for field, value in update_data.items():
            setattr(user, field, value)

        # Update timestamp
        user.usr_d_update = datetime.now()

        await self.db.flush()
        await self.db.refresh(user)

        # Reload with relationships
        return await self.get_user(user_id)

    async def delete_user(self, user_id: int) -> bool:
        """
        Soft delete a user (sets is_actived to False).

        Args:
            user_id: The user ID.

        Returns:
            True if deleted successfully.

        Raises:
            UserNotFoundError: If user not found.
        """
        user = await self.get_user(user_id)
        user.usr_is_actived = False
        user.usr_d_update = datetime.now()
        await self.db.flush()
        return True

    async def hard_delete_user(self, user_id: int) -> bool:
        """
        Permanently delete a user.

        Args:
            user_id: The user ID.

        Returns:
            True if deleted successfully.

        Raises:
            UserNotFoundError: If user not found.
            UserValidationError: If user has related records.
        """
        user = await self.get_user(user_id)

        # Check for related records that might prevent deletion
        if hasattr(user, 'created_users') and user.created_users:
            raise UserValidationError(
                f"Cannot delete user '{user.usr_login}' as they have created {len(user.created_users)} other user(s)",
                details={
                    "user_id": user_id,
                    "created_users_count": len(user.created_users)
                }
            )

        await self.db.delete(user)
        await self.db.flush()
        return True

    # ==========================================================================
    # Lookup Methods
    # ==========================================================================

    async def get_users_lookup(
        self,
        active_only: bool = True
    ) -> List[User]:
        """
        Get users for dropdown/lookup.

        Args:
            active_only: Only return active users.

        Returns:
            List of User objects (lightweight).
        """
        query = select(User).order_by(User.usr_login)

        if active_only:
            query = query.where(User.usr_is_actived == True)

        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_roles_lookup(
        self,
        active_only: bool = True
    ) -> List[Role]:
        """
        Get roles for dropdown/lookup.

        Args:
            active_only: Only return active roles.

        Returns:
            List of Role objects.
        """
        query = select(Role).order_by(Role.rol_name)

        if active_only:
            query = query.where(Role.rol_active == True)

        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_civilities_lookup(
        self,
        active_only: bool = True
    ) -> List[Civility]:
        """
        Get civilities for dropdown/lookup.

        Args:
            active_only: Only return active civilities.

        Returns:
            List of Civility objects.
        """
        query = select(Civility).order_by(Civility.civ_designation)

        if active_only:
            query = query.where(Civility.civ_active == True)

        result = await self.db.execute(query)
        return list(result.scalars().all())


# ==========================================================================
# Dependency Injection
# ==========================================================================

async def get_user_service(
    db: AsyncSession = Depends(get_db)
) -> UserService:
    """
    Dependency to get UserService instance.

    Args:
        db: Database session from dependency.

    Returns:
        UserService instance.
    """
    return UserService(db)
