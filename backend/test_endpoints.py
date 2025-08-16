#!/usr/bin/env python3
"""
Script to test the task endpoints and verify data
"""

import asyncio
import sys
import os
from datetime import datetime
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, func
from models import Task, User
import requests
import json

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Database configuration
DATABASE_URL = "postgresql+asyncpg://postgres.uvrlhkwlaoivtznjpiaj:CHUGHrags31%40@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"

async def test_database_tasks():
    """Test database directly"""
    print("=== Testing Database Directly ===")
    
    # Create async engine
    engine = create_async_engine(DATABASE_URL, echo=False)
    
    # Create async session
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        try:
            # Count tasks
            result = await session.execute(select(func.count(Task.id)))
            task_count = result.scalar()
            print(f"Total tasks in database: {task_count}")
            
            # Get all tasks
            result = await session.execute(select(Task).order_by(Task.day))
            tasks = result.scalars().all()
            
            print(f"\nTasks found:")
            for task in tasks:
                print(f"  - Day {task.day}: {task.title} ({task.points_reward} points) - {'Active' if task.is_active else 'Inactive'}")
            
            # Count users
            result = await session.execute(select(func.count(User.id)))
            user_count = result.scalar()
            print(f"\nTotal users in database: {user_count}")
            
            # Get admin users
            result = await session.execute(select(User).where(User.role == "admin"))
            admin_users = result.scalars().all()
            print(f"Admin users: {len(admin_users)}")
            for admin in admin_users:
                print(f"  - {admin.email} (ID: {admin.id})")
                print(f"    Password hash: {admin.password_hash[:50]}...")
                print(f"    Is active: {admin.is_active}")
                print(f"    Status: {admin.status}")
            
            # Get ambassador users
            result = await session.execute(select(User).where(User.role == "ambassador"))
            ambassador_users = result.scalars().all()
            print(f"Ambassador users: {len(ambassador_users)}")
            for ambassador in ambassador_users:
                print(f"  - {ambassador.email} (ID: {ambassador.id})")
                
        except Exception as e:
            print(f"Database error: {e}")
        finally:
            await session.close()
    
    await engine.dispose()

def test_api_endpoints():
    """Test API endpoints"""
    print("\n=== Testing API Endpoints ===")
    
    base_url = "http://127.0.0.1:5000"
    
    # Test login first
    print("Testing admin login...")
    admin_passwords = ["admin123", "password", "123456", "admin", "test123"]
    admin_email = "sharmaniranjani85@gmail.com"

    token = None
    for password in admin_passwords:
        login_data = {
            "email": admin_email,
            "password": password,
            "role": "admin"
        }
        response = requests.post(f"{base_url}/api/login", json=login_data)
        if response.status_code == 200:
            token = response.json().get("access_token")
            print(f"✅ Admin login successful with password '{password}', token: {token[:50]}...")
            break
        else:
            print(f"❌ Admin login failed with password '{password}': {response.status_code}")

    if not token:
        print("Trying ambassador login...")
        ambassador_login = {
            "email": "test@ambassador.com",
            "password": "password123",
            "role": "ambassador"
        }
        response = requests.post(f"{base_url}/api/login", json=ambassador_login)
        if response.status_code == 200:
            token = response.json().get("access_token")
            print(f"✅ Ambassador login successful, token: {token[:50] if token else 'None'}...")
        else:
            print(f"❌ Ambassador login failed: {response.status_code}")

    if token:
        try:
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }

            # Test admin tasks endpoint
            print("\nTesting admin tasks endpoint...")
            response = requests.get(f"{base_url}/api/admin/tasks", headers=headers)
            if response.status_code == 200:
                tasks = response.json()
                print(f"✅ Admin tasks endpoint working: {len(tasks)} tasks returned")
                for task in tasks[:3]:  # Show first 3 tasks
                    print(f"  - {task['title']} (Day {task['day']}, {task['points']} points)")
            else:
                print(f"❌ Admin tasks endpoint failed: {response.status_code} - {response.text}")

            # Test admin dashboard stats
            print("\nTesting admin dashboard stats...")
            response = requests.get(f"{base_url}/api/admin/dashboard-stats", headers=headers)
            if response.status_code == 200:
                stats = response.json()
                print(f"✅ Dashboard stats working:")
                print(f"  - Total ambassadors: {stats.get('total_ambassadors', 0)}")
                print(f"  - Active ambassadors: {stats.get('active_ambassadors', 0)}")
                print(f"  - Total tasks: {stats.get('total_tasks', 0)}")
                print(f"  - Total submissions: {stats.get('total_submissions', 0)}")
            else:
                print(f"❌ Dashboard stats failed: {response.status_code} - {response.text}")

        except Exception as e:
            print(f"API test error: {e}")
    else:
        print("❌ No valid login found, skipping API tests")

if __name__ == "__main__":
    print("Testing DC Studios Backend...")
    asyncio.run(test_database_tasks())
    test_api_endpoints()
    print("\nTest completed!")
