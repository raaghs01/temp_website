from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, and_, desc
from sqlalchemy.orm import selectinload
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from models import User, Task, Submission, Analytics
import uuid

class DatabaseService:
    def __init__(self, session: AsyncSession):
        self.session = session
    
    # User operations
    async def create_user(self, user_data: dict) -> str:
        user = User(**user_data)
        self.session.add(user)
        await self.session.commit()
        await self.session.refresh(user)
        return user.id
    
    async def get_user_by_email(self, email: str) -> Optional[User]:
        result = await self.session.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()
    
    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        result = await self.session.execute(
            select(User).where(User.id == user_id)
        )
        return result.scalar_one_or_none()
    
    async def update_user(self, user_id: str, update_data: dict) -> bool:
        result = await self.session.execute(
            update(User)
            .where(User.id == user_id)
            .values(**update_data, updated_at=datetime.utcnow())
        )
        await self.session.commit()
        return result.rowcount > 0
    
    # Task operations
    async def get_tasks_by_day(self, day: int) -> List[Task]:
        result = await self.session.execute(
            select(Task).where(and_(Task.day == day, Task.is_active == True))
        )
        return result.scalars().all()
    
    async def get_all_active_tasks(self) -> List[Task]:
        result = await self.session.execute(
            select(Task).where(Task.is_active == True).order_by(Task.day)
        )
        return result.scalars().all()
    
    async def create_task(self, task_data: dict) -> str:
        task = Task(**task_data)
        self.session.add(task)
        await self.session.commit()
        await self.session.refresh(task)
        return task.id
    
    async def get_task_by_id(self, task_id: str) -> Optional[Task]:
        result = await self.session.execute(
            select(Task).where(Task.id == task_id)
        )
        return result.scalar_one_or_none()
    
    async def get_task_by_day(self, day: int) -> Optional[Task]:
        result = await self.session.execute(
            select(Task).where(and_(Task.day == day, Task.is_active == True))
        )
        return result.scalar_one_or_none()
    
    # Submission operations
    async def create_submission(self, submission_data: dict) -> str:
        submission = Submission(**submission_data)
        self.session.add(submission)
        await self.session.commit()
        await self.session.refresh(submission)
        return submission.id
    
    async def get_user_submissions(self, user_id: str) -> List[Submission]:
        result = await self.session.execute(
            select(Submission)
            .where(Submission.user_id == user_id)
            .order_by(desc(Submission.submission_date))
            .options(selectinload(Submission.task))
        )
        return result.scalars().all()
    
    async def get_submission_by_user_task(self, user_id: str, task_id: str) -> Optional[Submission]:
        result = await self.session.execute(
            select(Submission).where(
                and_(Submission.user_id == user_id, Submission.task_id == task_id)
            )
        )
        return result.scalar_one_or_none()
    
    async def get_submission_by_user_and_task(self, user_id: str, task_id: str) -> Optional[Submission]:
        result = await self.session.execute(
            select(Submission).where(
                and_(Submission.user_id == user_id, Submission.task_id == task_id)
            )
        )
        return result.scalar_one_or_none()
    
    async def update_submission(self, submission_id: str, update_data: dict) -> bool:
        result = await self.session.execute(
            update(Submission)
            .where(Submission.id == submission_id)
            .values(**update_data)
        )
        await self.session.commit()
        return result.rowcount > 0
    
    # Analytics operations
    async def get_leaderboard(self, limit: int = 50) -> List[User]:
        result = await self.session.execute(
            select(User)
            .where(and_(User.role == "ambassador", User.is_active == True))
            .order_by(desc(User.total_points), desc(User.total_referrals))
            .limit(limit)
        )
        return result.scalars().all()
    
    async def get_user_analytics(self, user_id: str, days: int = 30) -> List[Analytics]:
        start_date = datetime.utcnow() - timedelta(days=days)
        result = await self.session.execute(
            select(Analytics)
            .where(and_(Analytics.user_id == user_id, Analytics.date >= start_date))
            .order_by(Analytics.date)
        )
        return result.scalars().all()
    
    async def update_user_points(self, user_id: str, points_change: int, referrals_change: int = 0) -> bool:
        result = await self.session.execute(
            update(User)
            .where(User.id == user_id)
            .values(
                total_points=User.total_points + points_change,
                total_referrals=User.total_referrals + referrals_change
            )
        )
        await self.session.commit()
        return result.rowcount > 0
    
    async def update_user_current_day(self, user_id: str, new_day: int) -> bool:
        result = await self.session.execute(
            update(User)
            .where(User.id == user_id)
            .values(current_day=new_day)
        )
        await self.session.commit()
        return result.rowcount > 0
    
    async def update_user_password(self, user_id: str, new_password_hash: str) -> bool:
        result = await self.session.execute(
            update(User)
            .where(User.id == user_id)
            .values(password_hash=new_password_hash)
        )
        await self.session.commit()
        return result.rowcount > 0

    async def get_all_users(self) -> List[User]:
        result = await self.session.execute(
            select(User).order_by(desc(User.registration_date))
        )
        return result.scalars().all()

    async def get_all_submissions(self) -> List[Submission]:
        result = await self.session.execute(
            select(Submission).order_by(desc(Submission.submission_date))
        )
        return result.scalars().all()
