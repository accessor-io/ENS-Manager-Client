"""Interactive interface for ENS Manager without Click dependencies."""

from typing import List, Dict, Any, Optional
import os
import asyncio
from rich.console import Console
from rich.table import Table
from rich import box

from .ens_operations import ENSManager
from .config_manager import ConfigManager  
from .ui_manager import UIManager

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

def handle_ens_operation(name: str, operation_name: str, operation_func, *args, timeout: int = 30):
    """Handle ENS operations with proper loading and error handling."""
    import threading
    import time
    
    result_container = {"result": None, "error": None, "completed": False}
    
    def worker():
        try:
            result_container["result"] = operation_func(*args)
            result_container["completed"] = True
        except Exception as e:
            result_container["error"] = e
            result_container["completed"] = True
    
    try:
        with ui.display_loading(f"{operation_name}...") as progress:
            task = progress.add_task("Processing...", total=None)
            
            # Start the operation in a separate thread
            thread = threading.Thread(target=worker)
            thread.daemon = True
            thread.start()
            
            # Wait for completion or timeout
            start_time = time.time()
            while not result_container["completed"] and (time.time() - start_time) < timeout:
                time.sleep(0.1)
                progress.update(task, advance=1)
            
            if not result_container["completed"]:
                ui.display_error(f"Operation timed out after {timeout} seconds")
                ui.display_warning("This might be due to network issues or provider problems")
                return None
            
            if result_container["error"]:
                raise result_container["error"]
            
        return result_container["result"]
    except Exception as e:
        ui.display_error(f"Operation failed: {str(e)}")
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
                config_manager.display_config_status()
            
            ui.pause()
        except Exception as e:
            ui.display_error(f"Account management error: {str(e)}")
            ui.pause()

def interactive_menu():
    """Display interactive menu for ENS operations."""
    actions = [
        "Resolve name",
        "Reverse resolve",
        "Get owner",
        "Get resolver", 
        "Get expiration date",
        "Get text records",
        "View name history",
        "Manage names",
        "Manage networks",
        "Manage providers",
        "Manage accounts",
        "Exit"
    ]
    
    while True:
        try:
            # Clear screen and show a simple title
            ui.console.clear()
            ui.display_simple_title()
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
                
            elif action == "Manage networks":
                manage_networks()
                continue
            
            manager = init_manager()
            if not manager:
                continue
            
            if action == "Resolve name":
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
                        
            elif action == "Get resolver":
                name = ui.prompt_input("Enter ENS name:")
                if name:
                    resolver = handle_ens_operation(name, "Getting resolver", manager.get_resolver, name)
                    if resolver:
                        ui.display_success(f"Resolver for {name}: {resolver}")
                    else:
                        ui.display_error(f"Could not get resolver for {name}")
                        
            elif action == "Get expiration date":
                name = ui.prompt_input("Enter ENS name:")
                if name:
                    # Get expiration date instead of raw TTL
                    expiry_date = handle_ens_operation(name, "Getting expiration date", manager.get_expiry_date, name)
                    if expiry_date:
                        # Format the date nicely
                        formatted_date = expiry_date.strftime("%B %d, %Y at %I:%M %p UTC")
                        ui.display_success(f"Expiration date for {name}: {formatted_date}")
                    else:
                        ui.display_error(f"Could not get expiration date for {name}")
                        
            elif action == "Get text records":
                name = ui.prompt_input("Enter ENS name:")
                if name:
                    # Ask user if they want all records or a specific one
                    record_action = ui.create_menu(
                        "Text Record Options:",
                        ["Show all text records", "Get specific text record", "Cancel"]
                    )
                    
                    if record_action == "Show all text records":
                        text_records = handle_ens_operation(name, "Getting text records", manager.get_all_text_records, name)
                        if text_records:
                            # Display in a nice table format
                            from rich.table import Table
                            table = Table(title=f"Text Records for {name}")
                            table.add_column("Key", style="cyan", width=20)
                            table.add_column("Value", style="green", width=60)
                            
                            for key, value in text_records.items():
                                # Truncate long values for display
                                display_value = value if len(value) <= 60 else f"{value[:57]}..."
                                table.add_row(key, display_value)
                            
                            ui.console.print(table)
                            ui.display_success(f"Found {len(text_records)} text records for {name}")
                        else:
                            ui.display_warning(f"No text records found for {name}")
                    
                    elif record_action == "Get specific text record":
                        key = ui.prompt_input("Enter text record key (e.g., email, url, avatar, com.twitter):")
                        if key:
                            value = handle_ens_operation(name, f"Getting {key} record", manager.get_text_record, name, key)
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
            
            ui.pause()
        except Exception as e:
            ui.display_error(f"Operation failed: {str(e)}")
            ui.pause()

def manage_names():
    """Manage ENS names."""
    actions = [
        "Register new name",
        "Transfer name",
        "Set name resolution",
        "Manage subdomains",
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
                name = ui.prompt_input("Enter name to register (without .eth):")
                if not name:
                    continue
                    
                # Check availability
                available = handle_ens_operation(name, "Checking availability", manager.check_name_available, name, timeout=10)
                if available is None:
                    ui.display_error("Could not check availability - operation failed or timed out")
                    ui.pause()
                    continue
                
                if available is False:
                    ui.display_error(f"{name}.eth is not available")
                    ui.pause()
                    continue
                
                # Get registration cost
                duration = ui.prompt_input("Enter registration duration in years (default: 1):")
                duration = int(duration) if duration.isdigit() else 1
                
                cost = handle_ens_operation(name, "Getting registration cost", manager.get_registration_cost, name, duration, timeout=15)
                if cost is None:
                    ui.display_error("Could not get registration cost - operation failed or timed out")
                    ui.pause()
                    continue

                
                if not ui.confirm(f"Registration will cost {cost} ETH. Proceed?"):
                    continue
                
                # Register the name
                with ui.display_loading("Registering name...") as progress:
                    task = progress.add_task("Processing...", total=None)
                    try:
                        success, message = manager.register_name(name, duration)
                        if success:
                            ui.display_success(message)
                        else:
                            ui.display_error(message)
                    except Exception as e:
                        ui.display_error(f"Registration failed: {e}")
                
            elif action == "Transfer name":
                name = ui.prompt_input("Enter name to transfer:")
                if not name:
                    continue
                    
                to_address = ui.prompt_input("Enter recipient address:")
                if not to_address:
                    continue
                
                if ui.confirm(f"Transfer {name} to {to_address}?"):
                    with ui.display_loading("Transferring name...") as progress:
                        task = progress.add_task("Processing...", total=None)
                        try:
                            success, message = manager.transfer_name(name, to_address)
                            if success:
                                ui.display_success(message)
                            else:
                                ui.display_error(message)
                        except Exception as e:
                            ui.display_error(f"Transfer failed: {e}")
                
            elif action == "Set name resolution":
                name = ui.prompt_input("Enter name to configure:")
                if not name:
                    continue
                    
                address = ui.prompt_input("Enter address to resolve to:")
                if not address:
                    continue
                
                if ui.confirm(f"Set {name} to resolve to {address}?"):
                    with ui.display_loading("Setting resolution...") as progress:
                        task = progress.add_task("Processing...", total=None)
                        try:
                            success, message = manager.set_address(name, address)
                            if success:
                                ui.display_success(message)
                            else:
                                ui.display_error(message)
                        except Exception as e:
                            ui.display_error(f"Setting address failed: {e}")
                
            elif action == "Manage subdomains":
                manage_subdomains(manager)
                
            ui.pause()
            
        except Exception as e:
            ui.display_error(f"Operation failed: {str(e)}")
            ui.pause()

def manage_subdomains(manager: ENSManager):
    """Manage subdomains for ENS names."""
    actions = [
        "Create subdomain",
        "View subdomains",
        "Back to name management"
    ]
    
    while True:
        try:
            action = ui.create_menu("Subdomain Management", actions)
            
            if action == "Back to name management" or not action:
                break
                
            if action == "Create subdomain":
                domain = ui.prompt_input("Enter parent domain:")
                if not domain:
                    continue
                    
                subdomain = ui.prompt_input("Enter subdomain name:")
                if not subdomain:
                    continue
                
                owner = ui.prompt_input("Enter owner address (leave empty for current account):")
                
                if ui.confirm(f"Create subdomain {subdomain}.{domain}?"):
                    with ui.display_loading("Creating subdomain...") as progress:
                        task = progress.add_task("Processing...", total=None)
                        try:
                            success, message = manager.create_subdomain(domain, subdomain, owner if owner else None)
                            if success:
                                ui.display_success(message)
                            else:
                                ui.display_error(message)
                        except Exception as e:
                            ui.display_error(f"Subdomain creation failed: {e}")
                
            elif action == "View subdomains":
                domain = ui.prompt_input("Enter domain name:")
                if domain:
                    with ui.display_loading("Getting subdomains...") as progress:
                        task = progress.add_task("Fetching...", total=None)
                        try:
                            subdomains = manager.get_subdomains(domain)
                            if subdomains:
                                # Create table for subdomains
                                table = Table(title=f"Subdomains for {domain}")
                                table.add_column("Subdomain", style="cyan")
                                
                                for subdomain in subdomains:
                                    table.add_row(subdomain)
                                
                                ui.console.print(table)
                            else:
                                ui.display_warning(f"No subdomains found for {domain}")
                        except Exception as e:
                            ui.display_error(f"Could not get subdomains: {e}")
            
            ui.pause()
            
        except Exception as e:
            ui.display_error(f"Operation failed: {str(e)}")
            ui.pause()

def manage_networks():
    """Manage cross-network ENS resolution."""
    actions = [
        "Resolve name on network",
        "Show all resolutions",
        "List networks",
        "Back to main menu"
    ]
    
    while True:
        try:
            action = ui.create_menu("Network Management", actions)
            
            if action == "Back to main menu" or not action:
                break
                
            manager = init_manager()
            if not manager:
                continue
            
            if action == "List networks":
                try:
                    networks = manager.get_available_networks()
                    table = Table(title="Available Networks")
                    table.add_column("Network", style="cyan")
                    table.add_column("Status", style="green")
                    
                    for network in networks:
                        table.add_row(network, "Available")
                    
                    ui.console.print(table)
                except Exception as e:
                    ui.display_error(f"Could not get networks: {e}")
                    
            elif action == "Resolve name on network":
                name = ui.prompt_input("Enter ENS name:")
                if name:
                    try:
                        networks = manager.get_available_networks()
                        network = ui.create_menu("Select network:", networks + ["Cancel"])
                        
                        if network and network != "Cancel":
                            with ui.display_loading(f"Resolving on {network}...") as progress:
                                task = progress.add_task("Processing...", total=None)
                                address = manager.resolve_name_on_network(name, network)
                                if address:
                                    ui.display_success(f"{name} on {network}: {address}")
                                else:
                                    ui.display_error(f"Could not resolve {name} on {network}")
                    except Exception as e:
                        ui.display_error(f"Network resolution failed: {e}")
                        
            elif action == "Show all resolutions":
                name = ui.prompt_input("Enter ENS name:")
                if name:
                    with ui.display_loading("Resolving globally...") as progress:
                        task = progress.add_task("Processing...", total=None)
                        try:
                            results = asyncio.run(manager.resolve_globally(name))
                            
                            if 'error' in results:
                                ui.display_error(results['error'])
                                continue
                            
                            # Display results
                            table = Table(title=f"Global Resolution Results for {name}")
                            table.add_column("Network", style="cyan")
                            table.add_column("Address", style="green")
                            
                            for network, resolution in results.get('resolutions', {}).items():
                                if 'error' in resolution:
                                    table.add_row(network, "[red]Error[/red]")
                                else:
                                    address = resolution.get('address', 'Not set')
                                    table.add_row(network, address if address else "[red]Not set[/red]")
                            
                            ui.console.print(table)
                        except Exception as e:
                            ui.display_error(f"Global resolution failed: {e}")
            
            ui.pause()
            
        except Exception as e:
            ui.display_error(f"Operation failed: {str(e)}")
            ui.pause()

def main():
    """ENS Manager - Interactive Mode."""
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
