#!/usr/bin/env python3

import asyncio
import sys
import os

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.database_service import DatabaseService
from db import AsyncSessionLocal

async def check_user_files():
    async with AsyncSessionLocal() as session:
        db_service = DatabaseService(session)
        
        print("=== Checking all users and their files ===")
        users = await db_service.get_all_users()
        
        for user in users:
            print(f"\nUser: {user.name} ({user.email}) - Role: {user.role}")
            
            if user.email == 'testuser@example.com':
                print("  *** This is the test user! ***")
            
            submissions = await db_service.get_user_submissions(user.id)
            print(f"  Submissions count: {len(submissions)}")
            
            for i, sub in enumerate(submissions):
                print(f"    Submission {i+1} (ID: {sub.id}):")
                print(f"      Task ID: {sub.task_id}")
                print(f"      Day: {sub.day}")
                print(f"      Status: {sub.status}")
                print(f"      Files count: {len(sub.files) if sub.files else 0}")
                
                if sub.files:
                    for j, file in enumerate(sub.files):
                        print(f"        File {j+1}: {file.file_url}")
                        print(f"        File type: {file.file_type}")
                        print(f"        Uploaded at: {file.uploaded_at}")
                else:
                    print("        No files found")
                
                # Check if this submission has proof_image
                if hasattr(sub, 'proof_image') and sub.proof_image:
                    print(f"      Proof image: {sub.proof_image}")

if __name__ == "__main__":
    asyncio.run(check_user_files())
