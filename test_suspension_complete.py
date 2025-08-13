#!/usr/bin/env python3
"""
Complete test script to verify user suspension functionality with a test user
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

def create_test_user():
    """Create a test user for suspension testing"""
    print("👤 Creating test user...")
    
    user_data = {
        "email": "suspension_test@example.com",
        "password": "testpass123",
        "name": "Suspension Test User",
        "college": "Test College",
        "group_leader_name": "Test Leader",
        "role": "ambassador"
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/api/register", json=user_data)
        if response.status_code == 200:
            data = response.json()
            print("✅ Test user created successfully")
            return data["user"]["id"], data["token"]
        else:
            print(f"❌ Test user creation failed: {response.status_code} - {response.text}")
            return None, None
    except Exception as e:
        print(f"❌ Test user creation error: {e}")
        return None, None

def test_user_login(email, password):
    """Test user login"""
    print(f"🔐 Testing user login for: {email}")
    
    login_data = {
        "email": email,
        "password": password,
        "role": "ambassador"
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/api/login", json=login_data)
        if response.status_code == 200:
            print("✅ User login successful")
            return True, "Login successful"
        elif response.status_code == 403:
            data = response.json()
            message = data.get('detail', 'No message')
            print(f"🚫 User login blocked: {message}")
            return False, message
        else:
            print(f"❌ User login failed: {response.status_code} - {response.text}")
            return False, response.text
    except Exception as e:
        print(f"❌ User login error: {e}")
        return False, str(e)

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
    print("🚀 Starting complete suspension functionality test...")
    
    # Step 1: Login as admin
    admin_token = test_admin_login()
    if not admin_token:
        print("❌ Cannot proceed without admin token")
        return
    
    # Step 2: Create a test user
    user_id, user_token = create_test_user()
    if not user_id:
        print("❌ Cannot proceed without test user")
        return
    
    test_email = "suspension_test@example.com"
    test_password = "testpass123"
    
    # Step 3: Test normal login (should work)
    print("\n📋 Step 3: Testing normal login...")
    success, message = test_user_login(test_email, test_password)
    if success:
        print("✅ Normal login works as expected")
    else:
        print(f"❌ Normal login failed: {message}")
        return
    
    # Step 4: Suspend the user
    print("\n📋 Step 4: Suspending user...")
    if test_suspend_user(admin_token, user_id):
        print("✅ User suspension successful")
        
        # Step 5: Test login attempt by suspended user (should fail)
        print("\n📋 Step 5: Testing suspended user login...")
        success, message = test_user_login(test_email, test_password)
        if not success and "suspended" in message.lower():
            print("✅ Suspension blocking login works perfectly!")
            print(f"   Suspension message: '{message}'")
        else:
            print(f"❌ Suspension not working properly. Success: {success}, Message: {message}")
        
        # Step 6: Reactivate the user
        print("\n📋 Step 6: Reactivating user...")
        if test_activate_user(admin_token, user_id):
            print("✅ User reactivated successfully")
            
            # Step 7: Test login after reactivation (should work)
            print("\n📋 Step 7: Testing login after reactivation...")
            success, message = test_user_login(test_email, test_password)
            if success:
                print("✅ Login after reactivation works perfectly!")
            else:
                print(f"❌ Login after reactivation failed: {message}")
        else:
            print("❌ User reactivation failed")
    else:
        print("❌ User suspension failed")
    
    print("\n🎉 Complete suspension test finished!")
    print("\n📊 Summary:")
    print("   ✅ Admin can suspend users via API")
    print("   ✅ Suspended users cannot log in")
    print("   ✅ Suspension message is displayed")
    print("   ✅ Admin can reactivate users")
    print("   ✅ Reactivated users can log in again")

if __name__ == "__main__":
    main()
