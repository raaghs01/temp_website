#!/usr/bin/env python3
import requests
import json

# Get backend URL from frontend .env file
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    except Exception as e:
        print(f"Error reading backend URL: {e}")
        return None

BASE_URL = get_backend_url()
API_BASE = f"{BASE_URL}/api"

# Test user
TEST_USER = {
    "email": "debug.user@test.edu",
    "password": "DebugPass123!",
    "name": "Debug User",
    "college": "Test University"
}

print("🔍 Debug Testing...")

# Register user
print("\n1. Registering user...")
response = requests.post(f"{API_BASE}/register", json=TEST_USER)
print(f"Registration: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    token = data["token"]
    print(f"Token received: {token[:20]}...")
    
    # Get tasks
    print("\n2. Getting tasks...")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{API_BASE}/tasks", headers=headers)
    print(f"Tasks: {response.status_code}")
    if response.status_code == 200:
        tasks = response.json()
        print(f"Found {len(tasks)} tasks")
        if tasks:
            task_id = tasks[0]["id"]
            print(f"First task ID: {task_id}")
            print(f"First task: {tasks[0]}")
            
            # Try to submit task
            print("\n3. Submitting task...")
            submission_data = {
                "task_id": task_id,
                "status_text": "Debug test submission",
                "people_connected": 1
            }
            
            response = requests.post(f"{API_BASE}/submit-task", json=submission_data, headers=headers)
            print(f"Submission: {response.status_code}")
            print(f"Response: {response.text}")
    else:
        print(f"Tasks error: {response.text}")
else:
    print(f"Registration error: {response.text}")