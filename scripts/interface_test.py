"""Systematic ENS Manager Interface Test Script."""

import sys
import json
import asyncio
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

from ens_manager.ens_operations import ENSManager
from ens_manager.config_manager import ConfigManager
from rich.console import Console

# Error code mapping
ERROR_CODES = {
    "INIT_FAILED": "E001",
    "NO_PROVIDER": "E002",
    "NO_ACCOUNT": "E003",
    "INVALID_NAME": "E004",
    "NETWORK_ERROR": "E005",
    "CONTRACT_ERROR": "E006",
    "RESOLVER_ERROR": "E007",
    "REGISTRATION_ERROR": "E008",
    "TRANSFER_ERROR": "E009",
    "PERMISSION_ERROR": "E010",
    "GAS_ESTIMATION_ERROR": "E011",
    "TRANSACTION_ERROR": "E012",
    "SUBDOMAIN_ERROR": "E013",
    "RESOLUTION_ERROR": "E014",
    "REVERSE_RESOLUTION_ERROR": "E015",
    "CONTENT_HASH_ERROR": "E016",
    "TEXT_RECORD_ERROR": "E017",
    "VALIDATION_ERROR": "E018",
    "NETWORK_SPECIFIC_ERROR": "E019",
    "GLOBAL_RESOLUTION_ERROR": "E020",
}

class InterfaceTester:
    """Test all ENS Manager interface options systematically."""
    
    def __init__(self):
        """Initialize tester with ENS Manager and test parameters."""
        self.console = Console()
        self.config = ConfigManager()
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "test_results": {},
            "errors": {},
            "statistics": {
                "total_tests": 0,
                "passed": 0,
                "failed": 0,
                "error_counts": {}
            }
        }
        
        # Test parameters
        self.test_name = "test123.eth"
        self.test_address = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
        self.test_duration = 1  # year
        
        try:
            provider_url = self.config.get_provider()
            private_key = self.config.get_account()
            self.manager = ENSManager(provider_url=provider_url, private_key=private_key)
        except Exception as e:
            self.log_error("INIT_FAILED", str(e))
            sys.exit(1)
    
    def log_error(self, error_type: str, message: str) -> None:
        """Log an error with its code."""
        if error_type not in self.results["errors"]:
            self.results["errors"][error_type] = {
                "code": ERROR_CODES[error_type],
                "occurrences": 1,
                "first_message": message
            }
        else:
            self.results["errors"][error_type]["occurrences"] += 1
    
    def log_test_result(self, test_name: str, success: bool, data: Any = None, error: Optional[str] = None) -> None:
        """Log the result of a test."""
        self.results["test_results"][test_name] = {
            "success": success,
            "timestamp": datetime.now().isoformat(),
            "data": data
        }
        
        if error:
            self.results["test_results"][test_name]["error"] = error
        
        self.results["statistics"]["total_tests"] += 1
        if success:
            self.results["statistics"]["passed"] += 1
        else:
            self.results["statistics"]["failed"] += 1
    
    async def test_basic_operations(self) -> None:
        """Test basic ENS operations."""
        # Test name resolution
        try:
            address = self.manager.resolve_name(self.test_name)
            self.log_test_result("resolve_name", True, {"address": address})
        except Exception as e:
            self.log_error("RESOLUTION_ERROR", str(e))
            self.log_test_result("resolve_name", False, error=str(e))
        
        # Test reverse resolution
        try:
            name = self.manager.reverse_resolve(self.test_address)
            self.log_test_result("reverse_resolve", True, {"name": name})
        except Exception as e:
            self.log_error("REVERSE_RESOLUTION_ERROR", str(e))
            self.log_test_result("reverse_resolve", False, error=str(e))
    
    async def test_registration_operations(self) -> None:
        """Test registration-related operations."""
        # Check availability
        try:
            available = self.manager.check_name_available(self.test_name)
            self.log_test_result("check_availability", True, {"available": available})
        except Exception as e:
            self.log_error("REGISTRATION_ERROR", str(e))
            self.log_test_result("check_availability", False, error=str(e))
        
        # Get registration cost
        try:
            cost = self.manager.get_registration_cost(self.test_name, self.test_duration)
            self.log_test_result("get_registration_cost", True, {"cost_eth": cost})
        except Exception as e:
            self.log_error("REGISTRATION_ERROR", str(e))
            self.log_test_result("get_registration_cost", False, error=str(e))
    
    async def test_management_operations(self) -> None:
        """Test name management operations."""
        # Get owner
        try:
            owner = self.manager.get_owner(self.test_name)
            self.log_test_result("get_owner", True, {"owner": owner})
        except Exception as e:
            self.log_error("CONTRACT_ERROR", str(e))
            self.log_test_result("get_owner", False, error=str(e))
        
        # Get resolver
        try:
            resolver = self.manager.get_resolver(self.test_name)
            self.log_test_result("get_resolver", True, {"resolver": resolver})
        except Exception as e:
            self.log_error("RESOLVER_ERROR", str(e))
            self.log_test_result("get_resolver", False, error=str(e))
    
    async def test_advanced_features(self) -> None:
        """Test advanced ENS features."""
        # Test global resolution
        try:
            global_results = await self.manager.resolve_globally(self.test_name)
            self.log_test_result("global_resolution", True, global_results)
        except Exception as e:
            self.log_error("GLOBAL_RESOLUTION_ERROR", str(e))
            self.log_test_result("global_resolution", False, error=str(e))
        
        # Test name details
        try:
            details = self.manager.get_name_details(self.test_name)
            self.log_test_result("name_details", True, details)
        except Exception as e:
            self.log_error("CONTRACT_ERROR", str(e))
            self.log_test_result("name_details", False, error=str(e))
    
    async def test_network_specific(self) -> None:
        """Test network-specific features."""
        for network in self.manager.get_available_networks():
            try:
                address = self.manager.resolve_name(self.test_name, network)
                self.log_test_result(f"resolve_name_{network}", True, {"address": address})
            except Exception as e:
                self.log_error("NETWORK_SPECIFIC_ERROR", f"{network}: {str(e)}")
                self.log_test_result(f"resolve_name_{network}", False, error=str(e))
    
    def export_results(self, output_file: str = "interface_test_results.json") -> None:
        """Export test results to JSON file."""
        # Update error statistics
        for error_type, error_data in self.results["errors"].items():
            self.results["statistics"]["error_counts"][error_type] = error_data["occurrences"]
        
        # Export to file
        output_path = Path(output_file)
        with open(output_path, 'w') as f:
            json.dump(self.results, f, indent=2)
        
        self.console.print(f"\nTest results exported to {output_path}")
        self.console.print(f"\nStatistics:")
        self.console.print(f"Total tests: {self.results['statistics']['total_tests']}")
        self.console.print(f"Passed: {self.results['statistics']['passed']}")
        self.console.print(f"Failed: {self.results['statistics']['failed']}")
        self.console.print("\nUnique Errors:")
        for error_type, error_data in self.results["errors"].items():
            self.console.print(f"{error_type} ({error_data['code']}): {error_data['occurrences']} occurrences")

async def main():
    """Run all interface tests."""
    tester = InterfaceTester()
    
    # Run all test categories
    await tester.test_basic_operations()
    await tester.test_registration_operations()
    await tester.test_management_operations()
    await tester.test_advanced_features()
    await tester.test_network_specific()
    
    # Export results
    tester.export_results()

if __name__ == "__main__":
    asyncio.run(main()) 