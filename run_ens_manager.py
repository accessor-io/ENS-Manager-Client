#!/usr/bin/env python3
"""Standalone ENS Manager runner that bypasses Click CLI for interactive mode."""

import sys
import os

# Add the current directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ens_manager.config_manager import ConfigManager
from ens_manager.ui_manager import UIManager
from ens_manager.ens_operations import ENSManager

def simple_interactive_menu():
    """Simple interactive menu without Click CLI interference."""
    ui = UIManager()
    config = ConfigManager()
    
    # Initialize configuration
    if not config.initialize():
        password = ui.prompt_input("Create a password for configuration encryption:", password=True)
        confirm = ui.prompt_input("Confirm password:", password=True)
        
        if password != confirm:
            ui.display_error("Passwords do not match")
            return
            
        if not config.initialize(password):
            return
    
    while True:
        ui.display_header()
        
        actions = [
            "Resolve ENS name",
            "Reverse resolve address", 
            "Get owner",
            "Get text record",
            "Manage providers",
            "Manage accounts",
            "View configuration",
            "Exit"
        ]
        
        action = ui.create_menu("What would you like to do?", actions)
        
        if action == "Exit" or not action:
            break
            
        elif action == "Manage providers":
            manage_providers_simple(ui, config)
            
        elif action == "Manage accounts":
            manage_accounts_simple(ui, config)
            
        elif action == "View configuration":
            display_config_simple(ui, config)
            
        else:
            # For ENS operations, we need a provider
            provider_url = config.get_provider()
            if not provider_url:
                ui.display_error("No active provider configured. Please add a provider first.")
                ui.pause()
                continue
                
            # Initialize ENS Manager
            try:
                manager = ENSManager(provider_url=provider_url)
            except Exception as e:
                ui.display_error(f"Failed to initialize ENS Manager: {str(e)}")
                ui.pause()
                continue
            
            if action == "Resolve ENS name":
                name = ui.prompt_input("Enter ENS name:")
                if name:
                    try:
                        address = manager.resolve_name(name)
                        if address:
                            ui.display_success(f"{name} resolves to: {address}")
                        else:
                            ui.display_error(f"Could not resolve {name}")
                    except Exception as e:
                        ui.display_error(f"Error resolving name: {str(e)}")
                        
            elif action == "Reverse resolve address":
                address = ui.prompt_input("Enter Ethereum address:")
                if address:
                    try:
                        name = manager.reverse_resolve(address)
                        if name:
                            ui.display_success(f"{address} resolves to: {name}")
                        else:
                            ui.display_error(f"Could not reverse resolve {address}")
                    except Exception as e:
                        ui.display_error(f"Error reverse resolving: {str(e)}")
                        
            elif action == "Get owner":
                name = ui.prompt_input("Enter ENS name:")
                if name:
                    try:
                        owner = manager.get_owner(name)
                        if owner:
                            ui.display_success(f"Owner of {name}: {owner}")
                        else:
                            ui.display_error(f"Could not get owner of {name}")
                    except Exception as e:
                        ui.display_error(f"Error getting owner: {str(e)}")
                        
            elif action == "Get text record":
                name = ui.prompt_input("Enter ENS name:")
                if name:
                    key = ui.prompt_input("Enter text record key (e.g., email, url, avatar):")
                    if key:
                        try:
                            value = manager.get_text_record(name, key)
                            if value:
                                ui.display_success(f"{key} record for {name}: {value}")
                            else:
                                ui.display_error(f"Could not get {key} record for {name}")
                        except Exception as e:
                            ui.display_error(f"Error getting text record: {str(e)}")
        
        ui.pause()
    
    ui.console.print("\n[accent]Goodbye! 👋[/accent]")

def manage_providers_simple(ui, config):
    """Simple provider management without Click."""
    while True:
        actions = [
            "Add new provider",
            "Remove provider", 
            "Set active provider",
            "View providers",
            "Back to main menu"
        ]
        
        action = ui.create_menu("Provider Management", actions)
        
        if action == "Back to main menu" or not action:
            break
            
        elif action == "Add new provider":
            provider_choices = list(ConfigManager.DEFAULT_PROVIDERS.keys()) + ["Custom"]
            provider_type = ui.create_menu("Select provider type:", provider_choices)
            
            if not provider_type:
                continue
                
            name = ui.prompt_input("Enter provider name:")
            if not name:
                continue
                
            if provider_type == "Custom":
                api_key = ui.prompt_input("Enter provider URL:")
                provider_type = None
            else:
                api_key = ui.prompt_input("Enter API key:")
                
            if api_key:
                if config.add_provider(name, api_key, provider_type):
                    ui.display_success(f"Added provider {name}")
                    if ui.confirm("Set as active provider?"):
                        config.set_active_provider(name)
                        ui.display_success(f"Set {name} as active provider")
                        
        elif action == "Remove provider":
            providers = config.list_providers()
            if not providers:
                ui.display_warning("No providers configured")
                continue
                
            name = ui.create_menu("Select provider to remove:", providers + ["Cancel"])
            
            if name and name != "Cancel":
                if config.remove_provider(name):
                    ui.display_success(f"Removed provider {name}")
                    
        elif action == "Set active provider":
            providers = config.list_providers()
            if not providers:
                ui.display_warning("No providers configured")
                continue
                
            name = ui.create_menu("Select active provider:", providers + ["Cancel"])
            
            if name and name != "Cancel":
                if config.set_active_provider(name):
                    ui.display_success(f"Set {name} as active provider")
                    
        elif action == "View providers":
            providers = config.list_providers()
            if not providers:
                ui.display_warning("No providers configured")
            else:
                active = config.get_active_provider()
                ui.display_info("Configured Providers:")
                for name in providers:
                    provider = config.get_provider_info(name)
                    status = " (Active)" if name == active else ""
                    ui.display_info(f"  {name}: {provider.get('type', 'Custom')}{status}")

def manage_accounts_simple(ui, config):
    """Simple account management without Click."""
    while True:
        actions = [
            "Add new account",
            "Remove account",
            "Set active account", 
            "View accounts",
            "Back to main menu"
        ]
        
        action = ui.create_menu("Account Management", actions)
        
        if action == "Back to main menu" or not action:
            break
            
        elif action == "Add new account":
            name = ui.prompt_input("Enter account name:")
            if not name:
                continue
                
            private_key = ui.prompt_input("Enter private key:", password=True)
            if private_key:
                if config.add_account(name, private_key):
                    ui.display_success(f"Added account {name}")
                    if ui.confirm("Set as active account?"):
                        config.set_active_account(name)
                        ui.display_success(f"Set {name} as active account")
                        
        elif action == "Remove account":
            accounts = config.list_accounts()
            if not accounts:
                ui.display_warning("No accounts configured")
                continue
                
            name = ui.create_menu("Select account to remove:", accounts + ["Cancel"])
            
            if name and name != "Cancel":
                if config.remove_account(name):
                    ui.display_success(f"Removed account {name}")
                    
        elif action == "Set active account":
            accounts = config.list_accounts()
            if not accounts:
                ui.display_warning("No accounts configured")
                continue
                
            name = ui.create_menu("Select active account:", accounts + ["Cancel"])
            
            if name and name != "Cancel":
                if config.set_active_account(name):
                    ui.display_success(f"Set {name} as active account")
                    
        elif action == "View accounts":
            accounts = config.list_accounts()
            if not accounts:
                ui.display_warning("No accounts configured")
            else:
                active = config.get_active_account()
                ui.display_info("Configured Accounts:")
                for name in accounts:
                    status = " (Active)" if name == active else ""
                    ui.display_info(f"  {name}{status}")

def display_config_simple(ui, config):
    """Display configuration status."""
    ui.display_info("Configuration Status:")
    
    # Show active provider
    active_provider = config.get_active_provider()
    if active_provider:
        ui.display_info(f"Active Provider: {active_provider}")
    else:
        ui.display_warning("No active provider")
    
    # Show active account
    active_account = config.get_active_account()
    if active_account:
        ui.display_info(f"Active Account: {active_account}")
    else:
        ui.display_warning("No active account")

def main():
    """Main entry point."""
    try:
        simple_interactive_menu()
    except KeyboardInterrupt:
        print("\nGoodbye! 👋")
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == '__main__':
    main() 