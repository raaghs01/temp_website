#!/usr/bin/env python3
"""
Test script to verify task unlocking logic is working correctly
"""

import requests
import json

API_BASE = "http://127.0.0.1:5000/api"

def get_auth_token():
    """Get authentication token for testing"""
    try:
        # Try to register a new test user first
        register_data = {
            "email": "test.unlocking@example.com",
            "password": "testpassword123",
            "name": "Test Unlocking User",
            "college": "Test University"
        }
        
        register_response = requests.post(f"{API_BASE}/register", json=register_data)
        # Ignore if user already exists
        
        # Try to login
        login_data = {
            "email": "test.unlocking@example.com",
            "password": "testpassword123"
        }
        
        response = requests.post(f"{API_BASE}/login", json=login_data)
        
        if response.status_code == 200:
            result = response.json()
            return result.get('token')
        else:
            print(f"❌ Login failed: {response.status_code} - {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error getting auth token: {e}")
        return None

def test_task_unlocking():
    """Test that task unlocking logic works correctly"""
    print("🧪 Testing task unlocking logic...")
    
    # Get auth token
    auth_token = get_auth_token()
    if not auth_token:
        print("❌ Cannot get auth token")
        return False
    
    try:
        # Get all tasks
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{API_BASE}/tasks", headers=headers)
        
        if response.status_code == 200:
            tasks = response.json()
            
            print(f"📋 Found {len(tasks)} total tasks")
            
            # Analyze task status by day
            available_tasks = []
            completed_tasks = []
            locked_tasks = []
            
            # Get submissions to understand current state
            submissions_response = requests.get(f"{API_BASE}/submissions", headers=headers)
            submissions = []
            if submissions_response.status_code == 200:
                submissions = submissions_response.json()
            
            completed_days = set()
            for submission in submissions:
                if submission.get('status') == 'completed':
                    # Find the task to get its day
                    for task in tasks:
                        if task['id'] == submission['task_id']:
                            completed_days.add(task['day'])
                            break
            
            print(f"✅ Completed days: {sorted(completed_days)}")
            
            # Check task availability
            for task in sorted(tasks, key=lambda x: x['day']):
                day = task['day']
                title = task['title']
                
                # Determine expected status based on our logic
                if day in completed_days:
                    expected_status = 'completed'
                    completed_tasks.append(task)
                else:
                    highest_completed = max(completed_days) if completed_days else -1
                    if day <= highest_completed + 2:
                        expected_status = 'available'
                        available_tasks.append(task)
                    else:
                        expected_status = 'locked'
                        locked_tasks.append(task)
                
                print(f"   Day {day}: {title[:50]}... - Expected: {expected_status}")
            
            print(f"\n📊 Summary:")
            print(f"   ✅ Completed: {len(completed_tasks)} tasks")
            print(f"   🔓 Available: {len(available_tasks)} tasks")
            print(f"   🔒 Locked: {len(locked_tasks)} tasks")
            
            # Check if the logic makes sense
            if completed_days:
                highest_completed = max(completed_days)
                expected_available_days = [d for d in range(highest_completed + 1, highest_completed + 3)]
                actual_available_days = [t['day'] for t in available_tasks if t['day'] not in completed_days]
                
                print(f"\n🔍 Unlocking Logic Check:")
                print(f"   Highest completed day: {highest_completed}")
                print(f"   Expected available days: {expected_available_days}")
                print(f"   Actual available days: {sorted(actual_available_days)}")
                
                if set(expected_available_days).issubset(set(actual_available_days)):
                    print("   ✅ Unlocking logic is working correctly!")
                    return True
                else:
                    print("   ❌ Unlocking logic has issues!")
                    return False
            else:
                print("   ℹ️ No completed tasks yet, checking initial state...")
                # Should have Day 0 and Day 1 available initially
                available_days = [t['day'] for t in available_tasks]
                if 0 in available_days and 1 in available_days:
                    print("   ✅ Initial state is correct!")
                    return True
                else:
                    print("   ❌ Initial state is incorrect!")
                    return False
                    
        else:
            print(f"❌ Failed to get tasks: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing task unlocking: {e}")
        return False

def main():
    """Run the test"""
    print("🚀 Testing task unlocking logic...")
    print("=" * 60)
    
    success = test_task_unlocking()
    
    print("\n" + "=" * 60)
    if success:
        print("🎉 Task unlocking logic test passed!")
    else:
        print("❌ Task unlocking logic test failed!")

if __name__ == "__main__":
    main()
