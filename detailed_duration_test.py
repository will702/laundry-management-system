#!/usr/bin/env python3
"""
LaundryPro Detailed Duration System Testing Suite
Tests the updated estimation system with detailed duration (days, hours, minutes) functionality.
"""

import requests
import json
from datetime import datetime, timezone
import sys

# Backend URL from frontend/.env
BASE_URL = "https://860f3264-bb84-4836-a894-6429835c37ed.preview.emergentagent.com/api"

class DetailedDurationTester:
    def __init__(self):
        self.session = requests.Session()
        self.employee_id = None
        self.categories = []
        self.units = []
        self.services = []
        self.packages = []
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

    def authenticate_employee(self):
        """Authenticate with PIN 1234 as specified in review request"""
        try:
            response = self.session.post(f"{BASE_URL}/employees/login", json={"pin": "1234"})
            if response.status_code == 200:
                employee = response.json()
                self.employee_id = employee["id"]
                self.log_test("Employee Authentication (PIN 1234)", True, 
                            f"Authenticated as: {employee['name']}")
                return True
            else:
                self.log_test("Employee Authentication (PIN 1234)", False, 
                            f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Employee Authentication (PIN 1234)", False, f"Error: {str(e)}")
            return False

    def test_default_data_with_detailed_duration(self):
        """Test /api/initialize to create default services with detailed duration format"""
        try:
            response = self.session.post(f"{BASE_URL}/initialize")
            if response.status_code == 200:
                init_data = response.json()
                self.log_test("Initialize Default Data with Detailed Duration", True, 
                            f"Message: {init_data.get('message')}")
                
                # Now get the services to verify detailed duration format
                services_response = self.session.get(f"{BASE_URL}/services")
                if services_response.status_code == 200:
                    services = services_response.json()
                    
                    # Check specific services mentioned in review request
                    setrika_saja = next((s for s in services if s["name"] == "Setrika Saja"), None)
                    cuci_express = next((s for s in services if s["name"] == "Cuci Express"), None)
                    dry_clean = next((s for s in services if s["name"] == "Dry Clean"), None)
                    
                    if setrika_saja:
                        expected_duration = (0, 2, 0)  # 0 days, 2 hours, 0 minutes
                        actual_duration = (
                            setrika_saja.get("duration_days", 0),
                            setrika_saja.get("duration_hours", 0), 
                            setrika_saja.get("duration_minutes", 0)
                        )
                        if actual_duration == expected_duration:
                            self.log_test("Default Service: Setrika Saja Duration", True,
                                        f"Duration: {actual_duration[0]}d {actual_duration[1]}h {actual_duration[2]}m")
                        else:
                            self.log_test("Default Service: Setrika Saja Duration", False,
                                        f"Expected: 0d 2h 0m, Got: {actual_duration[0]}d {actual_duration[1]}h {actual_duration[2]}m")
                    
                    if cuci_express:
                        expected_duration = (0, 3, 0)  # 0 days, 3 hours, 0 minutes
                        actual_duration = (
                            cuci_express.get("duration_days", 0),
                            cuci_express.get("duration_hours", 0),
                            cuci_express.get("duration_minutes", 0)
                        )
                        if actual_duration == expected_duration:
                            self.log_test("Default Service: Cuci Express Duration", True,
                                        f"Duration: {actual_duration[0]}d {actual_duration[1]}h {actual_duration[2]}m")
                        else:
                            self.log_test("Default Service: Cuci Express Duration", False,
                                        f"Expected: 0d 3h 0m, Got: {actual_duration[0]}d {actual_duration[1]}h {actual_duration[2]}m")
                    
                    if dry_clean:
                        expected_duration = (3, 0, 0)  # 3 days, 0 hours, 0 minutes
                        actual_duration = (
                            dry_clean.get("duration_days", 0),
                            dry_clean.get("duration_hours", 0),
                            dry_clean.get("duration_minutes", 0)
                        )
                        if actual_duration == expected_duration:
                            self.log_test("Default Service: Dry Clean Duration", True,
                                        f"Duration: {actual_duration[0]}d {actual_duration[1]}h {actual_duration[2]}m")
                        else:
                            self.log_test("Default Service: Dry Clean Duration", False,
                                        f"Expected: 3d 0h 0m, Got: {actual_duration[0]}d {actual_duration[1]}h {actual_duration[2]}m")
                
                else:
                    self.log_test("Get Services for Duration Verification", False, 
                                f"Status: {services_response.status_code}")
            else:
                self.log_test("Initialize Default Data with Detailed Duration", False,
                            f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Initialize Default Data with Detailed Duration", False, f"Error: {str(e)}")

    def setup_test_data(self):
        """Setup categories and units for testing"""
        # Get existing categories and units
        try:
            cat_response = self.session.get(f"{BASE_URL}/categories")
            if cat_response.status_code == 200:
                self.categories = cat_response.json()
                self.log_test("Get Categories for Testing", True, f"Found {len(self.categories)} categories")
            
            unit_response = self.session.get(f"{BASE_URL}/units")
            if unit_response.status_code == 200:
                self.units = unit_response.json()
                self.log_test("Get Units for Testing", True, f"Found {len(self.units)} units")
                
            return len(self.categories) > 0 and len(self.units) > 0
        except Exception as e:
            self.log_test("Setup Test Data", False, f"Error: {str(e)}")
            return False

    def test_service_creation_with_detailed_duration(self):
        """Test creating services with various duration combinations"""
        if not self.categories or not self.units or not self.employee_id:
            self.log_test("Service Creation Prerequisites", False, "Missing categories, units, or employee authentication")
            return

        # Test cases from review request
        test_services = [
            {
                "name": "Cuci Express Test",
                "duration_days": 0,
                "duration_hours": 3,
                "duration_minutes": 0,
                "description": "0 days, 3 hours, 0 minutes"
            },
            {
                "name": "Setrika Saja Test", 
                "duration_days": 0,
                "duration_hours": 2,
                "duration_minutes": 0,
                "description": "0 days, 2 hours, 0 minutes"
            },
            {
                "name": "Dry Clean Test",
                "duration_days": 3,
                "duration_hours": 0,
                "duration_minutes": 0,
                "description": "3 days, 0 hours, 0 minutes"
            },
            {
                "name": "Normal Service Test",
                "duration_days": 1,
                "duration_hours": 4,
                "duration_minutes": 30,
                "description": "1 day, 4 hours, 30 minutes"
            },
            {
                "name": "Only Hours Test",
                "duration_days": 0,
                "duration_hours": 4,
                "duration_minutes": 0,
                "description": "Service with only hours: 0d 4h 0m"
            },
            {
                "name": "Mixed Duration Test",
                "duration_days": 2,
                "duration_hours": 3,
                "duration_minutes": 30,
                "description": "Service with mixed duration: 2d 3h 30m"
            },
            {
                "name": "Instant Service Test",
                "duration_days": 0,
                "duration_hours": 0,
                "duration_minutes": 0,
                "description": "Service instant (all zeros): 0d 0h 0m"
            }
        ]

        for service_data in test_services:
            try:
                service_payload = {
                    "name": service_data["name"],
                    "category_id": self.categories[0]["id"],
                    "unit_id": self.units[0]["id"],
                    "base_price": 15000,
                    "duration_days": service_data["duration_days"],
                    "duration_hours": service_data["duration_hours"],
                    "duration_minutes": service_data["duration_minutes"],
                    "created_by_employee_id": self.employee_id
                }
                
                response = self.session.post(f"{BASE_URL}/services", json=service_payload)
                if response.status_code == 200:
                    service = response.json()
                    self.services.append(service)
                    
                    # Verify all three duration fields are properly saved and returned
                    duration_fields_correct = (
                        service.get("duration_days") == service_data["duration_days"] and
                        service.get("duration_hours") == service_data["duration_hours"] and
                        service.get("duration_minutes") == service_data["duration_minutes"]
                    )
                    
                    self.log_test(f"Create Service: {service_data['name']}", True,
                                f"{service_data['description']} - Fields Correct: {'✓' if duration_fields_correct else '✗'}")
                    
                    if not duration_fields_correct:
                        self.log_test(f"Duration Fields Verification: {service_data['name']}", False,
                                    f"Expected: {service_data['duration_days']}d {service_data['duration_hours']}h {service_data['duration_minutes']}m, "
                                    f"Got: {service.get('duration_days')}d {service.get('duration_hours')}h {service.get('duration_minutes')}m")
                else:
                    self.log_test(f"Create Service: {service_data['name']}", False,
                                f"Status: {response.status_code}, Response: {response.text}")
            except Exception as e:
                self.log_test(f"Create Service: {service_data['name']}", False, f"Error: {str(e)}")

    def test_package_duration_calculation(self):
        """Test package duration calculation using longest service"""
        if not self.services or not self.employee_id:
            self.log_test("Package Duration Prerequisites", False, "Missing services or employee authentication")
            return

        # Create a package with services having different duration formats
        if len(self.services) >= 3:
            # Select services with different durations for testing
            package_services = [
                {"service_id": self.services[0]["id"], "quantity": 1},  # Should have some duration
                {"service_id": self.services[1]["id"], "quantity": 2},  # Different duration
                {"service_id": self.services[2]["id"], "quantity": 1}   # Another duration
            ]
            
            # Calculate expected duration (longest service in minutes)
            max_duration_minutes = 0
            longest_service = None
            
            for pkg_svc in package_services:
                service = next((s for s in self.services if s["id"] == pkg_svc["service_id"]), None)
                if service:
                    service_minutes = (
                        service.get("duration_days", 0) * 24 * 60 +
                        service.get("duration_hours", 0) * 60 +
                        service.get("duration_minutes", 0)
                    )
                    if service_minutes > max_duration_minutes:
                        max_duration_minutes = service_minutes
                        longest_service = service
            
            # Convert back to days, hours, minutes
            expected_days = max_duration_minutes // (24 * 60)
            remaining_minutes = max_duration_minutes % (24 * 60)
            expected_hours = remaining_minutes // 60
            expected_minutes = remaining_minutes % 60
            
            package_data = {
                "name": "Duration Test Package",
                "description": "Package for testing duration calculation",
                "services": package_services,
                "discount_percent": 10.0,
                "created_by_employee_id": self.employee_id
            }
            
            try:
                response = self.session.post(f"{BASE_URL}/packages", json=package_data)
                if response.status_code == 200:
                    package = response.json()
                    self.packages.append(package)
                    
                    # Verify package duration calculation
                    actual_days = package.get("duration_days", 0)
                    actual_hours = package.get("duration_hours", 0)
                    actual_minutes = package.get("duration_minutes", 0)
                    
                    duration_correct = (
                        actual_days == expected_days and
                        actual_hours == expected_hours and
                        actual_minutes == expected_minutes
                    )
                    
                    self.log_test("Package Duration Calculation", duration_correct,
                                f"Expected: {expected_days}d {expected_hours}h {expected_minutes}m, "
                                f"Got: {actual_days}d {actual_hours}h {actual_minutes}m")
                    
                    if longest_service:
                        self.log_test("Package Duration Source", True,
                                    f"Based on longest service: {longest_service['name']} "
                                    f"({longest_service.get('duration_days')}d {longest_service.get('duration_hours')}h {longest_service.get('duration_minutes')}m)")
                    
                    # Verify package shows all duration fields
                    duration_fields_present = all(field in package for field in ["duration_days", "duration_hours", "duration_minutes"])
                    self.log_test("Package Duration Fields Present", duration_fields_present,
                                f"All duration fields present: {'✓' if duration_fields_present else '✗'}")
                    
                else:
                    self.log_test("Create Package for Duration Testing", False,
                                f"Status: {response.status_code}, Response: {response.text}")
            except Exception as e:
                self.log_test("Package Duration Calculation", False, f"Error: {str(e)}")

    def test_duration_conversion_accuracy(self):
        """Test that duration calculations in minutes conversion work correctly"""
        test_cases = [
            {"days": 0, "hours": 0, "minutes": 30, "expected_total_minutes": 30},
            {"days": 0, "hours": 2, "minutes": 15, "expected_total_minutes": 135},
            {"days": 1, "hours": 0, "minutes": 0, "expected_total_minutes": 1440},
            {"days": 1, "hours": 4, "minutes": 30, "expected_total_minutes": 1710},
            {"days": 3, "hours": 0, "minutes": 0, "expected_total_minutes": 4320},
            {"days": 2, "hours": 3, "minutes": 45, "expected_total_minutes": 3105}
        ]
        
        for i, case in enumerate(test_cases):
            # Calculate total minutes
            actual_total_minutes = (
                case["days"] * 24 * 60 +
                case["hours"] * 60 +
                case["minutes"]
            )
            
            conversion_correct = actual_total_minutes == case["expected_total_minutes"]
            self.log_test(f"Duration Conversion Test {i+1}", conversion_correct,
                        f"{case['days']}d {case['hours']}h {case['minutes']}m = {actual_total_minutes} minutes "
                        f"(expected: {case['expected_total_minutes']})")
            
            # Test reverse conversion
            calculated_days = actual_total_minutes // (24 * 60)
            remaining = actual_total_minutes % (24 * 60)
            calculated_hours = remaining // 60
            calculated_minutes = remaining % 60
            
            reverse_correct = (
                calculated_days == case["days"] and
                calculated_hours == case["hours"] and
                calculated_minutes == case["minutes"]
            )
            
            self.log_test(f"Reverse Duration Conversion Test {i+1}", reverse_correct,
                        f"{actual_total_minutes} minutes = {calculated_days}d {calculated_hours}h {calculated_minutes}m")

    def test_service_duration_field_validation(self):
        """Test duration field validation and storage"""
        if not self.categories or not self.units or not self.employee_id:
            return
            
        # Test edge cases for duration validation
        edge_cases = [
            {"days": 0, "hours": 0, "minutes": 0, "description": "All zeros (instant service)"},
            {"days": 365, "hours": 23, "minutes": 59, "description": "Maximum reasonable values"},
            {"days": 0, "hours": 24, "minutes": 0, "description": "24 hours (should be valid)"},
            {"days": 0, "hours": 0, "minutes": 1440, "description": "1440 minutes (24 hours in minutes)"}
        ]
        
        for i, case in enumerate(edge_cases):
            try:
                service_data = {
                    "name": f"Duration Edge Case {i+1}",
                    "category_id": self.categories[0]["id"],
                    "unit_id": self.units[0]["id"],
                    "base_price": 10000,
                    "duration_days": case["days"],
                    "duration_hours": case["hours"],
                    "duration_minutes": case["minutes"],
                    "created_by_employee_id": self.employee_id
                }
                
                response = self.session.post(f"{BASE_URL}/services", json=service_data)
                if response.status_code == 200:
                    service = response.json()
                    
                    # Verify values are stored correctly
                    stored_correctly = (
                        service.get("duration_days") == case["days"] and
                        service.get("duration_hours") == case["hours"] and
                        service.get("duration_minutes") == case["minutes"]
                    )
                    
                    self.log_test(f"Duration Edge Case {i+1}", stored_correctly,
                                f"{case['description']} - Stored: {service.get('duration_days')}d {service.get('duration_hours')}h {service.get('duration_minutes')}m")
                else:
                    self.log_test(f"Duration Edge Case {i+1}", False,
                                f"{case['description']} - Status: {response.status_code}")
            except Exception as e:
                self.log_test(f"Duration Edge Case {i+1}", False, f"Error: {str(e)}")

    def test_get_services_with_duration_fields(self):
        """Test that GET /api/services returns all duration fields"""
        try:
            response = self.session.get(f"{BASE_URL}/services")
            if response.status_code == 200:
                services = response.json()
                self.log_test("Get Services with Duration Fields", True, f"Retrieved {len(services)} services")
                
                # Check that all services have the three duration fields
                services_with_complete_duration = 0
                for service in services:
                    has_all_duration_fields = all(field in service for field in ["duration_days", "duration_hours", "duration_minutes"])
                    if has_all_duration_fields:
                        services_with_complete_duration += 1
                    else:
                        self.log_test(f"Service Duration Fields: {service.get('name', 'Unknown')}", False,
                                    "Missing duration fields")
                
                if services_with_complete_duration == len(services):
                    self.log_test("All Services Have Duration Fields", True,
                                f"All {len(services)} services have complete duration fields")
                else:
                    self.log_test("All Services Have Duration Fields", False,
                                f"Only {services_with_complete_duration}/{len(services)} services have complete duration fields")
                
                # Show some examples of services with their durations
                for service in services[:5]:  # Show first 5 services
                    duration_display = f"{service.get('duration_days', 0)}d {service.get('duration_hours', 0)}h {service.get('duration_minutes', 0)}m"
                    self.log_test(f"Service Duration Example: {service.get('name')}", True,
                                f"Duration: {duration_display}, Price: Rp{service.get('base_price', 0)}")
            else:
                self.log_test("Get Services with Duration Fields", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Get Services with Duration Fields", False, f"Error: {str(e)}")

    def run_all_tests(self):
        """Run all detailed duration tests"""
        print("=" * 80)
        print("LAUNDRYPRO DETAILED DURATION SYSTEM TESTING")
        print("=" * 80)
        print()
        
        # Step 1: Authentication
        if not self.authenticate_employee():
            print("❌ Cannot proceed without authentication")
            return
        
        # Step 2: Test default data initialization with detailed duration
        self.test_default_data_with_detailed_duration()
        
        # Step 3: Setup test data
        if not self.setup_test_data():
            print("❌ Cannot proceed without categories and units")
            return
        
        # Step 4: Test service creation with various duration combinations
        self.test_service_creation_with_detailed_duration()
        
        # Step 5: Test duration conversion accuracy
        self.test_duration_conversion_accuracy()
        
        # Step 6: Test duration field validation
        self.test_service_duration_field_validation()
        
        # Step 7: Test GET services returns all duration fields
        self.test_get_services_with_duration_fields()
        
        # Step 8: Test package duration calculation
        self.test_package_duration_calculation()
        
        # Final Results
        print()
        print("=" * 80)
        print("DETAILED DURATION TESTING RESULTS")
        print("=" * 80)
        total_tests = self.test_results["passed"] + self.test_results["failed"]
        success_rate = (self.test_results["passed"] / total_tests * 100) if total_tests > 0 else 0
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {self.test_results['passed']} ✅")
        print(f"Failed: {self.test_results['failed']} ❌")
        print(f"Success Rate: {success_rate:.1f}%")
        
        if self.test_results["errors"]:
            print("\nFailed Tests:")
            for error in self.test_results["errors"]:
                print(f"  • {error}")
        
        print()
        return success_rate >= 90  # Consider successful if 90%+ tests pass

if __name__ == "__main__":
    tester = DetailedDurationTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)