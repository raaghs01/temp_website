from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, and_, desc
from sqlalchemy.orm import selectinload
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from models import User, Task, Submission, Analytics, SubmissionFile
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
    
    async def create_task(self, task_data: dict) -> Task:
        task = Task(**task_data)
        self.session.add(task)
        await self.session.commit()
        await self.session.refresh(task)
        return task
    
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
            .options(
                selectinload(Submission.task),
                selectinload(Submission.files)
            )
        )
        return result.scalars().all()
    
    async def get_submission_by_user_task(self, user_id: str, task_id: str) -> Optional[Submission]:
        result = await self.session.execute(
            select(Submission)
            .where(and_(Submission.user_id == user_id, Submission.task_id == task_id))
            .options(selectinload(Submission.files))
        )
        return result.scalar_one_or_none()
    
    async def get_submission_by_user_and_task(self, user_id: str, task_id: str) -> Optional[Submission]:
        result = await self.session.execute(
            select(Submission)
            .where(and_(Submission.user_id == user_id, Submission.task_id == task_id))
            .options(selectinload(Submission.files))
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
    
    # Submission file operations
    async def create_submission_file(self, file_data: dict) -> str:
        """Create a new submission file record"""
        submission_file = SubmissionFile(**file_data)
        self.session.add(submission_file)
        await self.session.commit()
        await self.session.refresh(submission_file)
        return submission_file.id
    
    async def create_submission_files(self, submission_id: str, file_urls: List[str], file_types: List[str] = None) -> List[str]:
        """Create multiple submission file records for a submission"""
        file_ids = []
        file_types = file_types or [None] * len(file_urls)
        
        for i, file_url in enumerate(file_urls):
            file_data = {
                "submission_id": submission_id,
                "file_url": file_url,
                "file_type": file_types[i] if i < len(file_types) else None
            }
            submission_file = SubmissionFile(**file_data)
            self.session.add(submission_file)
            file_ids.append(submission_file.id)
        
        await self.session.commit()
        return file_ids
    
    async def get_submission_files(self, submission_id: str) -> List[SubmissionFile]:
        """Get all files for a specific submission"""
        result = await self.session.execute(
            select(SubmissionFile)
            .where(SubmissionFile.submission_id == submission_id)
            .order_by(SubmissionFile.uploaded_at)
        )
        return result.scalars().all()
    
    async def get_submission_file_by_id(self, file_id: str) -> Optional[SubmissionFile]:
        """Get a specific submission file by ID"""
        result = await self.session.execute(
            select(SubmissionFile).where(SubmissionFile.id == file_id)
        )
        return result.scalar_one_or_none()
    
    async def delete_submission_file(self, file_id: str) -> bool:
        """Delete a submission file by ID"""
        result = await self.session.execute(
            delete(SubmissionFile).where(SubmissionFile.id == file_id)
        )
        await self.session.commit()
        return result.rowcount > 0
    
    async def delete_submission_files_by_submission(self, submission_id: str) -> int:
        """Delete all files for a specific submission"""
        result = await self.session.execute(
            delete(SubmissionFile).where(SubmissionFile.submission_id == submission_id)
        )
        await self.session.commit()
        return result.rowcount
    
    async def update_submission_file(self, file_id: str, update_data: dict) -> bool:
        """Update a submission file record"""
        result = await self.session.execute(
            update(SubmissionFile)
            .where(SubmissionFile.id == file_id)
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

    async def get_all_ambassadors(self) -> List[User]:
        result = await self.session.execute(
            select(User)
            .where(User.role == "ambassador")
            .order_by(desc(User.total_points))
        )
        return result.scalars().all()

    async def get_detailed_submissions(self, group_leader: str = None, start_date: str = None, end_date: str = None) -> List[Submission]:
        query = select(Submission).options(
            selectinload(Submission.user),
            selectinload(Submission.task),
            selectinload(Submission.files)
        )

        conditions = []

        # Filter by group leader if specified
        if group_leader and group_leader != "all":
            conditions.append(User.group_leader_name == group_leader)
            query = query.join(User, Submission.user_id == User.id)

        # Filter by date range if specified
        if start_date:
            try:
                start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                conditions.append(Submission.submission_date >= start_dt)
            except ValueError:
                pass

        if end_date:
            try:
                end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                conditions.append(Submission.submission_date <= end_dt)
            except ValueError:
                pass

        if conditions:
            query = query.where(and_(*conditions))

        query = query.order_by(desc(Submission.submission_date))

        result = await self.session.execute(query)
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

    async def update_user_profile(self, user_id: str, profile_data: dict) -> bool:
        result = await self.session.execute(
            update(User)
            .where(User.id == user_id)
            .values(**profile_data)
        )
        await self.session.commit()
        return result.rowcount > 0

    async def get_all_users(self) -> List[User]:
        result = await self.session.execute(
            select(User).order_by(desc(User.registration_date))
        )
        return result.scalars().all()

    async def update_user_status(self, user_id: str, status: str) -> bool:
        """Update user status (active, inactive, suspended)"""
        result = await self.session.execute(
            update(User)
            .where(User.id == user_id)
            .values(status=status, is_active=(status == "active"))
        )
        await self.session.commit()
        return result.rowcount > 0

    async def get_task_by_id(self, task_id: str) -> Task:
        """Get a specific task by ID"""
        result = await self.session.execute(
            select(Task).where(Task.id == task_id)
        )
        return result.scalar_one_or_none()

    async def create_task(self, task_data: dict) -> str:
        """Create a new task"""
        new_task = Task(**task_data)
        self.session.add(new_task)
        await self.session.commit()
        await self.session.refresh(new_task)
        return str(new_task.id)

    async def update_task(self, task_id: str, update_data: dict) -> bool:
        """Update a task"""
        result = await self.session.execute(
            update(Task)
            .where(Task.id == task_id)
            .values(**update_data)
        )
        await self.session.commit()
        return result.rowcount > 0

    async def delete_task(self, task_id: str) -> bool:
        """Delete a task"""
        result = await self.session.execute(
            delete(Task).where(Task.id == task_id)
        )
        await self.session.commit()
        return result.rowcount > 0

    async def get_all_submissions(self) -> List[Submission]:
        result = await self.session.execute(
            select(Submission)
            .order_by(desc(Submission.submission_date))
            .options(selectinload(Submission.files))
        )
        return result.scalars().all()

    # Admin task management methods
    async def get_all_tasks(self) -> List[Task]:
        """Get all tasks including inactive ones for admin"""
        result = await self.session.execute(
            select(Task).order_by(Task.day)
        )
        return result.scalars().all()

    async def update_task(self, task_id: str, update_data: dict) -> Task:
        """Update a task with new data"""
        result = await self.session.execute(
            select(Task).where(Task.id == task_id)
        )
        task = result.scalar_one_or_none()

        if not task:
            raise ValueError(f"Task with id {task_id} not found")

        # Update fields
        for key, value in update_data.items():
            if hasattr(task, key):
                setattr(task, key, value)

        # Update timestamp
        task.updated_at = datetime.utcnow()

        await self.session.commit()
        await self.session.refresh(task)
        return task

    async def delete_task(self, task_id: str) -> bool:
        """Delete a task by ID"""
        result = await self.session.execute(
            select(Task).where(Task.id == task_id)
        )
        task = result.scalar_one_or_none()

        if not task:
            return False

        await self.session.delete(task)
        await self.session.commit()
        return True


