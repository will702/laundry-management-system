#!/usr/bin/env python3
"""
Check existing services and their duration data
"""

import requests
import json

BASE_URL = "https://860f3264-bb84-4836-a894-6429835c37ed.preview.emergentagent.com/api"

def check_existing_services():
    session = requests.Session()
    
    try:
        response = session.get(f"{BASE_URL}/services")
        if response.status_code == 200:
            services = response.json()
            print(f"Found {len(services)} services:")
            print()
            
            for service in services:
                name = service.get('name', 'Unknown')
                days = service.get('duration_days', 'N/A')
                hours = service.get('duration_hours', 'N/A')
                minutes = service.get('duration_minutes', 'N/A')
                price = service.get('base_price', 'N/A')
                
                print(f"Service: {name}")
                print(f"  Duration: {days}d {hours}h {minutes}m")
                print(f"  Price: Rp{price}")
                print(f"  ID: {service.get('id', 'N/A')}")
                print()
        else:
            print(f"Failed to get services: {response.status_code}")
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    check_existing_services()