#!/usr/bin/env python3
"""Simple script to run ENS Manager in interactive mode."""

import sys
import os

# Add the current directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ens_manager.cli import interactive_menu, config_manager, ui

def main():
    """Run the interactive menu directly."""
    try:
        ui.display_header()
        
        # Initialize configuration
        if not config_manager.initialize():
            password = ui.prompt_input("Create a password for configuration encryption:", password=True)
            confirm = ui.prompt_input("Confirm password:", password=True)
            
            if password != confirm:
                ui.display_error("Passwords do not match")
                return
                
            if not config_manager.initialize(password):
                return
        
        interactive_menu()
        ui.console.print("\n[accent]Goodbye! 👋[/accent]")
    except KeyboardInterrupt:
        ui.console.print("\n[accent]Goodbye! 👋[/accent]")
    except Exception as e:
        ui.display_error(str(e))

if __name__ == '__main__':
    main() 