#!/usr/bin/env python3
"""
LaundryPro Backend API Testing Suite
Tests all core functionality including employee management, client management, 
receipt creation, and fraud prevention audit system.
"""

import requests
import json
from datetime import datetime, timezone
import sys

# Backend URL from frontend/.env
BASE_URL = "https://a39059ba-d48c-49cb-8649-91345dfd94e9.preview.emergentagent.com/api"

class LaundryProTester:
    def __init__(self):
        self.session = requests.Session()
        self.employees = []
        self.clients = []
        self.receipts = []
        self.test_results = {
            "passed": 0,
            "failed": 0,
            "errors": []
        }

    def log_test(self, test_name, success, message=""):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if message:
            print(f"   {message}")
        
        if success:
            self.test_results["passed"] += 1
        else:
            self.test_results["failed"] += 1
            self.test_results["errors"].append(f"{test_name}: {message}")

    def test_health_check(self):
        """Test basic connectivity"""
        try:
            response = self.session.get(f"{BASE_URL}/health")
            if response.status_code == 200:
                data = response.json()
                self.log_test("Health Check", True, f"Status: {data.get('status')}")
                return True
            else:
                self.log_test("Health Check", False, f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Health Check", False, f"Connection error: {str(e)}")
            return False

    def test_employee_creation(self):
        """Test creating employees with different PINs"""
        # First, try to get existing employees
        try:
            response = self.session.get(f"{BASE_URL}/employees")
            if response.status_code == 200:
                existing_employees = response.json()
                if existing_employees:
                    self.employees = existing_employees
                    self.log_test("Use Existing Employees", True, f"Found {len(existing_employees)} existing employees")
                    return
        except Exception as e:
            pass
        
        employees_data = [
            {"name": "Sarah Johnson", "pin": "1234", "role": "manager"},
            {"name": "Mike Chen", "pin": "5678", "role": "employee"},
            {"name": "Lisa Rodriguez", "pin": "9999", "role": "employee"}
        ]
        
        for emp_data in employees_data:
            try:
                response = self.session.post(f"{BASE_URL}/employees", json=emp_data)
                if response.status_code == 200:
                    employee = response.json()
                    self.employees.append(employee)
                    self.log_test(f"Create Employee: {emp_data['name']}", True, 
                                f"ID: {employee['id']}, PIN: {emp_data['pin']}")
                elif response.status_code == 400 and "PIN already exists" in response.text:
                    # Try with a different PIN
                    new_pin = emp_data['pin'] + "0"
                    emp_data['pin'] = new_pin
                    response = self.session.post(f"{BASE_URL}/employees", json=emp_data)
                    if response.status_code == 200:
                        employee = response.json()
                        self.employees.append(employee)
                        self.log_test(f"Create Employee: {emp_data['name']} (alt PIN)", True, 
                                    f"ID: {employee['id']}, PIN: {new_pin}")
                    else:
                        self.log_test(f"Create Employee: {emp_data['name']}", False, 
                                    f"Status: {response.status_code}, Response: {response.text}")
                else:
                    self.log_test(f"Create Employee: {emp_data['name']}", False, 
                                f"Status: {response.status_code}, Response: {response.text}")
            except Exception as e:
                self.log_test(f"Create Employee: {emp_data['name']}", False, f"Error: {str(e)}")

    def test_employee_login(self):
        """Test PIN-based authentication"""
        # Test correct PINs
        test_pins = ["1234", "5678", "9999"]
        for pin in test_pins:
            try:
                response = self.session.post(f"{BASE_URL}/employees/login", json={"pin": pin})
                if response.status_code == 200:
                    employee = response.json()
                    self.log_test(f"Employee Login PIN {pin}", True, 
                                f"Logged in as: {employee['name']}")
                else:
                    self.log_test(f"Employee Login PIN {pin}", False, 
                                f"Status: {response.status_code}")
            except Exception as e:
                self.log_test(f"Employee Login PIN {pin}", False, f"Error: {str(e)}")

        # Test incorrect PIN
        try:
            response = self.session.post(f"{BASE_URL}/employees/login", json={"pin": "0000"})
            if response.status_code == 401:
                self.log_test("Employee Login Invalid PIN", True, "Correctly rejected invalid PIN")
            else:
                self.log_test("Employee Login Invalid PIN", False, 
                            f"Should reject invalid PIN, got status: {response.status_code}")
        except Exception as e:
            self.log_test("Employee Login Invalid PIN", False, f"Error: {str(e)}")

    def test_client_creation(self):
        """Test creating clients"""
        clients_data = [
            {"name": "Emma Thompson", "phone": "(555) 123-4567"},
            {"name": "David Wilson", "phone": "(555) 987-6543"},
            {"name": "Maria Garcia", "phone": "(555) 456-7890"},
            {"name": "James Brown", "phone": "(555) 321-0987"}
        ]
        
        for client_data in clients_data:
            try:
                response = self.session.post(f"{BASE_URL}/clients", json=client_data)
                if response.status_code == 200:
                    client = response.json()
                    self.clients.append(client)
                    self.log_test(f"Create Client: {client_data['name']}", True, 
                                f"ID: {client['id']}, Phone: {client_data['phone']}")
                else:
                    self.log_test(f"Create Client: {client_data['name']}", False, 
                                f"Status: {response.status_code}, Response: {response.text}")
            except Exception as e:
                self.log_test(f"Create Client: {client_data['name']}", False, f"Error: {str(e)}")

    def test_client_search(self):
        """Test client search functionality"""
        search_terms = ["Emma", "555", "Garcia"]
        
        for term in search_terms:
            try:
                response = self.session.get(f"{BASE_URL}/clients/search", params={"q": term})
                if response.status_code == 200:
                    results = response.json()
                    self.log_test(f"Client Search: '{term}'", True, 
                                f"Found {len(results)} results")
                else:
                    self.log_test(f"Client Search: '{term}'", False, 
                                f"Status: {response.status_code}")
            except Exception as e:
                self.log_test(f"Client Search: '{term}'", False, f"Error: {str(e)}")

    def test_receipt_creation(self):
        """Test creating detailed receipts with multiple line items"""
        if not self.employees or not self.clients:
            self.log_test("Receipt Creation", False, "No employees or clients available")
            return

        # Create receipts with different service combinations
        receipt_scenarios = [
            {
                "client_idx": 0,
                "employee_idx": 0,
                "items": [
                    {"service": "wash", "item_type": "shirt", "quantity": 3, "price_per_item": 8.50, "total_price": 25.50},
                    {"service": "dry_clean", "item_type": "suit", "quantity": 1, "price_per_item": 15.00, "total_price": 15.00},
                    {"service": "iron", "item_type": "pants", "quantity": 2, "price_per_item": 5.00, "total_price": 10.00}
                ],
                "notes": "Customer requested extra starch on shirts"
            },
            {
                "client_idx": 1,
                "employee_idx": 1,
                "items": [
                    {"service": "wash", "item_type": "dress", "quantity": 2, "price_per_item": 12.00, "total_price": 24.00},
                    {"service": "dry_clean", "item_type": "coat", "quantity": 1, "price_per_item": 20.00, "total_price": 20.00}
                ],
                "notes": "Delicate fabric - handle with care"
            },
            {
                "client_idx": 2,
                "employee_idx": 2,
                "items": [
                    {"service": "wash", "item_type": "jeans", "quantity": 4, "price_per_item": 6.00, "total_price": 24.00},
                    {"service": "iron", "item_type": "shirt", "quantity": 5, "price_per_item": 4.00, "total_price": 20.00}
                ]
            }
        ]

        for i, scenario in enumerate(receipt_scenarios):
            try:
                receipt_data = {
                    "client_id": self.clients[scenario["client_idx"]]["id"],
                    "employee_id": self.employees[scenario["employee_idx"]]["id"],
                    "items": scenario["items"],
                    "notes": scenario.get("notes")
                }
                
                response = self.session.post(f"{BASE_URL}/receipts", json=receipt_data)
                if response.status_code == 200:
                    receipt = response.json()
                    self.receipts.append(receipt)
                    
                    # Verify audit trail information
                    expected_total = sum(item["total_price"] for item in scenario["items"])
                    audit_check = (
                        receipt.get("employee_id") == self.employees[scenario["employee_idx"]]["id"] and
                        receipt.get("employee_name") == self.employees[scenario["employee_idx"]]["name"] and
                        receipt.get("client_name") == self.clients[scenario["client_idx"]]["name"] and
                        abs(receipt.get("total_amount", 0) - expected_total) < 0.01
                    )
                    
                    self.log_test(f"Create Receipt #{i+1}", True, 
                                f"ID: {receipt['id']}, Total: ${receipt['total_amount']:.2f}, "
                                f"Employee: {receipt['employee_name']}, Audit Trail: {'✓' if audit_check else '✗'}")
                else:
                    self.log_test(f"Create Receipt #{i+1}", False, 
                                f"Status: {response.status_code}, Response: {response.text}")
            except Exception as e:
                self.log_test(f"Create Receipt #{i+1}", False, f"Error: {str(e)}")

    def test_receipt_status_updates(self):
        """Test receipt status updates with employee tracking"""
        if not self.receipts or not self.employees:
            self.log_test("Receipt Status Updates", False, "No receipts or employees available")
            return

        status_transitions = ["ready", "completed"]
        
        for i, receipt in enumerate(self.receipts[:2]):  # Test first 2 receipts
            for status in status_transitions:
                try:
                    # Use different employee for status update to test audit trail
                    employee_id = self.employees[(i + 1) % len(self.employees)]["id"]
                    
                    response = self.session.put(
                        f"{BASE_URL}/receipts/{receipt['id']}/status",
                        params={"status": status, "employee_id": employee_id}
                    )
                    
                    if response.status_code == 200:
                        self.log_test(f"Update Receipt {i+1} to {status}", True, 
                                    f"Receipt ID: {receipt['id']}")
                    else:
                        self.log_test(f"Update Receipt {i+1} to {status}", False, 
                                    f"Status: {response.status_code}, Response: {response.text}")
                except Exception as e:
                    self.log_test(f"Update Receipt {i+1} to {status}", False, f"Error: {str(e)}")

    def test_audit_endpoints(self):
        """Test fraud prevention audit system"""
        
        # Test receipts by employee endpoint
        try:
            response = self.session.get(f"{BASE_URL}/audit/receipts-by-employee")
            if response.status_code == 200:
                audit_data = response.json()
                self.log_test("Audit: Receipts by Employee", True, 
                            f"Found data for {len(audit_data)} employees")
                
                # Verify audit data contains required fields
                for emp_data in audit_data:
                    required_fields = ["employee_name", "total_receipts", "total_amount", "receipts"]
                    if all(field in emp_data for field in required_fields):
                        self.log_test(f"Audit Data Validation: {emp_data.get('employee_name')}", True,
                                    f"Receipts: {emp_data['total_receipts']}, Amount: ${emp_data['total_amount']:.2f}")
                    else:
                        self.log_test(f"Audit Data Validation: {emp_data.get('employee_name', 'Unknown')}", False,
                                    "Missing required audit fields")
            else:
                self.log_test("Audit: Receipts by Employee", False, 
                            f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Audit: Receipts by Employee", False, f"Error: {str(e)}")

        # Test daily summary endpoint
        try:
            response = self.session.get(f"{BASE_URL}/audit/daily-summary")
            if response.status_code == 200:
                summary_data = response.json()
                self.log_test("Audit: Daily Summary", True, 
                            f"Found {len(summary_data)} days of data")
            else:
                self.log_test("Audit: Daily Summary", False, 
                            f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Audit: Daily Summary", False, f"Error: {str(e)}")

    def test_get_receipts(self):
        """Test retrieving receipts with employee filtering"""
        try:
            # Test getting all receipts
            response = self.session.get(f"{BASE_URL}/receipts")
            if response.status_code == 200:
                all_receipts = response.json()
                self.log_test("Get All Receipts", True, f"Retrieved {len(all_receipts)} receipts")
            else:
                self.log_test("Get All Receipts", False, f"Status: {response.status_code}")

            # Test filtering by employee
            if self.employees:
                employee_id = self.employees[0]["id"]
                response = self.session.get(f"{BASE_URL}/receipts", params={"employee_id": employee_id})
                if response.status_code == 200:
                    filtered_receipts = response.json()
                    self.log_test("Get Receipts by Employee", True, 
                                f"Retrieved {len(filtered_receipts)} receipts for employee")
                else:
                    self.log_test("Get Receipts by Employee", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Get Receipts", False, f"Error: {str(e)}")

    def test_receipt_deletion_functionality(self):
        """Test the new receipt deletion functionality with audit trail"""
        if not self.receipts or not self.employees:
            self.log_test("Receipt Deletion", False, "No receipts or employees available")
            return

        # Create a test receipt specifically for deletion testing
        if len(self.clients) > 0 and len(self.employees) > 0:
            test_receipt_data = {
                "client_id": self.clients[0]["id"],
                "employee_id": self.employees[0]["id"],
                "items": [
                    {"service": "wash", "item_type": "shirt", "quantity": 1, "price_per_item": 10.00, "total_price": 10.00}
                ],
                "notes": "Test receipt for deletion testing"
            }
            
            try:
                response = self.session.post(f"{BASE_URL}/receipts", json=test_receipt_data)
                if response.status_code == 200:
                    test_receipt = response.json()
                    self.log_test("Create Test Receipt for Deletion", True, f"Receipt ID: {test_receipt['id']}")
                    
                    # Test deleting the receipt
                    deletion_data = {
                        "employee_id": self.employees[1]["id"] if len(self.employees) > 1 else self.employees[0]["id"],
                        "deletion_reason": "Customer requested cancellation - testing deletion functionality"
                    }
                    
                    delete_response = self.session.delete(f"{BASE_URL}/receipts/{test_receipt['id']}", json=deletion_data)
                    if delete_response.status_code == 200:
                        delete_result = delete_response.json()
                        self.log_test("Delete Receipt", True, 
                                    f"Deleted by: {delete_result.get('deleted_by')}, Reason: {delete_result.get('deletion_reason')}")
                        
                        # Verify receipt is marked as deleted (soft delete)
                        get_response = self.session.get(f"{BASE_URL}/receipts/{test_receipt['id']}")
                        if get_response.status_code == 200:
                            deleted_receipt = get_response.json()
                            if deleted_receipt.get('is_deleted') == True and deleted_receipt.get('status') == 'deleted':
                                self.log_test("Verify Soft Delete", True, 
                                            f"Receipt marked as deleted, not permanently removed")
                            else:
                                self.log_test("Verify Soft Delete", False, 
                                            f"Receipt not properly marked as deleted")
                        else:
                            self.log_test("Verify Soft Delete", False, f"Could not retrieve deleted receipt")
                        
                        # Test that deleted receipts are excluded from regular queries
                        all_receipts_response = self.session.get(f"{BASE_URL}/receipts")
                        if all_receipts_response.status_code == 200:
                            all_receipts = all_receipts_response.json()
                            deleted_receipt_in_list = any(r['id'] == test_receipt['id'] for r in all_receipts)
                            if not deleted_receipt_in_list:
                                self.log_test("Deleted Receipt Excluded from Regular Query", True, 
                                            "Deleted receipt properly excluded from regular receipt list")
                            else:
                                self.log_test("Deleted Receipt Excluded from Regular Query", False, 
                                            "Deleted receipt still appears in regular receipt list")
                        
                        # Test that deleted receipts cannot be updated
                        update_response = self.session.put(
                            f"{BASE_URL}/receipts/{test_receipt['id']}/status",
                            params={"status": "ready", "employee_id": self.employees[0]["id"]}
                        )
                        if update_response.status_code == 404:
                            self.log_test("Prevent Updates to Deleted Receipt", True, 
                                        "Correctly prevented status update on deleted receipt")
                        else:
                            self.log_test("Prevent Updates to Deleted Receipt", False, 
                                        f"Should prevent updates to deleted receipt, got status: {update_response.status_code}")
                        
                    else:
                        self.log_test("Delete Receipt", False, 
                                    f"Status: {delete_response.status_code}, Response: {delete_response.text}")
                else:
                    self.log_test("Create Test Receipt for Deletion", False, 
                                f"Status: {response.status_code}")
            except Exception as e:
                self.log_test("Receipt Deletion Functionality", False, f"Error: {str(e)}")

    def test_enhanced_audit_endpoints(self):
        """Test the enhanced audit endpoints that track deletions"""
        
        # Test deleted receipts endpoint
        try:
            response = self.session.get(f"{BASE_URL}/audit/deleted-receipts")
            if response.status_code == 200:
                deleted_receipts = response.json()
                self.log_test("Audit: Deleted Receipts", True, 
                            f"Found {len(deleted_receipts)} deleted receipts")
                
                # Verify deleted receipts have proper deletion metadata
                for receipt in deleted_receipts:
                    if (receipt.get('is_deleted') == True and 
                        receipt.get('deleted_at') and 
                        receipt.get('deleted_by_employee_name') and 
                        receipt.get('deletion_reason')):
                        self.log_test(f"Deletion Metadata: {receipt['id'][:8]}...", True,
                                    f"Deleted by: {receipt['deleted_by_employee_name']}")
                    else:
                        self.log_test(f"Deletion Metadata: {receipt['id'][:8]}...", False,
                                    "Missing deletion metadata")
            else:
                self.log_test("Audit: Deleted Receipts", False, 
                            f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Audit: Deleted Receipts", False, f"Error: {str(e)}")

        # Test receipts by employee with include_deleted parameter
        try:
            response = self.session.get(f"{BASE_URL}/audit/receipts-by-employee", 
                                      params={"include_deleted": "true"})
            if response.status_code == 200:
                audit_data = response.json()
                self.log_test("Audit: Receipts by Employee (Include Deleted)", True, 
                            f"Found data for {len(audit_data)} employees including deleted receipts")
                
                # Check if deleted receipts are included in the count
                for emp_data in audit_data:
                    if emp_data.get('deleted_receipts', 0) > 0:
                        self.log_test(f"Deleted Receipt Count: {emp_data.get('employee_name')}", True,
                                    f"Shows {emp_data['deleted_receipts']} deleted receipts")
            else:
                self.log_test("Audit: Receipts by Employee (Include Deleted)", False, 
                            f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Audit: Receipts by Employee (Include Deleted)", False, f"Error: {str(e)}")

        # Test employee activity endpoint
        if self.employees:
            try:
                employee_id = self.employees[0]["id"]
                response = self.session.get(f"{BASE_URL}/audit/employee-activity", 
                                          params={"employee_id": employee_id})
                if response.status_code == 200:
                    activity_data = response.json()
                    self.log_test("Audit: Employee Activity", True, 
                                f"Retrieved activity for employee {employee_id[:8]}...")
                    
                    # Check activity summary
                    summary = activity_data.get('summary', {})
                    self.log_test("Employee Activity Summary", True,
                                f"Created: {summary.get('total_created', 0)}, "
                                f"Deleted: {summary.get('total_deleted', 0)}, "
                                f"Deleted Others: {summary.get('total_deleted_others', 0)}")
                else:
                    self.log_test("Audit: Employee Activity", False, 
                                f"Status: {response.status_code}")
            except Exception as e:
                self.log_test("Audit: Employee Activity", False, f"Error: {str(e)}")

        # Test daily summary with deleted receipts
        try:
            response = self.session.get(f"{BASE_URL}/audit/daily-summary", 
                                      params={"include_deleted": "true"})
            if response.status_code == 200:
                summary_data = response.json()
                self.log_test("Audit: Daily Summary (Include Deleted)", True, 
                            f"Found {len(summary_data)} days of data including deleted receipts")
                
                # Check if deleted counts are included
                for day_data in summary_data:
                    if day_data.get('deleted_count', 0) > 0:
                        self.log_test(f"Daily Deleted Count: {day_data['_id']['date']}", True,
                                    f"Shows {day_data['deleted_count']} deleted receipts")
            else:
                self.log_test("Audit: Daily Summary (Include Deleted)", False, 
                            f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Audit: Daily Summary (Include Deleted)", False, f"Error: {str(e)}")

    def run_all_tests(self):
        """Run complete test suite"""
        print("=" * 60)
        print("LaundryPro Backend API Test Suite")
        print("=" * 60)
        
        # Test in logical order
        if not self.test_health_check():
            print("❌ Backend is not accessible. Stopping tests.")
            return False

        print("\n🔧 Testing Employee Management & PIN Authentication...")
        self.test_employee_creation()
        self.test_employee_login()

        print("\n👥 Testing Client Management...")
        self.test_client_creation()
        self.test_client_search()

        print("\n🧾 Testing Receipt Creation & Management...")
        self.test_receipt_creation()
        self.test_receipt_status_updates()
        self.test_get_receipts()

        print("\n🗑️ Testing Receipt Deletion Functionality...")
        self.test_receipt_deletion_functionality()

        print("\n🔍 Testing Fraud Prevention Audit System...")
        self.test_audit_endpoints()
        
        print("\n🔍 Testing Enhanced Audit Endpoints with Deletion Tracking...")
        self.test_enhanced_audit_endpoints()

        # Print summary
        print("\n" + "=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        print(f"✅ Passed: {self.test_results['passed']}")
        print(f"❌ Failed: {self.test_results['failed']}")
        
        if self.test_results['errors']:
            print("\nFAILED TESTS:")
            for error in self.test_results['errors']:
                print(f"  • {error}")

        success_rate = (self.test_results['passed'] / 
                       (self.test_results['passed'] + self.test_results['failed'])) * 100
        print(f"\nSuccess Rate: {success_rate:.1f}%")
        
        return self.test_results['failed'] == 0

if __name__ == "__main__":
    tester = LaundryProTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)