#!/usr/bin/env python3
"""
Script to debug user submissions and user IDs
"""

import asyncio
import sys
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, func
from models import Task, User, Submission

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Database configuration
DATABASE_URL = "postgresql+asyncpg://postgres.uvrlhkwlaoivtznjpiaj:CHUGHrags31%40@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"

async def debug_user_submissions():
    """Debug user submissions and user IDs"""
    print("=== Debugging User Submissions ===")
    
    # Create async engine
    engine = create_async_engine(DATABASE_URL, echo=False)
    
    # Create async session
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        try:
            # Get all users
            result = await session.execute(
                select(User).where(User.role == "ambassador")
            )
            users = result.scalars().all()
            
            print(f"\n=== Users (Ambassadors) ===")
            for user in users[:10]:  # Show first 10
                print(f"  - ID: {user.id}, Name: {user.name}, Email: {user.email}")
            
            # Get all submissions
            result = await session.execute(
                select(Submission).limit(10)
            )
            submissions = result.scalars().all()
            
            print(f"\n=== Submissions (First 10) ===")
            for sub in submissions:
                print(f"  - ID: {sub.id}, User ID: {sub.user_id}, Status: {sub.status}, Task ID: {sub.task_id}")
            
            # Check if any user IDs match
            print(f"\n=== Checking User ID Matches ===")
            user_ids = {user.id for user in users}
            submission_user_ids = {sub.user_id for sub in submissions}
            
            print(f"User IDs in users table: {len(user_ids)}")
            print(f"User IDs in submissions table: {len(submission_user_ids)}")
            
            matching_ids = user_ids.intersection(submission_user_ids)
            print(f"Matching user IDs: {len(matching_ids)}")
            
            if matching_ids:
                print(f"Matching IDs: {list(matching_ids)[:5]}")
            else:
                print("❌ NO MATCHING USER IDs FOUND!")
                print(f"Sample user IDs: {list(user_ids)[:3]}")
                print(f"Sample submission user IDs: {list(submission_user_ids)[:3]}")
            
            # Check for specific users that should have submissions
            print(f"\n=== Checking Specific Users ===")
            for user in users[:5]:
                result = await session.execute(
                    select(func.count(Submission.id))
                    .where(Submission.user_id == user.id)
                )
                count = result.scalar()
                print(f"  - {user.name} (ID: {user.id}): {count} submissions")
                
                if count > 0:
                    # Get sample submissions for this user
                    result = await session.execute(
                        select(Submission)
                        .where(Submission.user_id == user.id)
                        .limit(3)
                    )
                    user_submissions = result.scalars().all()
                    for sub in user_submissions:
                        print(f"    - Submission {sub.id}: Status={sub.status}, Task={sub.task_id}")
                
        except Exception as e:
            print(f"Database error: {e}")
        finally:
            await session.close()
    
    await engine.dispose()

if __name__ == "__main__":
    print("Debugging user submissions...")
    asyncio.run(debug_user_submissions())
    print("\nDone!")
