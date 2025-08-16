#!/usr/bin/env python3
"""
Script to check submission statuses and create test completed submissions
"""

import asyncio
import sys
import os
from datetime import datetime
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, func, update
from models import Task, User, Submission
import uuid

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Database configuration
DATABASE_URL = "postgresql+asyncpg://postgres.uvrlhkwlaoivtznjpiaj:CHUGHrags31%40@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"

async def check_and_fix_submissions():
    """Check submission statuses and create test data"""
    print("=== Checking Submission Statuses ===")
    
    # Create async engine
    engine = create_async_engine(DATABASE_URL, echo=False)
    
    # Create async session
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        try:
            # Count total submissions
            result = await session.execute(select(func.count(Submission.id)))
            total_submissions = result.scalar()
            print(f"Total submissions in database: {total_submissions}")
            
            # Check submission statuses
            result = await session.execute(
                select(Submission.status, func.count(Submission.id))
                .group_by(Submission.status)
            )
            status_counts = result.all()
            
            print(f"\nSubmission status breakdown:")
            for status, count in status_counts:
                print(f"  - {status}: {count}")
            
            # Get some sample submissions
            result = await session.execute(
                select(Submission).limit(5)
            )
            sample_submissions = result.scalars().all()
            
            print(f"\nSample submissions:")
            for sub in sample_submissions:
                print(f"  - ID: {sub.id}, Status: {sub.status}, Status Text: '{sub.status_text}', User: {sub.user_id}")
            
            # Check if we have any completed submissions
            result = await session.execute(
                select(func.count(Submission.id))
                .where(Submission.status == "completed")
            )
            completed_count = result.scalar()
            
            print(f"\nCompleted submissions: {completed_count}")
            
            if completed_count == 0:
                print("\n=== Creating Test Completed Submissions ===")
                
                # Get some users and tasks
                result = await session.execute(
                    select(User).where(User.role == "ambassador").limit(5)
                )
                ambassadors = result.scalars().all()
                
                result = await session.execute(
                    select(Task).where(Task.is_active == True).limit(3)
                )
                tasks = result.scalars().all()
                
                if ambassadors and tasks:
                    # Create completed submissions for testing
                    for i, ambassador in enumerate(ambassadors[:3]):
                        for j, task in enumerate(tasks[:2]):  # 2 tasks per ambassador
                            submission = Submission(
                                id=uuid.uuid4(),
                                user_id=ambassador.id,
                                task_id=task.id,
                                day=task.day,
                                status_text=f"Completed task {task.title} successfully",
                                people_connected=5 + (i * 2),  # Varying numbers
                                points_earned=task.points_reward,
                                status="completed",  # This is the key field
                                submission_date=datetime.utcnow()
                            )
                            session.add(submission)
                            print(f"  Created completed submission for {ambassador.name} - {task.title}")
                    
                    await session.commit()
                    print(f"✅ Created test completed submissions!")
                else:
                    print("❌ No ambassadors or tasks found to create test submissions")
            
            # Update some existing pending submissions to completed for testing
            if total_submissions > 0 and completed_count < 5:
                print(f"\n=== Converting Some Pending Submissions to Completed ===")
                
                # Get some pending submissions
                result = await session.execute(
                    select(Submission)
                    .where(Submission.status == "pending")
                    .limit(5)
                )
                pending_submissions = result.scalars().all()
                
                for sub in pending_submissions:
                    sub.status = "completed"
                    sub.status_text = f"Task completed successfully - updated for testing"
                    sub.points_earned = sub.points_earned or 50  # Ensure points are set
                    print(f"  Updated submission {sub.id} to completed")
                
                await session.commit()
                print(f"✅ Updated {len(pending_submissions)} submissions to completed!")
            
            # Final count check
            result = await session.execute(
                select(func.count(Submission.id))
                .where(Submission.status == "completed")
            )
            final_completed_count = result.scalar()
            print(f"\nFinal completed submissions count: {final_completed_count}")
                
        except Exception as e:
            print(f"Database error: {e}")
        finally:
            await session.close()
    
    await engine.dispose()

if __name__ == "__main__":
    print("Checking and fixing submission statuses...")
    asyncio.run(check_and_fix_submissions())
    print("\nDone!")
