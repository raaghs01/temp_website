#!/usr/bin/env python3
"""
Script to populate the database with sample tasks for testing
"""

import asyncio
import sys
import os
from datetime import datetime
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, func, text
from models import Task, User
import uuid

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Database configuration
DATABASE_URL = "postgresql+asyncpg://postgres.uvrlhkwlaoivtznjpiaj:CHUGHrags31%40@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"

# Sample tasks data
SAMPLE_TASKS = [
    {
        "day": 0,
        "title": "Complete Orientation",
        "description": "Watch the orientation video and complete the welcome survey to get started with the DC Studios Ambassador Program.",
        "task_type": "orientation",
        "points_reward": 100,
        "requirements": {"video_watched": True, "survey_completed": True},
        "submission_guidelines": ["Watch the complete orientation video", "Fill out the welcome survey", "Submit confirmation"]
    },
    {
        "day": 1,
        "title": "Create Your Profile",
        "description": "Set up your ambassador profile with a professional photo and bio. This helps other ambassadors connect with you.",
        "task_type": "profile_setup",
        "points_reward": 50,
        "requirements": {"profile_photo": True, "bio_completed": True},
        "submission_guidelines": ["Upload a professional profile photo", "Write a compelling bio (minimum 100 words)", "Submit profile for review"]
    },
    {
        "day": 1,
        "title": "Join Community Groups",
        "description": "Join at least 3 relevant community groups or forums related to your field of study or interests.",
        "task_type": "community_engagement",
        "points_reward": 75,
        "requirements": {"groups_joined": 3},
        "submission_guidelines": ["Join 3 community groups", "Take screenshots of membership confirmations", "Submit proof of joining"]
    },
    {
        "day": 2,
        "title": "Share Your First Post",
        "description": "Create and share your first social media post about joining the DC Studios Ambassador Program.",
        "task_type": "social_media",
        "points_reward": 60,
        "requirements": {"post_created": True, "hashtags_used": True},
        "submission_guidelines": ["Create a post about joining the program", "Use required hashtags #DCStudios #Ambassador", "Submit link to your post"]
    },
    {
        "day": 3,
        "title": "Connect with 5 Ambassadors",
        "description": "Reach out and connect with 5 other ambassadors in the program. Building your network is key to success.",
        "task_type": "networking",
        "points_reward": 80,
        "requirements": {"connections_made": 5},
        "submission_guidelines": ["Connect with 5 ambassadors", "Send personalized connection messages", "Submit list of connections made"]
    },
    {
        "day": 4,
        "title": "Attend Virtual Workshop",
        "description": "Attend the weekly virtual workshop on leadership and personal branding.",
        "task_type": "workshop",
        "points_reward": 100,
        "requirements": {"workshop_attended": True, "notes_submitted": True},
        "submission_guidelines": ["Attend the full workshop session", "Take detailed notes", "Submit workshop reflection (200+ words)"]
    },
    {
        "day": 5,
        "title": "Create Content Piece",
        "description": "Create an original piece of content (blog post, video, infographic) related to your field of expertise.",
        "task_type": "content_creation",
        "points_reward": 120,
        "requirements": {"content_created": True, "original_work": True},
        "submission_guidelines": ["Create original content", "Ensure it's relevant to your field", "Submit link or file of your content"]
    },
    {
        "day": 6,
        "title": "Mentor a New Ambassador",
        "description": "Help onboard a new ambassador by providing guidance and answering their questions.",
        "task_type": "mentoring",
        "points_reward": 90,
        "requirements": {"mentoring_session": True, "feedback_provided": True},
        "submission_guidelines": ["Connect with a new ambassador", "Provide guidance and support", "Submit mentoring session summary"]
    },
    {
        "day": 7,
        "title": "Weekly Reflection",
        "description": "Submit a weekly reflection on your ambassador journey, challenges faced, and goals for the upcoming week.",
        "task_type": "reflection",
        "points_reward": 70,
        "requirements": {"reflection_submitted": True, "goals_set": True},
        "submission_guidelines": ["Write a detailed reflection (300+ words)", "Include challenges and learnings", "Set 3 goals for next week"]
    },
    {
        "day": 8,
        "title": "Organize Study Group",
        "description": "Organize and lead a study group session for fellow ambassadors in your field or area of interest.",
        "task_type": "leadership",
        "points_reward": 110,
        "requirements": {"study_group_organized": True, "participants_minimum": 3},
        "submission_guidelines": ["Organize a study group", "Have at least 3 participants", "Submit session summary and participant feedback"]
    }
]

async def populate_tasks():
    """Populate the database with sample tasks"""
    
    # Create async engine
    engine = create_async_engine(DATABASE_URL, echo=True)
    
    # Create async session
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        try:
            # Check if tasks already exist
            result = await session.execute(select(func.count(Task.id)))
            task_count = result.scalar()
            
            if task_count > 0:
                print(f"Database already has {task_count} tasks. Skipping population.")
                return
            
            print("Populating database with sample tasks...")
            
            # Create tasks
            for task_data in SAMPLE_TASKS:
                task = Task(
                    id=uuid.uuid4(),
                    day=task_data["day"],
                    title=task_data["title"],
                    description=task_data["description"],
                    task_type=task_data["task_type"],
                    points_reward=task_data["points_reward"],
                    requirements=task_data["requirements"],
                    submission_guidelines=task_data["submission_guidelines"],
                    is_active=True,
                    created_by="system",
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                session.add(task)
            
            # Commit the changes
            await session.commit()
            print(f"Successfully created {len(SAMPLE_TASKS)} sample tasks!")
            
        except Exception as e:
            print(f"Error populating tasks: {e}")
            await session.rollback()
        finally:
            await session.close()
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(populate_tasks())
