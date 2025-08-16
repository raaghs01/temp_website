#!/usr/bin/env python3
"""
Script to test the admin ambassadors API response
"""

import requests
import json

def test_admin_ambassadors_api():
    """Test the admin ambassadors API"""
    print("=== Testing Admin Ambassadors API ===")
    
    base_url = "http://127.0.0.1:5000"
    
    # Test with a simple request (no auth for now, just to see the structure)
    try:
        response = requests.get(f"{base_url}/api/admin/ambassadors")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 403:
            print("✅ API is protected (403 Forbidden) - this is expected without auth")
            print("Response:", response.text)
        elif response.status_code == 200:
            data = response.json()
            print(f"✅ API returned data: {len(data)} ambassadors")
            
            # Show first few ambassadors with their task counts
            for i, ambassador in enumerate(data[:5]):
                print(f"  {i+1}. {ambassador.get('name', 'Unknown')} - Tasks: {ambassador.get('tasks_completed', 0)}")
        else:
            print(f"❌ Unexpected status code: {response.status_code}")
            print("Response:", response.text)
            
    except Exception as e:
        print(f"❌ Error testing API: {e}")

if __name__ == "__main__":
    test_admin_ambassadors_api()
