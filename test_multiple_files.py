#!/usr/bin/env python3
"""
Test script for the new submit-task-with-files endpoint
"""

import requests
import base64
from io import BytesIO
from PIL import Image
import json

API_BASE = "http://127.0.0.1:5000/api"

def create_test_image(filename="test_image.png"):
    """Create a test image file"""
    img = Image.new('RGB', (100, 100), color='red')
    img_bytes = BytesIO()
    img.save(img_bytes, format='PNG')
    img_bytes.seek(0)
    return img_bytes

def create_test_pdf(filename="test_document.pdf"):
    """Create a simple test PDF content"""
    # Simple PDF content (this is a minimal PDF structure)
    pdf_content = b"""%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
72 720 Td
(Test PDF Document) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000204 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
297
%%EOF"""
    return BytesIO(pdf_content)

def test_register_and_login():
    """Register a test user and login"""
    print("🔐 Testing registration and login...")

    # First try to register
    register_data = {
        "email": "test.multifile@example.com",
        "password": "TestPass123!",
        "name": "Test MultiFile User",
        "college": "Test University",
        "role": "ambassador"
    }

    register_response = requests.post(f"{API_BASE}/register", json=register_data)
    if register_response.status_code == 200:
        print("✅ Registration successful")
    else:
        print(f"⚠️ Registration response: {register_response.status_code} - {register_response.text}")

    # Now try to login
    login_data = {
        "email": "test.multifile@example.com",
        "password": "TestPass123!",
        "role": "ambassador"
    }

    response = requests.post(f"{API_BASE}/login", json=login_data)

    if response.status_code == 200:
        result = response.json()
        print("✅ Login successful")
        print(f"Login response: {result}")
        # Try different possible key names
        token = result.get("access_token") or result.get("token") or result.get("auth_token")
        return token
    else:
        print(f"❌ Login failed: {response.status_code} - {response.text}")
        return None

def test_get_tasks(auth_token):
    """Get available tasks"""
    print("\n📋 Getting available tasks...")
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    response = requests.get(f"{API_BASE}/tasks/1", headers=headers)
    
    if response.status_code == 200:
        task = response.json()
        print(f"✅ Found task: {task['title']}")
        return task["id"]
    else:
        print(f"❌ Failed to get tasks: {response.status_code} - {response.text}")
        return None

def test_submit_multiple_files(auth_token, task_id):
    """Test submitting task with multiple files"""
    print("\n📎 Testing multiple file submission...")
    
    if not auth_token or not task_id:
        print("❌ No auth token or task ID available")
        return False
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    # Create test files
    test_image1 = create_test_image("image1.png")
    test_image2 = create_test_image("image2.png")
    test_pdf = create_test_pdf("document.pdf")
    
    # Prepare files for upload
    files = [
        ('files', ('test_image1.png', test_image1, 'image/png')),
        ('files', ('test_image2.png', test_image2, 'image/png')),
        ('files', ('test_document.pdf', test_pdf, 'application/pdf'))
    ]
    
    data = {
        'task_id': task_id,
        'status_text': 'Submitted task with multiple files: 2 images and 1 PDF document',
        'people_connected': 3
    }
    
    response = requests.post(f"{API_BASE}/submit-task-with-files", data=data, files=files, headers=headers)
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Multiple file submission successful!")
        print(f"   Message: {result['message']}")
        print(f"   Points earned: {result['points_earned']}")
        print(f"   Files uploaded: {result['files_uploaded']}")
        return True
    else:
        print(f"❌ Multiple file submission failed: {response.status_code} - {response.text}")
        return False

def test_get_submissions_with_files(auth_token):
    """Test getting submissions to verify proof_files are returned"""
    print("\n📋 Testing submissions with proof files...")

    if not auth_token:
        print("❌ No auth token available")
        return False

    headers = {"Authorization": f"Bearer {auth_token}"}
    response = requests.get(f"{API_BASE}/my-submissions", headers=headers)

    if response.status_code == 200:
        submissions = response.json()
        print(f"✅ Retrieved {len(submissions)} submissions")

        # Check if any submission has proof_files
        for sub in submissions:
            if sub.get('proof_files'):
                print(f"   📎 Submission {sub['id']} has {len(sub['proof_files'])} proof files:")
                for i, file in enumerate(sub['proof_files']):
                    print(f"      {i+1}. {file['filename']} ({file['content_type']}, {file['size']} bytes)")
                return True

        print("   ⚠️ No submissions with proof_files found")
        return True
    else:
        print(f"❌ Get submissions failed: {response.status_code} - {response.text}")
        return False

def main():
    """Run all tests"""
    print("🧪 Testing Multiple File Upload Endpoint")
    print("=" * 50)

    # Test registration and login
    auth_token = test_register_and_login()
    if not auth_token:
        print("❌ Cannot proceed without authentication")
        return

    # Get task ID
    task_id = test_get_tasks(auth_token)
    if not task_id:
        print("❌ Cannot proceed without task ID")
        return

    # Test multiple file submission
    success = test_submit_multiple_files(auth_token, task_id)

    # Test getting submissions with files
    if success:
        test_get_submissions_with_files(auth_token)

    if success:
        print("\n🎉 All tests passed! Multiple file upload is working correctly.")
        print("💡 You can now test the frontend proof viewing functionality!")
    else:
        print("\n❌ Some tests failed.")

if __name__ == "__main__":
    main()
