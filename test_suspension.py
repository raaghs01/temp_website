#!/usr/bin/env python3
"""
Test script to verify user suspension functionality
"""

import requests
import json

BACKEND_URL = "http://127.0.0.1:5000"

def test_admin_login():
    """Test admin login to get admin token"""
    print("🔐 Testing admin login...")
    
    login_data = {
        "email": "admin@test.com",
        "password": "admin123",
        "role": "admin"
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/api/login", json=login_data)
        if response.status_code == 200:
            data = response.json()
            print("✅ Admin login successful")
            return data["token"]
        else:
            print(f"❌ Admin login failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Admin login error: {e}")
        return None

def test_suspend_user(admin_token, user_id):
    """Test suspending a user"""
    print(f"🚫 Testing user suspension for user ID: {user_id}")
    
    headers = {
        "Authorization": f"Bearer {admin_token}",
        "Content-Type": "application/json"
    }
    
    suspend_data = {
        "user_id": user_id,
        "status": "suspended"
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/api/admin/suspend-user", 
                               json=suspend_data, headers=headers)
        if response.status_code == 200:
            print("✅ User suspended successfully")
            return True
        else:
            print(f"❌ User suspension failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ User suspension error: {e}")
        return False

def test_suspended_user_login():
    """Test login attempt by suspended user"""
    print("🔒 Testing suspended user login...")
    
    login_data = {
        "email": "niranjanisharma03@gmail.com",
        "password": "password123",  # You may need to adjust this password
        "role": "ambassador"
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/api/login", json=login_data)
        if response.status_code == 403:
            data = response.json()
            print(f"✅ Suspension working! Message: {data.get('detail', 'No message')}")
            return True
        elif response.status_code == 401:
            print("⚠️  Invalid credentials - user might not exist or wrong password")
            return False
        else:
            print(f"❌ Unexpected response: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Login test error: {e}")
        return False

def get_user_id_by_email(admin_token, email):
    """Get user ID by email"""
    print(f"🔍 Finding user ID for email: {email}")
    
    headers = {
        "Authorization": f"Bearer {admin_token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(f"{BACKEND_URL}/api/admin/ambassadors", headers=headers)
        if response.status_code == 200:
            ambassadors = response.json()
            for ambassador in ambassadors:
                if ambassador.get("email") == email:
                    print(f"✅ Found user ID: {ambassador.get('id')}")
                    return ambassador.get("id")
            print(f"❌ User with email {email} not found")
            return None
        else:
            print(f"❌ Failed to get ambassadors: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error getting user ID: {e}")
        return None

def test_activate_user(admin_token, user_id):
    """Test activating a user"""
    print(f"✅ Testing user activation for user ID: {user_id}")
    
    headers = {
        "Authorization": f"Bearer {admin_token}",
        "Content-Type": "application/json"
    }
    
    activate_data = {
        "user_id": user_id,
        "status": "active"
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/api/admin/activate-user", 
                               json=activate_data, headers=headers)
        if response.status_code == 200:
            print("✅ User activated successfully")
            return True
        else:
            print(f"❌ User activation failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ User activation error: {e}")
        return False

def main():
    """Main test function"""
    print("🚀 Starting suspension functionality test...")
    
    # Step 1: Login as admin
    admin_token = test_admin_login()
    if not admin_token:
        print("❌ Cannot proceed without admin token")
        return
    
    # Step 2: Get user ID for the target user
    target_email = "niranjanisharma03@gmail.com"
    user_id = get_user_id_by_email(admin_token, target_email)
    if not user_id:
        print("❌ Cannot proceed without user ID")
        return
    
    # Step 3: Suspend the user
    if test_suspend_user(admin_token, user_id):
        print("✅ User suspension successful")
        
        # Step 4: Test login attempt by suspended user
        if test_suspended_user_login():
            print("✅ Suspension blocking login works!")
        else:
            print("❌ Suspension not blocking login properly")
        
        # Step 5: Reactivate the user for cleanup
        print("\n🔄 Cleaning up - reactivating user...")
        if test_activate_user(admin_token, user_id):
            print("✅ User reactivated for cleanup")
        else:
            print("⚠️  Failed to reactivate user")
    else:
        print("❌ User suspension failed")
    
    print("\n🎉 Test completed!")

if __name__ == "__main__":
    main()
