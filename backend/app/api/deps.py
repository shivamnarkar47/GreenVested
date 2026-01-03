from app.auth import get_current_user
from app.models import User
from typing import Optional


async def get_current_user_optional(user: Optional[User] = None) -> Optional[User]:
    return user


async def get_db():
    pass
