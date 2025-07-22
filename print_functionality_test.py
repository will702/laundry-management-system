#!/usr/bin/env python3
"""
LaundryPro Print Functionality Focused Test
Tests the specific print functionality issues reported by the user:
- Print works when creating new receipts but fails from "Semua Bon" (All Receipts) page
- Focus on testing print API endpoints and data completeness
"""

import requests
import json
from datetime import datetime, timezone
import sys

# Backend URL from frontend/.env
BASE_URL = "https://a463ed99-dc6b-4010-8927-dcb0282194de.preview.emergentagent.com/api"

class PrintFunctionalityTester:
    def __init__(self):
        self.session = requests.Session()
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

    def test_get_all_receipts_for_print(self):
        """Test GET /api/receipts to get list of existing receipts for print testing"""
        print("\n📋 Testing Receipt Management API for Print Functionality...")
        
        try:
            # Test getting all receipts (what "Semua Bon" page would do)
            response = self.session.get(f"{BASE_URL}/receipts")
            if response.status_code == 200:
                receipts = response.json()
                self.log_test("Get All Receipts", True, f"Retrieved {len(receipts)} receipts")
                
                # Verify each receipt has required fields for print functionality
                for i, receipt in enumerate(receipts[:5]):  # Test first 5 receipts
                    required_fields = ["id", "client_name", "client_phone", "employee_name", 
                                     "items", "total_amount", "status", "created_at"]
                    missing_fields = [field for field in required_fields if field not in receipt]
                    
                    if not missing_fields:
                        self.log_test(f"Receipt {i+1} Data Completeness", True, 
                                    f"ID: {receipt['id'][:8]}..., Status: {receipt['status']}")
                    else:
                        self.log_test(f"Receipt {i+1} Data Completeness", False, 
                                    f"Missing fields: {missing_fields}")
                
                return receipts
            else:
                self.log_test("Get All Receipts", False, f"Status: {response.status_code}")
                return []
        except Exception as e:
            self.log_test("Get All Receipts", False, f"Error: {str(e)}")
            return []

    def test_print_api_for_existing_receipts(self, receipts):
        """Test GET /api/receipts/{receipt_id}/print for existing receipts"""
        print("\n🖨️ Testing Print API Endpoint for Existing Receipts...")
        
        if not receipts:
            self.log_test("Print API Testing", False, "No receipts available for testing")
            return

        # Test print functionality for different receipt statuses
        status_groups = {
            "pending": [],
            "ready": [],
            "completed": [],
            "deleted": []
        }
        
        # Group receipts by status
        for receipt in receipts:
            status = receipt.get("status", "unknown")
            if status in status_groups:
                status_groups[status].append(receipt)

        # Test print for each status type
        for status, receipt_list in status_groups.items():
            if receipt_list:
                test_receipt = receipt_list[0]  # Test first receipt of each status
                self.test_single_receipt_print(test_receipt, f"Print {status.title()} Receipt")

    def test_single_receipt_print(self, receipt, test_name):
        """Test printing a single receipt and verify data completeness"""
        try:
            receipt_id = receipt["id"]
            response = self.session.get(f"{BASE_URL}/receipts/{receipt_id}/print")
            
            if response.status_code == 200:
                print_data = response.json()
                self.log_test(test_name, True, f"Receipt ID: {receipt_id[:8]}...")
                
                # Test 1: Verify business information is complete
                business_fields = ["business_name", "business_address", "business_phone"]
                business_complete = all(field in print_data and print_data[field] for field in business_fields)
                self.log_test(f"{test_name} - Business Info", business_complete,
                            f"Business: {print_data.get('business_name', 'Missing')}")
                
                # Test 2: Verify receipt details are complete
                receipt_fields = ["receipt_id", "client_name", "client_phone", "employee_name", 
                                "items", "total_amount", "status", "created_at"]
                receipt_complete = all(field in print_data for field in receipt_fields)
                self.log_test(f"{test_name} - Receipt Details", receipt_complete,
                            f"Client: {print_data.get('client_name', 'Missing')}")
                
                # Test 3: Verify items array with pricing
                items = print_data.get("items", [])
                if items:
                    item_fields = ["service", "item_type", "quantity", "price_per_item", "total_price"]
                    items_complete = all(
                        all(field in item for field in item_fields) for item in items
                    )
                    self.log_test(f"{test_name} - Items Pricing", items_complete,
                                f"{len(items)} items with pricing details")
                else:
                    self.log_test(f"{test_name} - Items Pricing", False, "No items found")
                
                # Test 4: Verify totals and discount fields
                total_fields = ["subtotal", "total_amount", "discount_percent", "discount_amount"]
                available_totals = [field for field in total_fields if field in print_data]
                totals_complete = len(available_totals) >= 2  # At least subtotal and total_amount
                self.log_test(f"{test_name} - Total Fields", totals_complete,
                            f"Available: {available_totals}")
                
                # Test 5: Verify footer notes and print timestamp
                footer_complete = "footer_notes" in print_data and "print_timestamp" in print_data
                self.log_test(f"{test_name} - Footer & Timestamp", footer_complete,
                            f"Footer: {'✓' if 'footer_notes' in print_data else '✗'}, "
                            f"Timestamp: {'✓' if 'print_timestamp' in print_data else '✗'}")
                
                # Test 6: Verify data consistency with original receipt
                original_total = receipt.get("total_amount", 0)
                print_total = print_data.get("total_amount", 0)
                total_match = abs(original_total - print_total) < 0.01
                self.log_test(f"{test_name} - Data Consistency", total_match,
                            f"Original: ${original_total:.2f}, Print: ${print_total:.2f}")
                
                return print_data
                
            elif response.status_code == 404:
                self.log_test(test_name, False, "Receipt not found (404)")
            else:
                self.log_test(test_name, False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test(test_name, False, f"Error: {str(e)}")
        
        return None

    def test_print_edge_cases(self, receipts):
        """Test print functionality edge cases"""
        print("\n🔍 Testing Print Edge Cases...")
        
        # Test 1: Print for receipt with discount
        discount_receipts = [r for r in receipts if r.get("discount_percent", 0) > 0]
        if discount_receipts:
            self.test_single_receipt_print(discount_receipts[0], "Print Receipt with Discount")
        else:
            self.log_test("Print Receipt with Discount", False, "No receipts with discount found")
        
        # Test 2: Print for receipt with special notes
        noted_receipts = [r for r in receipts if r.get("notes")]
        if noted_receipts:
            self.test_single_receipt_print(noted_receipts[0], "Print Receipt with Notes")
        else:
            self.log_test("Print Receipt with Notes", False, "No receipts with notes found")
        
        # Test 3: Print API error handling for invalid receipt ID
        try:
            fake_id = "invalid-receipt-id-12345"
            response = self.session.get(f"{BASE_URL}/receipts/{fake_id}/print")
            if response.status_code == 404:
                self.log_test("Print Invalid Receipt ID", True, "Correctly returned 404")
            else:
                self.log_test("Print Invalid Receipt ID", False, f"Expected 404, got {response.status_code}")
        except Exception as e:
            self.log_test("Print Invalid Receipt ID", False, f"Error: {str(e)}")

    def test_print_data_structure_completeness(self, receipts):
        """Test that print data structure matches frontend expectations"""
        print("\n📊 Testing Print Data Structure Completeness...")
        
        if not receipts:
            self.log_test("Print Data Structure", False, "No receipts available")
            return
        
        # Test with a sample receipt
        test_receipt = receipts[0]
        try:
            response = self.session.get(f"{BASE_URL}/receipts/{test_receipt['id']}/print")
            if response.status_code == 200:
                print_data = response.json()
                
                # Expected structure based on review requirements
                expected_structure = {
                    "business_info": ["business_name", "business_address", "business_phone"],
                    "receipt_details": ["receipt_id", "created_at", "status", "client_name", "client_phone", "employee_name"],
                    "items": ["items"],  # Should be array with service, item_type, quantity, price_per_item, total_price
                    "totals": ["subtotal", "total_amount", "discount_percent", "discount_amount"],  # All discount fields should be present
                    "metadata": ["footer_notes", "print_timestamp"]
                }
                
                structure_complete = True
                missing_sections = []
                
                for section, fields in expected_structure.items():
                    section_complete = all(field in print_data for field in fields)
                    if not section_complete:
                        missing_fields = [field for field in fields if field not in print_data]
                        missing_sections.append(f"{section}: {missing_fields}")
                        structure_complete = False
                    
                    self.log_test(f"Print Structure - {section.title()}", section_complete,
                                f"Fields: {fields}")
                
                # Overall structure assessment
                self.log_test("Print Data Structure Complete", structure_complete,
                            f"Missing: {missing_sections}" if missing_sections else "All required fields present")
                
                # Test items array structure specifically
                items = print_data.get("items", [])
                if items:
                    item_structure_complete = True
                    required_item_fields = ["service", "item_type", "quantity", "price_per_item", "total_price"]
                    
                    for i, item in enumerate(items[:3]):  # Check first 3 items
                        item_complete = all(field in item for field in required_item_fields)
                        if not item_complete:
                            missing_item_fields = [field for field in required_item_fields if field not in item]
                            self.log_test(f"Item {i+1} Structure", False, f"Missing: {missing_item_fields}")
                            item_structure_complete = False
                        else:
                            self.log_test(f"Item {i+1} Structure", True, 
                                        f"{item['service']} - {item['item_type']} x{item['quantity']}")
                    
                    self.log_test("Items Array Structure", item_structure_complete,
                                f"Tested {min(len(items), 3)} items")
                else:
                    self.log_test("Items Array Structure", False, "No items in print data")
                    
            else:
                self.log_test("Print Data Structure", False, f"Could not get print data: {response.status_code}")
                
        except Exception as e:
            self.log_test("Print Data Structure", False, f"Error: {str(e)}")

    def run_focused_print_tests(self):
        """Run focused print functionality tests"""
        print("=" * 70)
        print("LaundryPro Print Functionality Focused Test")
        print("Testing print issues: works on new receipts, fails on 'Semua Bon' page")
        print("=" * 70)
        
        # Test 1: Get all receipts (what "Semua Bon" page does)
        receipts = self.test_get_all_receipts_for_print()
        
        # Test 2: Test print API for existing receipts
        self.test_print_api_for_existing_receipts(receipts)
        
        # Test 3: Test print data completeness
        self.test_print_data_structure_completeness(receipts)
        
        # Test 4: Test edge cases
        self.test_print_edge_cases(receipts)
        
        # Print summary
        print("\n" + "=" * 70)
        print("PRINT FUNCTIONALITY TEST SUMMARY")
        print("=" * 70)
        print(f"✅ Passed: {self.test_results['passed']}")
        print(f"❌ Failed: {self.test_results['failed']}")
        
        if self.test_results['errors']:
            print("\nFAILED TESTS:")
            for error in self.test_results['errors']:
                print(f"  • {error}")

        success_rate = (self.test_results['passed'] / 
                       (self.test_results['passed'] + self.test_results['failed'])) * 100
        print(f"\nSuccess Rate: {success_rate:.1f}%")
        
        # Analysis and recommendations
        print("\n" + "=" * 70)
        print("ANALYSIS & RECOMMENDATIONS")
        print("=" * 70)
        
        if self.test_results['failed'] == 0:
            print("✅ PRINT FUNCTIONALITY WORKING CORRECTLY")
            print("   - All print API endpoints are functioning properly")
            print("   - Print data structure is complete and consistent")
            print("   - The issue may be in the frontend implementation")
            print("   - Recommend checking frontend print function calls")
        else:
            print("❌ PRINT FUNCTIONALITY ISSUES DETECTED")
            print("   - Backend print API has issues that need fixing")
            print("   - Check the failed tests above for specific problems")
        
        return self.test_results['failed'] == 0

if __name__ == "__main__":
    tester = PrintFunctionalityTester()
    success = tester.run_focused_print_tests()
    sys.exit(0 if success else 1)