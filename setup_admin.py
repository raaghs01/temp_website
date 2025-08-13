#!/usr/bin/env python3
import asyncio
import sys
from pathlib import Path
import hashlib
import uuid
from datetime import datetime

# Add backend to path
backend_path = Path(__file__).parent / "backend"
sys.path.append(str(backend_path))

from db import AsyncSessionLocal, init_db
from models import User
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv(backend_path / '.env')

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

async def setup_admin():
    print("🔄 Initializing PostgreSQL database...")
    
    # Initialize PostgreSQL database
    success = await init_db()
    if not success:
        print("❌ Failed to initialize database")
        return
    
    async with AsyncSessionLocal() as session:
        try:
            print("🗑️ Clearing existing users...")
            # Clear existing users (if any)
            await session.execute("DELETE FROM users")
            await session.commit()
            
            print("👤 Creating test admin user...")
            admin_user = User(
                id=str(uuid.uuid4()),
                email="admin@test.com",
                password_hash=hash_password("admin123"),
                name="Admin User",
                college="Test University",
                group_leader_name="",
                role="admin",
                current_day=0,
                total_points=0,
                total_referrals=0,
                registration_date=datetime.utcnow(),
                is_active=True,
                status="active",
                rank_position=None
            )
            
            session.add(admin_user)
            await session.commit()
            
            print("✅ Admin user created successfully!")
            print(f"📧 Email: admin@test.com")
            print(f"🔑 Password: admin123")
            print(f"👑 Role: admin")
            
            # Create a test ambassador user
            print("\n👤 Creating test ambassador user...")
            ambassador_user = User(
                id=str(uuid.uuid4()),
                email="ambassador@test.com",
                password_hash=hash_password("ambassador123"),
                name="Test Ambassador",
                college="Test College",
                group_leader_name="Test Leader",
                role="ambassador",
                current_day=0,
                total_points=0,
                total_referrals=0,
                registration_date=datetime.utcnow(),
                is_active=True,
                status="active",
                rank_position=None
            )
            
            session.add(ambassador_user)
            await session.commit()
            
            print("✅ Ambassador user created successfully!")
            print(f"📧 Email: ambassador@test.com")
            print(f"🔑 Password: ambassador123")
            print(f"🎯 Role: ambassador")
            
            print("\n🎉 Setup completed successfully!")
            
        except Exception as e:
            print(f"❌ Error during setup: {e}")
            await session.rollback()
        finally:
            await session.close()

if __name__ == "__main__":
    asyncio.run(setup_admin()) 
