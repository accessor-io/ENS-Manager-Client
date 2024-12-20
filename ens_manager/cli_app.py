"""Command-line interface for ENS Manager."""

import click
from typing import List, Dict, Any, Optional
import os
from getpass import getpass
import asyncio
from rich.layout import Layout
from rich.panel import Panel
from rich.table import Table
from rich import box
from rich.console import Console
from rich.live import Live
from rich.text import Text
from rich.progress import Progress, SpinnerColumn, TextColumn
from datetime import datetime, timedelta
import json
from pathlib import Path

from ens_manager.ens_operations import ENSManager
from ens_manager.config.config_manager import ConfigManager
from ens_manager.ui_manager import UIManager

ui = UIManager()
config_manager = ConfigManager()
console = Console()

def init_manager() -> Optional[ENSManager]:
    """Initialize ENS Manager with current configuration."""
    try:
        provider_url = config_manager.get_provider()
        private_key = config_manager.get_account()
        
        if not provider_url:
            ui.display_error("No active provider configured")
            return None
            
        return ENSManager(
            provider_url=provider_url,
            private_key=private_key
        )
    except Exception as e:
        ui.display_error(f"Failed to initialize manager: {str(e)}")
        return None

def manage_providers():
    """Manage provider configurations."""
    actions = [
        "Add new provider",
        "Remove provider",
        "Set active provider",
        "View providers",
        "Back to main menu"
    ]
    
    while True:
        try:
            action = ui.create_menu("Provider Management", actions)
            
            if action == "Back to main menu" or not action:
                break
                
            if action == "Add new provider":
                provider_choices = list(ConfigManager.DEFAULT_PROVIDERS.keys()) + ["Custom"]
                provider_type = ui.create_menu(
                    "Select provider type:",
                    provider_choices
                )
                
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
                    if config_manager.add_provider(name, api_key, provider_type):
                        ui.display_success(f"Added provider {name}")
                        if ui.confirm("Set as active provider?"):
                            config_manager.set_active_provider(name)
                            ui.display_success(f"Set {name} as active provider")
                    
            elif action == "Remove provider":
                providers = config_manager.list_providers()
                if not providers:
                    ui.display_warning("No providers configured")
                    continue
                    
                name = ui.create_menu(
                    "Select provider to remove:",
                    providers + ["Cancel"]
                )
                
                if name and name != "Cancel":
                    if config_manager.remove_provider(name):
                        ui.display_success(f"Removed provider {name}")
                    
            elif action == "Set active provider":
                providers = config_manager.list_providers()
                if not providers:
                    ui.display_warning("No providers configured")
                    continue
                    
                name = ui.create_menu(
                    "Select active provider:",
                    providers + ["Cancel"]
                )
                
                if name and name != "Cancel":
                    if config_manager.set_active_provider(name):
                        ui.display_success(f"Set {name} as active provider")
                    
            elif action == "View providers":
                providers = config_manager.list_providers()
                if not providers:
                    ui.display_warning("No providers configured")
                else:
                    active = config_manager.get_active_provider()
                    table = Table(title="Configured Providers")
                    table.add_column("Provider", style="cyan")
                    table.add_column("Type", style="magenta")
                    table.add_column("URL", style="green")
                    table.add_column("Status", style="yellow")
                    
                    for name in providers:
                        provider = config_manager.get_provider_info(name)
                        table.add_row(
                            name,
                            provider.get('type', 'Custom'),
                            provider.get('url', ''),
                            "Active" if name == active else ""
                        )
                    console.print(table)
            
            ui.pause()
        except Exception as e:
            ui.display_error(f"Provider management error: {str(e)}")
            ui.pause()

def manage_accounts():
    """Manage account configurations."""
    actions = [
        "Add new account",
        "Remove account",
        "Set active account",
        "View accounts",
        "Back to main menu"
    ]
    
    while True:
        try:
            action = ui.create_menu("Account Management", actions)
            
            if action == "Back to main menu" or not action:
                break
                
            if action == "Add new account":
                name = ui.prompt_input("Enter account name:")
                if not name:
                    continue
                    
                private_key = ui.prompt_input("Enter private key:", password=True)
                if private_key:
                    if config_manager.add_account(name, private_key):
                        ui.display_success(f"Added account {name}")
                        if ui.confirm("Set as active account?"):
                            config_manager.set_active_account(name)
                            ui.display_success(f"Set {name} as active account")
                    
            elif action == "Remove account":
                accounts = config_manager.list_accounts()
                if not accounts:
                    ui.display_warning("No accounts configured")
                    continue
                    
                name = ui.create_menu(
                    "Select account to remove:",
                    accounts + ["Cancel"]
                )
                
                if name and name != "Cancel":
                    if config_manager.remove_account(name):
                        ui.display_success(f"Removed account {name}")
                    
            elif action == "Set active account":
                accounts = config_manager.list_accounts()
                if not accounts:
                    ui.display_warning("No accounts configured")
                    continue
                    
                name = ui.create_menu(
                    "Select active account:",
                    accounts + ["Cancel"]
                )
                
                if name and name != "Cancel":
                    if config_manager.set_active_account(name):
                        ui.display_success(f"Set {name} as active account")
                    
            elif action == "View accounts":
                accounts = config_manager.list_accounts()
                if not accounts:
                    ui.display_warning("No accounts configured")
                else:
                    active = config_manager.get_active_account()
                    table = Table(title="Configured Accounts")
                    table.add_column("Account", style="cyan")
                    table.add_column("Address", style="green")
                    table.add_column("Status", style="yellow")
                    
                    for name in accounts:
                        account = config_manager.get_account_info(name)
                        table.add_row(
                            name,
                            account.get('address', ''),
                            "Active" if name == active else ""
                        )
                    console.print(table)
            
            ui.pause()
        except Exception as e:
            ui.display_error(f"Account management error: {str(e)}")
            ui.pause()

def manage_names():
    """Manage ENS names."""
    actions = [
        "Register new name",
        "Batch register names",
        "Bulk register names",
        "Renew name",
        "Batch renew names",
        "Bulk renew names",
        "Set resolver",
        "Set address",
        "Set text record",
        "Back to main menu"
    ]
    
    while True:
        try:
            action = ui.create_menu("Name Management", actions)
            
            if action == "Back to main menu" or not action:
                break
                
            manager = init_manager()
            if not manager:
                continue
                
            if action == "Register new name":
                name = ui.prompt_input("Enter ENS name to register:")
                if name:
                    duration = ui.prompt_input("Enter registration duration in years (default: 1):")
                    try:
                        duration = int(duration) if duration else 1
                    except ValueError:
                        ui.display_error("Invalid duration")
                        continue
                        
                    result = handle_ens_operation(name, "Registering name", manager.register_name, name, duration)
                    if result:
                        ui.display_success(f"Successfully registered {name} for {duration} years")
                    
            elif action == "Renew name":
                name = ui.prompt_input("Enter ENS name to renew:")
                if name:
                    duration = ui.prompt_input("Enter renewal duration in years (default: 1):")
                    try:
                        duration = int(duration) if duration else 1
                    except ValueError:
                        ui.display_error("Invalid duration")
                        continue
                        
                    result = handle_ens_operation(name, "Renewing name", manager.renew_name, name, duration)
                    if result:
                        ui.display_success(f"Successfully renewed {name} for {duration} years")
                    
            elif action == "Batch renew names":
                batch_renew_names(manager)
                continue
            
            elif action == "Bulk renew names":
                bulk_renew_names(manager)
                continue
            
            elif action == "Set resolver":
                name = ui.prompt_input("Enter ENS name:")
                if name:
                    resolver = ui.prompt_input("Enter resolver address (leave empty for default):")
                    result = handle_ens_operation(name, "Setting resolver", manager.set_resolver, name, resolver)
                    if result:
                        ui.display_success(f"Successfully set resolver for {name}")
                    
            elif action == "Set address":
                name = ui.prompt_input("Enter ENS name:")
                if name:
                    address = ui.prompt_input("Enter Ethereum address:")
                    if address:
                        result = handle_ens_operation(name, "Setting address", manager.set_address, name, address)
                        if result:
                            ui.display_success(f"Successfully set address for {name}")
                    
            elif action == "Set text record":
                name = ui.prompt_input("Enter ENS name:")
                if name:
                    key = ui.prompt_input("Enter text record key (e.g., email, url, avatar):")
                    if key:
                        value = ui.prompt_input(f"Enter value for {key}:")
                        if value:
                            result = handle_ens_operation(name, "Setting text record", manager.set_text_record, name, key, value)
                            if result:
                                ui.display_success(f"Successfully set {key} record for {name}")
            
            elif action == "Batch register names":
                batch_register_names(manager)
                continue
            
            elif action == "Bulk register names":
                bulk_register_names(manager)
                continue
            
            ui.pause()
        except Exception as e:
            ui.display_error(f"Name management error: {str(e)}")
            ui.pause()

def manage_subdomains(manager):
    """Manage ENS subdomains."""
    actions = [
        "Create subdomain",
        "Delete subdomain",
        "Configure subdomain",
        "Back to main menu"
    ]

    while True:
        try:
            action = ui.create_menu("Subdomain Management", actions)

            if action == "Back to main menu" or not action:
                break

            if action == "Create subdomain":
                domain = ui.prompt_input("Enter primary ENS domain:")
                if not domain:
                    continue

                subdomain = ui.prompt_input("Enter subdomain to create:")
                if subdomain:
                    result = handle_ens_operation(subdomain, "Creating subdomain", manager.create_subdomain, domain, subdomain)
                    if result:
                        ui.display_success(f"Successfully created subdomain {subdomain}.{domain}")
                    else:
                        ui.display_error(f"Failed to create subdomain {subdomain}.{domain}")

            elif action == "Delete subdomain":
                domain = ui.prompt_input("Enter primary ENS domain:")
                if not domain:
                    continue

                subdomain = ui.prompt_input("Enter subdomain to delete:")
                if subdomain:
                    result = handle_ens_operation(subdomain, "Deleting subdomain", manager.delete_subdomain, domain, subdomain)
                    if result:
                        ui.display_success(f"Successfully deleted subdomain {subdomain}.{domain}")
                    else:
                        ui.display_error(f"Failed to delete subdomain {subdomain}.{domain}")

            elif action == "Configure subdomain":
                domain = ui.prompt_input("Enter primary ENS domain:")
                if not domain:
                    continue

                subdomain = ui.prompt_input("Enter subdomain to configure:")
                if subdomain:
                    config = ui.prompt_input("Enter configuration settings (JSON format):")
                    try:
                        config_data = json.loads(config)
                        result = handle_ens_operation(subdomain, "Configuring subdomain", manager.configure_subdomain, domain, subdomain, config_data)
                        if result:
                            ui.display_success(f"Successfully configured subdomain {subdomain}.{domain}")
                        else:
                            ui.display_error(f"Failed to configure subdomain {subdomain}.{domain}")
                    except json.JSONDecodeError:
                        ui.display_error("Invalid configuration format")

            ui.pause()
        except Exception as e:
            ui.display_error(f"Subdomain management error: {str(e)}")
            ui.pause()

    def manage_notifications():
    """Manage notification preferences for ENS name expirations."""
    actions = [
        "Enable email notifications",
        "Enable SMS notifications",
        "Set notification threshold",
        "Back to main menu"
    ]

    while True:
        try:
            action = ui.create_menu("Notification Management", actions)

            if action == "Back to main menu" or not action:
                break

            if action == "Enable email notifications":
                email = ui.prompt_input("Enter your email address:")
                if email:
                    config_manager.set_setting('email_notifications', email)
                    ui.display_success("Email notifications enabled")

            elif action == "Enable SMS notifications":
                phone = ui.prompt_input("Enter your phone number:")
                if phone:
                    config_manager.set_setting('sms_notifications', phone)
                    ui.display_success("SMS notifications enabled")

            elif action == "Set notification threshold":
                days = ui.prompt_input("Enter the number of days before expiry to notify (default: 30):")
                try:
                    days = int(days) if days else 30
                    config_manager.set_setting('notification_threshold', days)
                    ui.display_success(f"Notification threshold set to {days} days")
                except ValueError:
                    ui.display_error("Invalid number of days")

            ui.pause()
        except Exception as e:
            ui.display_error(f"Notification management error: {str(e)}")
            ui.pause()

def interactive_menu():
    """Run the interactive menu with enhanced descriptions."""
    actions = [
        "Resolve ENS name - Look up the address associated with an ENS name",
        "Reverse resolve - Find the ENS name associated with an address",
        "Get owner - Retrieve the owner of an ENS name",
        "Get resolver - Get the resolver for an ENS name",
        "Get TTL - Get the time-to-live for an ENS name",
        "Get text record - Retrieve a text record for an ENS name",
        "View name history - View the history of changes for an ENS name",
        "Manage names - Add, remove, or update ENS names",
        "Manage networks - Configure network settings",
        "Manage providers - Add, remove, or set active providers",
        "Manage accounts - Add, remove, or set active accounts",
        "Manage subdomains - Create, delete, or configure subdomains",
        "Transfer ENS name - Transfer ownership of an ENS name",
        "Manage notifications - Set preferences for ENS name expiry notifications",
        "Exit - Quit the application"
    ]
    
    while True:
        try:
            ui.display_header()
            action = ui.create_menu("What would you like to do?", actions)
            
            if action == "Exit" or not action:
                break
            
            if action == "Manage providers":
                manage_providers()
                continue
            
            elif action == "Manage accounts":
                manage_accounts()
                continue
            
            elif action == "View configuration":
                config_manager.display_config_status()
                ui.pause()
                continue
            
            elif action == "Manage names":
                manage_names()
                continue
            
            manager = init_manager()
            if not manager:
                continue
            
            if action == "Resolve ENS name":
                name = ui.prompt_input("Enter ENS name:")
                if name:
                    address = handle_ens_operation(name, "Resolving ENS name", manager.resolve_name, name)
                    if address:
                        ui.display_success(f"{name} resolves to: {address}")
                    else:
                        ui.display_error(f"Could not resolve {name}")
                        
            elif action == "Reverse resolve":
                address = ui.prompt_input("Enter Ethereum address:")
                if address:
                    name = handle_ens_operation(address, "Reverse resolving address", manager.reverse_resolve, address)
                    if name:
                        ui.display_success(f"{address} resolves to: {name}")
                    else:
                        ui.display_error(f"Could not reverse resolve {address}")
                        
            elif action == "Get owner":
                name = ui.prompt_input("Enter ENS name:")
                if name:
                    owner = handle_ens_operation(name, "Getting owner information", manager.get_owner, name)
                    if owner:
                        ui.display_success(f"Owner of {name}: {owner}")
                    else:
                        ui.display_error(f"Could not get owner of {name}")
                        
            elif action == "Get text record":
                name = ui.prompt_input("Enter ENS name:")
                if name:
                    key = ui.prompt_input("Enter text record key (e.g., email, url, avatar):")
                    if key:
                        value = handle_ens_operation(name, "Getting text record", manager.get_text_record, name, key)
                        if value:
                            ui.display_success(f"{key} record for {name}: {value}")
                        else:
                            ui.display_error(f"Could not get {key} record for {name}")
                            
            elif action == "View name history":
                name = ui.prompt_input("Enter ENS name:")
                if name:
                    history = handle_ens_operation(name, "Getting name history", manager.get_name_history, name)
                    if history:
                        ui.display_history(history, name)
                    else:
                        ui.display_error(f"No history found for {name}")
            
            elif action == "Manage subdomains":
                manage_subdomains(manager)
                continue
            
            elif action == "Transfer ENS name":
                transfer_ens_name(manager)
                continue
            
            elif action == "Manage notifications":
                manage_notifications()
                continue
            
            ui.pause()
        except Exception as e:
            ui.display_error(f"An error occurred: {str(e)}. Please try again or contact support.")
            ui.pause()

def handle_ens_operation(name: str, operation_name: str, operation_func, *args):
    """Handle ENS operations with proper loading and error handling."""
    try:
        with ui.display_loading(f"{operation_name}...") as progress:
            task = progress.add_task("Processing...", total=None)
            result = operation_func(*args)
            
        return result
    except Exception as e:
        ui.display_error(f"Operation failed: {str(e)}")
        return None

def initial_configuration():
    """Initial configuration menu for importing accounts and using saved accounts."""
    actions = [
        "Import account by private key",
        "Use previously configured account",
        "Back to main menu"
    ]

    while True:
        try:
            action = ui.create_menu("Initial Configuration", actions)

            if action == "Back to main menu" or not action:
                break

            if action == "Import account by private key":
                label = ui.prompt_input("Enter account label:")
                if not label:
                    continue

                private_key = ui.prompt_input("Enter private key:", password=True)
                if private_key:
                    if config_manager.add_account(label, private_key):
                        ui.display_success(f"Imported account {label}")

            elif action == "Use previously configured account":
                accounts = config_manager.list_accounts()
                if not accounts:
                    ui.display_warning("No accounts configured")
                    continue

                label = ui.create_menu(
                    "Select account to use:",
                    accounts + ["Cancel"]
                )

                if label and label != "Cancel":
                    if config_manager.set_active_account(label):
                        ui.display_success(f"Using account {label}")

            ui.pause()
        except Exception as e:
            ui.display_error(f"Configuration error: {str(e)}")
            ui.pause()

def batch_register_names(manager):
    """Register multiple ENS names at once."""
    names = ui.prompt_input("Enter ENS names to register (comma-separated):")
    if not names:
        return

    duration = ui.prompt_input("Enter registration duration in years (default: 1):")
    try:
        duration = int(duration) if duration else 1
    except ValueError:
        ui.display_error("Invalid duration")
        return

    name_list = [name.strip() for name in names.split(',')]
    for name in name_list:
        result = handle_ens_operation(name, "Registering name", manager.register_name, name, duration)
        if result:
            ui.display_success(f"Successfully registered {name} for {duration} years")
        else:
            ui.display_error(f"Failed to register {name}")

def batch_renew_names(manager):
    """Renew multiple ENS names at once."""
    names = ui.prompt_input("Enter ENS names to renew (comma-separated):")
    if not names:
        return

    duration = ui.prompt_input("Enter renewal duration in years (default: 1):")
    try:
        duration = int(duration) if duration else 1
    except ValueError:
        ui.display_error("Invalid duration")
        return

    name_list = [name.strip() for name in names.split(',')]
    for name in name_list:
        result = handle_ens_operation(name, "Renewing name", manager.renew_name, name, duration)
        if result:
            ui.display_success(f"Successfully renewed {name} for {duration} years")
        else:
            ui.display_error(f"Failed to renew {name}")

def bulk_register_names(manager):
    """Bulk register ENS names from a CSV file."""
    file_path = ui.prompt_input("Enter the path to the CSV file with ENS names:")
    if not file_path or not os.path.exists(file_path):
        ui.display_error("Invalid file path")
        return

    duration = ui.prompt_input("Enter registration duration in years (default: 1):")
    try:
        duration = int(duration) if duration else 1
    except ValueError:
        ui.display_error("Invalid duration")
        return

    with open(file_path, 'r') as file:
        names = file.read().splitlines()

    for name in names:
        result = handle_ens_operation(name, "Bulk registering name", manager.register_name, name, duration)
        if result:
            ui.display_success(f"Successfully registered {name} for {duration} years")
        else:
            ui.display_error(f"Failed to register {name}")

def bulk_renew_names(manager):
    """Bulk renew ENS names from a CSV file."""
    file_path = ui.prompt_input("Enter the path to the CSV file with ENS names:")
    if not file_path or not os.path.exists(file_path):
        ui.display_error("Invalid file path")
        return

    duration = ui.prompt_input("Enter renewal duration in years (default: 1):")
    try:
        duration = int(duration) if duration else 1
    except ValueError:
        ui.display_error("Invalid duration")
        return

    with open(file_path, 'r') as file:
        names = file.read().splitlines()

    for name in names:
        result = handle_ens_operation(name, "Bulk renewing name", manager.renew_name, name, duration)
        if result:
            ui.display_success(f"Successfully renewed {name} for {duration} years")
        else:
            ui.display_error(f"Failed to renew {name}")

def transfer_ens_name(manager):
    """Transfer ownership of an ENS name to another account."""
    name = ui.prompt_input("Enter ENS name to transfer:")
    if not name:
        return

    recipient = ui.prompt_input("Enter recipient Ethereum address:")
    if not recipient:
        return

    confirm = ui.confirm(f"Are you sure you want to transfer {name} to {recipient}?")
    if not confirm:
        ui.display_warning("Transfer cancelled")
        return

    result = handle_ens_operation(name, "Transferring ENS name", manager.transfer_name, name, recipient)
    if result:
        ui.display_success(f"Successfully transferred {name} to {recipient}")
    else:
        ui.display_error(f"Failed to transfer {name}")

@click.command()
def main():
    """ENS Manager - Ethereum Name Service Management Tool."""
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

        # Initial configuration menu
        initial_configuration()

        interactive_menu()
        ui.console.print("\n[accent]Goodbye! 👋[/accent]")
    except KeyboardInterrupt:
        ui.console.print("\n[accent]Goodbye! 👋[/accent]")
    except Exception as e:
        ui.display_error(str(e))

if __name__ == '__main__':
    main() 