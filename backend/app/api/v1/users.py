"""
User API Router.

Provides REST API endpoints for:
- User CRUD operations
- User search and filtering
- User listing with pagination
- Lookup endpoints for roles and civilities
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.services.user_service import (
    UserService,
    get_user_service,
    UserServiceError,
    UserNotFoundError,
    UserLoginNotFoundError,
    UserValidationError,
    DuplicateUserError,
    RoleNotFoundError,
    CivilityNotFoundError,
    SocietyNotFoundError
)
from app.dependencies import get_current_user, get_current_admin_user
from app.schemas.user import (
    UserCreate, UserUpdate, UserResponse,
    UserListResponse, UserListPaginatedResponse,
    UserSearchParams, UserLookup, RoleLookup, CivilityLookup
)

router = APIRouter(prefix="/users", tags=["Users"])


# ==========================================================================
# Exception Handler Helper
# ==========================================================================

def handle_user_error(error: UserServiceError) -> HTTPException:
    """Convert UserServiceError to appropriate HTTPException."""
    status_code = status.HTTP_400_BAD_REQUEST

    if isinstance(error, (UserNotFoundError, UserLoginNotFoundError)):
        status_code = status.HTTP_404_NOT_FOUND
    elif isinstance(error, UserValidationError):
        status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    elif isinstance(error, DuplicateUserError):
        status_code = status.HTTP_409_CONFLICT
    elif isinstance(error, (RoleNotFoundError, CivilityNotFoundError, SocietyNotFoundError)):
        status_code = status.HTTP_422_UNPROCESSABLE_ENTITY

    return HTTPException(
        status_code=status_code,
        detail={
            "success": False,
            "error": {
                "code": error.code,
                "message": error.message,
                "details": error.details
            }
        }
    )


# ==========================================================================
# Lookup Endpoints (must come before parameterized routes)
# ==========================================================================

@router.get(
    "/lookup",
    response_model=List[UserLookup],
    summary="Get users for dropdown",
    description="""
    Get a lightweight list of users for dropdown/lookup components.

    Returns only essential fields: ID, login, name, and active status.
    Supports optional search query to filter by name, login, or email.
    """
)
async def get_users_lookup(
    q: Optional[str] = Query(None, max_length=100, description="Search query (name, login, or email)"),
    active_only: bool = Query(True, description="Only return active users"),
    limit: int = Query(50, ge=1, le=100, description="Maximum results to return"),
    service: UserService = Depends(get_user_service),
    current_user: User = Depends(get_current_user)
):
    """Get users for dropdown/lookup with optional search."""
    users = await service.get_users_lookup(active_only=active_only, search=q, limit=limit)
    return [UserLookup.model_validate(u) for u in users]


@router.get(
    "/roles/lookup",
    response_model=List[RoleLookup],
    summary="Get roles for dropdown",
    description="""
    Get a list of roles for dropdown/lookup components.

    Returns all roles with ID, name, and active status.
    """
)
async def get_roles_lookup(
    active_only: bool = Query(True, description="Only return active roles"),
    service: UserService = Depends(get_user_service),
    current_user: User = Depends(get_current_user)
):
    """Get roles for dropdown/lookup."""
    roles = await service.get_roles_lookup(active_only=active_only)
    return [RoleLookup.model_validate(r) for r in roles]


@router.get(
    "/civilities/lookup",
    response_model=List[CivilityLookup],
    summary="Get civilities for dropdown",
    description="""
    Get a list of civilities (Mr., Ms., Dr., etc.) for dropdown/lookup components.

    Returns all civilities with ID, designation, and active status.
    """
)
async def get_civilities_lookup(
    active_only: bool = Query(True, description="Only return active civilities"),
    service: UserService = Depends(get_user_service),
    current_user: User = Depends(get_current_user)
):
    """Get civilities for dropdown/lookup."""
    civilities = await service.get_civilities_lookup(active_only=active_only)
    return [CivilityLookup.model_validate(c) for c in civilities]


# ==========================================================================
# User CRUD Endpoints
# ==========================================================================

@router.post(
    "",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new user",
    description="""
    Create a new user in the system.

    Required fields: username, password, role_id, civility_id, society_id.
    The password will be securely hashed before storage.

    Note: Only admin users can create new users.
    """
)
async def create_user(
    data: UserCreate,
    service: UserService = Depends(get_user_service),
    current_user: User = Depends(get_current_admin_user)
):
    """Create a new user."""
    try:
        user = await service.create_user(data, creator_id=current_user.usr_id)
        return UserResponse.model_validate(user)
    except UserServiceError as e:
        raise handle_user_error(e)


@router.get(
    "",
    response_model=UserListPaginatedResponse,
    summary="List all users",
    description="""
    Get a paginated list of all users with optional filtering.

    Supports filtering by:
    - Text search (username, first name, last name, email)
    - Role ID
    - Society ID
    - Active status
    - Admin status
    """
)
async def list_users(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=500, description="Maximum records to return"),
    search: Optional[str] = Query(None, max_length=100, description="Search term"),
    role_id: Optional[int] = Query(None, description="Filter by role ID"),
    society_id: Optional[int] = Query(None, description="Filter by society ID"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    is_admin: Optional[bool] = Query(None, description="Filter by admin status"),
    service: UserService = Depends(get_user_service),
    current_user: User = Depends(get_current_user)
):
    """List all users with pagination and filtering."""
    search_params = UserSearchParams(
        search=search,
        role_id=role_id,
        society_id=society_id,
        is_active=is_active,
        is_admin=is_admin
    )

    users, total = await service.list_users(
        skip=skip,
        limit=limit,
        search_params=search_params
    )

    return UserListPaginatedResponse(
        items=[UserListResponse.model_validate(u) for u in users],
        total=total,
        skip=skip,
        limit=limit
    )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user",
    description="Get detailed information about the currently authenticated user."
)
async def get_current_user_info(
    service: UserService = Depends(get_user_service),
    current_user: User = Depends(get_current_user)
):
    """Get current authenticated user's information."""
    try:
        user = await service.get_user(current_user.usr_id)
        return UserResponse.model_validate(user)
    except UserServiceError as e:
        raise handle_user_error(e)


@router.get(
    "/by-login/{login}",
    response_model=UserResponse,
    summary="Get user by login",
    description="Get user by their login/username."
)
async def get_user_by_login(
    login: str = Path(..., min_length=1, max_length=200, description="User login/username"),
    service: UserService = Depends(get_user_service),
    current_user: User = Depends(get_current_user)
):
    """Get a specific user by login."""
    try:
        user = await service.get_user_by_login(login)
        return UserResponse.model_validate(user)
    except UserServiceError as e:
        raise handle_user_error(e)


@router.get(
    "/{user_id}",
    response_model=UserResponse,
    summary="Get user by ID",
    description="Get detailed information about a specific user."
)
async def get_user(
    user_id: int = Path(..., gt=0, description="User ID"),
    service: UserService = Depends(get_user_service),
    current_user: User = Depends(get_current_user)
):
    """Get a specific user by ID."""
    try:
        user = await service.get_user(user_id)
        return UserResponse.model_validate(user)
    except UserServiceError as e:
        raise handle_user_error(e)


@router.put(
    "/{user_id}",
    response_model=UserResponse,
    summary="Update a user",
    description="""
    Update an existing user's information.

    All fields are optional - only provided fields will be updated.
    If password is provided, it will be securely hashed.

    Note: Only admin users can update other users' information.
    Regular users can only update their own profile via /me endpoint.
    """
)
async def update_user(
    user_id: int = Path(..., gt=0, description="User ID"),
    data: UserUpdate = ...,
    service: UserService = Depends(get_user_service),
    current_user: User = Depends(get_current_admin_user)
):
    """Update an existing user."""
    try:
        user = await service.update_user(
            user_id,
            data,
            updater_id=current_user.usr_id
        )
        return UserResponse.model_validate(user)
    except UserServiceError as e:
        raise handle_user_error(e)


@router.put(
    "/me",
    response_model=UserResponse,
    summary="Update current user profile",
    description="""
    Update the current user's own profile information.

    Note: Some fields like role_id and super_right cannot be changed by the user themselves.
    """
)
async def update_current_user(
    data: UserUpdate,
    service: UserService = Depends(get_user_service),
    current_user: User = Depends(get_current_user)
):
    """Update current user's own profile."""
    # Prevent users from changing their own role or admin status
    safe_data = data.model_copy()
    safe_data.rol_id = None
    safe_data.usr_super_right = None
    safe_data.usr_is_actived = None
    safe_data.soc_id = None

    try:
        user = await service.update_user(
            current_user.usr_id,
            safe_data,
            updater_id=current_user.usr_id
        )
        return UserResponse.model_validate(user)
    except UserServiceError as e:
        raise handle_user_error(e)


@router.delete(
    "/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a user (soft delete)",
    description="""
    Soft delete a user by ID.

    This sets the user's is_actived flag to False.
    The user record is preserved for historical purposes.

    Note: Only admin users can delete other users.
    """
)
async def delete_user(
    user_id: int = Path(..., gt=0, description="User ID"),
    service: UserService = Depends(get_user_service),
    current_user: User = Depends(get_current_admin_user)
):
    """Soft delete a user."""
    # Prevent deleting yourself
    if user_id == current_user.usr_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "error": {
                    "code": "CANNOT_DELETE_SELF",
                    "message": "You cannot delete your own account",
                    "details": {}
                }
            }
        )

    try:
        await service.delete_user(user_id)
    except UserServiceError as e:
        raise handle_user_error(e)


@router.delete(
    "/{user_id}/permanent",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Permanently delete a user",
    description="""
    Permanently delete a user by ID.

    WARNING: This cannot be undone.
    Will fail if the user has created other users or has related records.

    Note: Only admin users can permanently delete users.
    """
)
async def hard_delete_user(
    user_id: int = Path(..., gt=0, description="User ID"),
    service: UserService = Depends(get_user_service),
    current_user: User = Depends(get_current_admin_user)
):
    """Permanently delete a user."""
    # Prevent deleting yourself
    if user_id == current_user.usr_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "error": {
                    "code": "CANNOT_DELETE_SELF",
                    "message": "You cannot delete your own account",
                    "details": {}
                }
            }
        )

    try:
        await service.hard_delete_user(user_id)
    except UserServiceError as e:
        raise handle_user_error(e)


# ==========================================================================
# Additional User Endpoints
# ==========================================================================

@router.patch(
    "/{user_id}/activate",
    response_model=UserResponse,
    summary="Activate a user",
    description="Set a user's is_actived flag to True."
)
async def activate_user(
    user_id: int = Path(..., gt=0, description="User ID"),
    service: UserService = Depends(get_user_service),
    current_user: User = Depends(get_current_admin_user)
):
    """Activate a user."""
    try:
        update_data = UserUpdate(usr_is_actived=True)
        user = await service.update_user(user_id, update_data)
        return UserResponse.model_validate(user)
    except UserServiceError as e:
        raise handle_user_error(e)


@router.patch(
    "/{user_id}/deactivate",
    response_model=UserResponse,
    summary="Deactivate a user",
    description="Set a user's is_actived flag to False."
)
async def deactivate_user(
    user_id: int = Path(..., gt=0, description="User ID"),
    service: UserService = Depends(get_user_service),
    current_user: User = Depends(get_current_admin_user)
):
    """Deactivate a user."""
    # Prevent deactivating yourself
    if user_id == current_user.usr_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "error": {
                    "code": "CANNOT_DEACTIVATE_SELF",
                    "message": "You cannot deactivate your own account",
                    "details": {}
                }
            }
        )

    try:
        update_data = UserUpdate(usr_is_actived=False)
        user = await service.update_user(user_id, update_data)
        return UserResponse.model_validate(user)
    except UserServiceError as e:
        raise handle_user_error(e)


@router.patch(
    "/{user_id}/change-password",
    response_model=UserResponse,
    summary="Change user's password",
    description="""
    Change a user's password.

    Note: Only admin users can change other users' passwords.
    """
)
async def change_user_password(
    user_id: int = Path(..., gt=0, description="User ID"),
    new_password: str = Query(..., min_length=6, max_length=200, description="New password"),
    service: UserService = Depends(get_user_service),
    current_user: User = Depends(get_current_admin_user)
):
    """Change a user's password."""
    try:
        update_data = UserUpdate(usr_pwd=new_password)
        user = await service.update_user(user_id, update_data)
        return UserResponse.model_validate(user)
    except UserServiceError as e:
        raise handle_user_error(e)


@router.patch(
    "/me/change-password",
    response_model=UserResponse,
    summary="Change current user's password",
    description="Change the current user's own password."
)
async def change_my_password(
    new_password: str = Query(..., min_length=6, max_length=200, description="New password"),
    service: UserService = Depends(get_user_service),
    current_user: User = Depends(get_current_user)
):
    """Change current user's own password."""
    try:
        update_data = UserUpdate(usr_pwd=new_password)
        user = await service.update_user(current_user.usr_id, update_data)
        return UserResponse.model_validate(user)
    except UserServiceError as e:
        raise handle_user_error(e)
