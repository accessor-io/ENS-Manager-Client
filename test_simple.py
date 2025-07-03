#!/usr/bin/env python3
"""Simple test script for ENS Manager."""

import sys
import os

# Add the current directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ens_manager.config_manager import ConfigManager
from ens_manager.ui_manager import UIManager

def test_basic_functionality():
    """Test basic functionality without interactive menus."""
    print("Testing ENS Manager basic functionality...")
    
    # Test UI Manager
    ui = UIManager()
    ui.display_success("UI Manager initialized successfully")
    
    # Test Config Manager
    config = ConfigManager()
    ui.display_success("Config Manager initialized successfully")
    
    # Test provider management
    if config.add_provider("test_infura", "test_api_key", "Infura"):
        ui.display_success("Provider added successfully")
        
        providers = config.list_providers()
        ui.display_info(f"Available providers: {providers}")
        
        if config.set_active_provider("test_infura"):
            ui.display_success("Active provider set successfully")
        else:
            ui.display_error("Failed to set active provider")
    else:
        ui.display_error("Failed to add provider")
    
    print("Basic functionality test completed!")

if __name__ == '__main__':
    test_basic_functionality() 