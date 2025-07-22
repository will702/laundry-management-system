#!/usr/bin/env python3
import os
from pymongo import MongoClient
from datetime import datetime, timezone

# Connect to MongoDB
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/laundry')
print(f"Connecting to: {MONGO_URL}")

client = MongoClient(MONGO_URL)
db = client.laundry

# Find the employee first
employee = db.employees.find_one({'pin': '1234'})
if employee:
    print(f"Found employee: {employee['name']} with role: {employee.get('role', 'Not set')}")
    
    # Update to admin role
    result = db.employees.update_one(
        {'_id': employee['_id']},
        {'$set': {'role': 'admin', 'updated_at': datetime.now(timezone.utc)}}
    )
    
    if result.modified_count > 0:
        print('✅ Successfully updated to admin role')
        
        # Verify
        updated_employee = db.employees.find_one({'_id': employee['_id']})
        print(f"New role: {updated_employee['role']}")
    else:
        print('❌ No changes made')
else:
    print('❌ Employee with PIN 1234 not found')

client.close()