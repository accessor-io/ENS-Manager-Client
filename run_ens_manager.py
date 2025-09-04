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
            "Look up ENS information",
            "Resolve ENS name",
            "Reverse resolve address",
            "Get owner",
            "Get resolver",
            "Get TTL",
            "Get text record",
            "Get all text records",
            "Get content hash",
            "View name history",
            "Advanced name analysis",
            "Manage names",
            "Manage networks",
            "Activity tracking",
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

        elif action == "Manage names":
            manage_names_simple(ui, config)

        elif action == "Manage networks":
            manage_networks_simple(ui, config)

        elif action == "Activity tracking":
            manage_activity_simple(ui, config)
            
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
            
            if action == "Look up ENS information":
                name = ui.prompt_input("Enter ENS name:")
                if name:
                    try:
                        # Get comprehensive information
                        info = {
                            "name": name,
                            "Address": manager.resolve_name(name),
                            "Owner": manager.get_owner(name),
                            "Resolver": manager.get_resolver(name),
                            "TTL": manager.get_ttl(name),
                            "Content Hash": manager.get_content_hash(name)
                        }
                        
                        # Add additional information
                        try:
                            # Check if name is available for registration
                            available = manager.check_name_available(name)
                            info["Available"] = "Yes" if available else "No"
                            
                            # Get registration cost if available
                            if available:
                                cost = manager.get_registration_cost(name, 1)  # 1 year
                                if cost is not None:
                                    info["Registration Cost (1yr)"] = f"{cost:.4f} ETH"
                            
                            # Get subdomains count
                            try:
                                subdomains = manager.get_subdomains(name)
                                info["Subdomains"] = f"{len(subdomains)} found" if subdomains else "None"
                            except:
                                info["Subdomains"] = "Unknown"
                                
                        except Exception as additional_error:
                            # Don't fail if additional info fails
                            print(f"Note: Could not fetch additional information: {additional_error}")
                        
                        # Add text records
                        text_records = manager.get_all_text_records(name)
                        for key, value in text_records.items():
                            info[f"Text: {key}"] = value
                        
                        # Get recent transactions for the footer
                        try:
                            from datetime import datetime, timedelta
                            end_date = datetime.now()
                            start_date = end_date - timedelta(days=7)  # Last 7 days
                            
                            activity_data = manager.get_name_activity(
                                name,
                                start_date=start_date,
                                end_date=end_date,
                                include_transactions=True
                            )
                            
                            if activity_data.get('transactions'):
                                info['recent_transactions'] = activity_data['transactions'][-5:]  # Last 5 transactions
                        except Exception as tx_error:
                            # Don't fail the main lookup if transaction history fails
                            print(f"Note: Could not fetch recent transactions: {tx_error}")
                            
                        ui.display_ens_info(info)
                    except Exception as e:
                        ui.display_error(f"Error getting ENS information: {str(e)}")
                        
            elif action == "Resolve ENS name":
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
                        
            elif action == "Get resolver":
                name = ui.prompt_input("Enter ENS name:")
                if name:
                    try:
                        resolver = manager.get_resolver(name)
                        if resolver:
                            ui.display_success(f"Resolver for {name}: {resolver}")
                        else:
                            ui.display_error(f"Could not get resolver for {name}")
                    except Exception as e:
                        ui.display_error(f"Error getting resolver: {str(e)}")
                        
            elif action == "Get TTL":
                name = ui.prompt_input("Enter ENS name:")
                if name:
                    try:
                        ttl = manager.get_ttl(name)
                        if ttl is not None:
                            ui.display_success(f"TTL for {name}: {ttl} seconds")
                        else:
                            ui.display_error(f"Could not get TTL for {name}")
                    except Exception as e:
                        ui.display_error(f"Error getting TTL: {str(e)}")
                        
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
                            
            elif action == "Get all text records":
                name = ui.prompt_input("Enter ENS name:")
                if name:
                    try:
                        records = manager.get_all_text_records(name)
                        if records:
                            ui.display_info(f"Text records for {name}:")
                            for key, value in records.items():
                                ui.display_info(f"  {key}: {value}")
                        else:
                            ui.display_warning(f"No text records found for {name}")
                    except Exception as e:
                        ui.display_error(f"Error getting text records: {str(e)}")
                        
            elif action == "Get content hash":
                name = ui.prompt_input("Enter ENS name:")
                if name:
                    try:
                        content_hash = manager.get_content_hash(name)
                        if content_hash:
                            ui.display_success(f"Content hash for {name}: {content_hash}")
                        else:
                            ui.display_error(f"Could not get content hash for {name}")
                    except Exception as e:
                        ui.display_error(f"Error getting content hash: {str(e)}")
                        
            elif action == "View name history":
                name = ui.prompt_input("Enter ENS name:")
                if name:
                    try:
                        history = manager.get_name_history(name)
                        if history:
                            ui.display_history(history, name)
                        else:
                            ui.display_error(f"No history found for {name}")
                    except Exception as e:
                        ui.display_error(f"Error getting history: {str(e)}")
                        
            elif action == "Advanced name analysis":
                name = ui.prompt_input("Enter ENS name:")
                if name:
                    try:
                        # Validate name first
                        valid, normalized, issues = manager.validate_and_normalize_name(name)
                        if not valid:
                            ui.display_error("Name validation failed:")
                            for issue in issues:
                                ui.display_error(f"  • {issue}")
                        else:
                            details = manager.get_name_details(normalized)
                            
                            # Display comprehensive analysis
                            ui.display_info(f"Detailed Analysis for {normalized}:")
                            ui.display_info(f"  Available: {'Yes' if details['available'] else 'No'}")
                            ui.display_info(f"  Owner: {details['owner'] if details['owner'] else 'Not set'}")
                            ui.display_info(f"  Resolver: {details['resolver'] if details['resolver'] else 'Not set'}")
                            ui.display_info(f"  Address: {details['address'] if details['address'] else 'Not set'}")
                            
                            if details['expiry_date']:
                                ui.display_info(f"  Expires: {details['expiry_date'].isoformat()}")
                            
                            if details['text_records']:
                                ui.display_info("  Text Records:")
                                for key, value in details['text_records'].items():
                                    ui.display_info(f"    {key}: {value}")
                            
                            if details['estimated_gas_costs']:
                                ui.display_info("  Estimated Gas Costs (ETH):")
                                for op, cost in details['estimated_gas_costs'].items():
                                    ui.display_info(f"    {op}: {cost:.6f}")
                            
                            if details['subdomains']:
                                ui.display_info("  Subdomains:")
                                for subdomain in details['subdomains']:
                                    ui.display_info(f"    {subdomain}")
                                    
                    except Exception as e:
                        ui.display_error(f"Error analyzing name: {str(e)}")
        
        ui.pause()
    
    ui.console.print("\n[accent]Goodbye![/accent]")

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

def manage_names_simple(ui, config):
    """Simple name management without Click."""
    while True:
        actions = [
            "Register new name",
            "Transfer name",
            "Set name resolution",
            "Manage subdomains",
            "Batch operations",
            "Check name availability",
            "Get registration cost",
            "Back to main menu"
        ]
        
        action = ui.create_menu("Name Management", actions)
        
        if action == "Back to main menu" or not action:
            break
            
        # Get provider and initialize manager
        provider_url = config.get_provider()
        if not provider_url:
            ui.display_error("No active provider configured. Please add a provider first.")
            ui.pause()
            continue
            
        try:
            manager = ENSManager(provider_url=provider_url)
        except Exception as e:
            ui.display_error(f"Failed to initialize ENS Manager: {str(e)}")
            ui.pause()
            continue
            
        if action == "Register new name":
            name = ui.prompt_input("Enter name to register (without .eth):")
            if name:
                try:
                    # Normalize name (remove .eth if present)
                    normalized_name = name.lower().replace('.eth', '').strip()
                    
                    # Check availability first
                    available = manager.check_name_available(name)
                    if not available:
                        ui.display_error(f"{normalized_name}.eth is not available")
                        ui.pause()
                        continue
                    
                    # Get registration cost
                    duration = ui.prompt_input("Enter registration duration in years (default: 1):")
                    duration = int(duration) if duration.isdigit() else 1
                    cost = manager.get_registration_cost(name, duration)
                    
                    if cost is None:
                        ui.display_error("Could not get registration cost")
                        ui.pause()
                        continue
                    
                    if ui.confirm(f"Registration will cost {cost} ETH. Proceed?"):
                        success, message = manager.register_name(name, duration)
                        if success:
                            ui.display_success(message)
                        else:
                            ui.display_error(message)
                except Exception as e:
                    ui.display_error(f"Error registering name: {str(e)}")
                    
        elif action == "Transfer name":
            name = ui.prompt_input("Enter name to transfer:")
            if name:
                to_address = ui.prompt_input("Enter recipient address:")
                if to_address and ui.confirm(f"Transfer {name} to {to_address}?"):
                    try:
                        success, message = manager.transfer_name(name, to_address)
                        if success:
                            ui.display_success(message)
                        else:
                            ui.display_error(message)
                    except Exception as e:
                        ui.display_error(f"Error transferring name: {str(e)}")
                        
        elif action == "Set name resolution":
            name = ui.prompt_input("Enter name to configure:")
            if name:
                address = ui.prompt_input("Enter address to resolve to:")
                if address and ui.confirm(f"Set {name} to resolve to {address}?"):
                    try:
                        success, message = manager.set_address(name, address)
                        if success:
                            ui.display_success(message)
                        else:
                            ui.display_error(message)
                    except Exception as e:
                        ui.display_error(f"Error setting resolution: {str(e)}")
                        
        elif action == "Manage subdomains":
            manage_subdomains_simple(ui, config, manager)
            
        elif action == "Batch operations":
            manage_batch_operations_simple(ui, config, manager)
            
        elif action == "Check name availability":
            name = ui.prompt_input("Enter name to check (without .eth):")
            if name:
                try:
                    # Normalize name (remove .eth if present)
                    normalized_name = name.lower().replace('.eth', '').strip()
                    
                    available = manager.check_name_available(name)
                    if available:
                        ui.display_success(f"{normalized_name}.eth is available!")
                    else:
                        ui.display_error(f"{normalized_name}.eth is not available")
                except Exception as e:
                    ui.display_error(f"Error checking availability: {str(e)}")
                    
        elif action == "Get registration cost":
            name = ui.prompt_input("Enter name to check cost (without .eth):")
            if name:
                duration = ui.prompt_input("Enter registration duration in years (default: 1):")
                duration = int(duration) if duration.isdigit() else 1
                try:
                    # Normalize name (remove .eth if present)
                    normalized_name = name.lower().replace('.eth', '').strip()
                    
                    cost = manager.get_registration_cost(name, duration)
                    if cost is not None:
                        ui.display_success(f"Registration cost for {normalized_name}.eth ({duration} year{'s' if duration != 1 else ''}): {cost} ETH")
                    else:
                        ui.display_error("Could not get registration cost")
                except Exception as e:
                    ui.display_error(f"Error getting cost: {str(e)}")
        
        ui.pause()

def manage_subdomains_simple(ui, config, manager):
    """Simple subdomain management."""
    while True:
        actions = [
            "Create subdomain",
            "View subdomains",
            "Back to name management"
        ]
        
        action = ui.create_menu("Subdomain Management", actions)
        
        if action == "Back to name management" or not action:
            break
            
        if action == "Create subdomain":
            domain = ui.prompt_input("Enter parent domain:")
            if domain:
                subdomain = ui.prompt_input("Enter subdomain name:")
                if subdomain:
                    owner = ui.prompt_input("Enter owner address (leave empty for current account):")
                    if ui.confirm(f"Create subdomain {subdomain}.{domain}?"):
                        try:
                            success, message = manager.create_subdomain(domain, subdomain, owner if owner else None)
                            if success:
                                ui.display_success(message)
                            else:
                                ui.display_error(message)
                        except Exception as e:
                            ui.display_error(f"Error creating subdomain: {str(e)}")
                            
        elif action == "View subdomains":
            domain = ui.prompt_input("Enter domain name:")
            if domain:
                try:
                    subdomains = manager.get_subdomains(domain)
                    if subdomains:
                        ui.display_info(f"Subdomains for {domain}:")
                        for subdomain in subdomains:
                            ui.display_info(f"  {subdomain}")
                    else:
                        ui.display_warning(f"No subdomains found for {domain}")
                except Exception as e:
                    ui.display_error(f"Error getting subdomains: {str(e)}")
        
        ui.pause()

def manage_batch_operations_simple(ui, config, manager):
    """Simple batch operations management."""
    while True:
        actions = [
            "Check multiple names",
            "Get registration costs",
            "Get reverse records",
            "Back to name management"
        ]
        
        action = ui.create_menu("Batch Operations", actions)
        
        if action == "Back to name management" or not action:
            break
            
        if action == "Check multiple names":
            names_input = ui.prompt_input("Enter names to check (comma-separated, without .eth):")
            if names_input:
                names = [n.strip() for n in names_input.split(",")]
                try:
                    import asyncio
                    results = asyncio.run(manager.batch_check_availability(names))
                    ui.display_info("Name Availability Results:")
                    for name, available in results.items():
                        # Normalize name for display
                        normalized_name = name.lower().replace('.eth', '').strip()
                        status = "Available" if available else "Taken"
                        ui.display_info(f"  {normalized_name}.eth: {status}")
                except Exception as e:
                    ui.display_error(f"Error checking names: {str(e)}")
                    
        elif action == "Get registration costs":
            names_input = ui.prompt_input("Enter names to check (comma-separated, without .eth):")
            if names_input:
                names = [n.strip() for n in names_input.split(",")]
                duration = ui.prompt_input("Enter registration duration in years (default: 1):")
                duration = int(duration) if duration.isdigit() else 1
                try:
                    import asyncio
                    results = asyncio.run(manager.batch_get_costs(names, duration))
                    ui.display_info("Registration Cost Results:")
                    for name, cost in results.items():
                        # Normalize name for display
                        normalized_name = name.lower().replace('.eth', '').strip()
                        cost_str = f"{cost:.4f} ETH" if cost else "Error"
                        ui.display_info(f"  {normalized_name}.eth: {cost_str}")
                except Exception as e:
                    ui.display_error(f"Error getting costs: {str(e)}")
                    
        elif action == "Get reverse records":
            addresses_input = ui.prompt_input("Enter addresses to check (comma-separated):")
            if addresses_input:
                addresses = [a.strip() for a in addresses_input.split(",")]
                try:
                    results = manager.get_reverse_records(addresses)
                    ui.display_info("Reverse Record Results:")
                    for address, name in results.items():
                        name_str = name if name else "Not set"
                        ui.display_info(f"  {address}: {name_str}")
                except Exception as e:
                    ui.display_error(f"Error getting reverse records: {str(e)}")
        
        ui.pause()

def manage_networks_simple(ui, config):
    """Simple network management."""
    while True:
        actions = [
            "Resolve name on network",
            "Show all resolutions",
            "Set network address",
            "List networks",
            "Back to main menu"
        ]
        
        action = ui.create_menu("Network Management", actions)
        
        if action == "Back to main menu" or not action:
            break
            
        # Get provider and initialize manager
        provider_url = config.get_provider()
        if not provider_url:
            ui.display_error("No active provider configured. Please add a provider first.")
            ui.pause()
            continue
            
        try:
            manager = ENSManager(provider_url=provider_url)
        except Exception as e:
            ui.display_error(f"Failed to initialize ENS Manager: {str(e)}")
            ui.pause()
            continue
            
        if action == "Resolve name on network":
            name = ui.prompt_input("Enter ENS name:")
            if name:
                networks = ["mainnet"] + manager.get_available_networks()
                network = ui.create_menu("Select network:", networks + ["Cancel"])
                if network and network != "Cancel":
                    try:
                        address = manager.resolve_name(name, network)
                        if address:
                            ui.display_success(f"{name} on {network}: {address}")
                        else:
                            ui.display_error(f"Could not resolve {name} on {network}")
                    except Exception as e:
                        ui.display_error(f"Error resolving on {network}: {str(e)}")
                        
        elif action == "Show all resolutions":
            name = ui.prompt_input("Enter ENS name:")
            if name:
                try:
                    resolutions = manager.get_all_resolutions(name)
                    ui.display_info(f"All resolutions for {name}:")
                    for network, address in resolutions.items():
                        addr_str = address if address else "Not set"
                        ui.display_info(f"  {network}: {addr_str}")
                except Exception as e:
                    ui.display_error(f"Error getting resolutions: {str(e)}")
                    
        elif action == "Set network address":
            name = ui.prompt_input("Enter ENS name:")
            if name:
                networks = manager.get_available_networks()
                if networks:
                    network = ui.create_menu("Select network:", networks + ["Cancel"])
                    if network and network != "Cancel":
                        address = ui.prompt_input("Enter address:")
                        if address and ui.confirm(f"Set {name} on {network} to {address}?"):
                            try:
                                success, message = manager.set_network_resolution(name, network, address)
                                if success:
                                    ui.display_success(message)
                                else:
                                    ui.display_error(message)
                            except Exception as e:
                                ui.display_error(f"Error setting address: {str(e)}")
                else:
                    ui.display_warning("No additional networks available")
                    
        elif action == "List networks":
            try:
                networks = manager.get_available_networks()
                if networks:
                    ui.display_info("Available networks:")
                    for network in networks:
                        ui.display_info(f"  {network}")
                else:
                    ui.display_warning("No additional networks available")
            except Exception as e:
                ui.display_error(f"Error listing networks: {str(e)}")
        
        ui.pause()

def manage_activity_simple(ui, config):
    """Simple activity tracking management."""
    while True:
        actions = [
            "Show name activity",
            "Export activity data",
            "Analyze name activity",
            "Back to main menu"
        ]
        
        action = ui.create_menu("Activity Tracking", actions)
        
        if action == "Back to main menu" or not action:
            break
            
        # Get provider and initialize manager
        provider_url = config.get_provider()
        if not provider_url:
            ui.display_error("No active provider configured. Please add a provider first.")
            ui.pause()
            continue
            
        try:
            manager = ENSManager(provider_url=provider_url)
        except Exception as e:
            ui.display_error(f"Failed to initialize ENS Manager: {str(e)}")
            ui.pause()
            continue
            
        if action == "Show name activity":
            name = ui.prompt_input("Enter ENS name:")
            if name:
                days = ui.prompt_input("Enter number of days to show (default: 7):")
                days = int(days) if days.isdigit() else 7
                try:
                    from datetime import datetime, timedelta
                    end_date = datetime.now()
                    start_date = end_date - timedelta(days=days)
                    
                    activity_data = manager.get_name_activity(
                        name,
                        start_date=start_date,
                        end_date=end_date,
                        include_transactions=True
                    )
                    
                    if activity_data['events'] or activity_data['transactions']:
                        ui.display_info(f"Activity for {name} (last {days} days):")
                        
                        if activity_data['events']:
                            ui.display_info("  Events:")
                            for event in activity_data['events'][-10:]:  # Show last 10
                                ui.display_info(f"    {event['type']}: {event.get('timestamp', 'Unknown time')}")
                        
                        if activity_data['transactions']:
                            ui.display_info("  Transactions:")
                            for tx in activity_data['transactions'][-10:]:  # Show last 10
                                ui.display_info(f"    {tx['hash'][:10]}...{tx['hash'][-8:]}: {tx.get('timestamp', 'Unknown time')}")
                    else:
                        ui.display_warning(f"No activity found for {name} in the last {days} days")
                        
                except Exception as e:
                    ui.display_error(f"Error getting activity: {str(e)}")
                    
        elif action == "Export activity data":
            name = ui.prompt_input("Enter ENS name:")
            if name:
                try:
                    import json
                    from datetime import datetime, timedelta
                    from pathlib import Path
                    
                    end_date = datetime.now()
                    start_date = end_date - timedelta(days=30)  # Export last 30 days
                    
                    activity_data = manager.get_name_activity(
                        name,
                        start_date=start_date,
                        end_date=end_date,
                        include_transactions=True
                    )
                    
                    # Create export directory
                    export_dir = Path("ens_activity")
                    export_dir.mkdir(exist_ok=True)
                    
                    # Export to JSON
                    output_file = export_dir / f"{name.replace('.', '_')}_activity.json"
                    with open(output_file, 'w') as f:
                        json.dump(activity_data, f, indent=2, default=str)
                    
                    ui.display_success(f"Activity data exported to: {output_file}")
                    
                except Exception as e:
                    ui.display_error(f"Error exporting activity: {str(e)}")
                    
        elif action == "Analyze name activity":
            name = ui.prompt_input("Enter ENS name:")
            if name:
                days = ui.prompt_input("Enter number of days to analyze (default: 30):")
                days = int(days) if days.isdigit() else 30
                try:
                    from datetime import datetime, timedelta
                    end_date = datetime.now()
                    start_date = end_date - timedelta(days=days)
                    
                    activity_data = manager.get_name_activity(
                        name,
                        start_date=start_date,
                        end_date=end_date,
                        include_transactions=True
                    )
                    
                    # Basic analysis
                    event_count = len(activity_data.get('events', []))
                    tx_count = len(activity_data.get('transactions', []))
                    
                    ui.display_info(f"Activity Analysis for {name} (last {days} days):")
                    ui.display_info(f"  Total Events: {event_count}")
                    ui.display_info(f"  Total Transactions: {tx_count}")
                    
                    if activity_data.get('events'):
                        event_types = {}
                        for event in activity_data['events']:
                            event_type = event.get('type', 'Unknown')
                            event_types[event_type] = event_types.get(event_type, 0) + 1
                        
                        ui.display_info("  Event Types:")
                        for event_type, count in event_types.items():
                            ui.display_info(f"    {event_type}: {count}")
                    
                except Exception as e:
                    ui.display_error(f"Error analyzing activity: {str(e)}")
        
        ui.pause()

def main():
    """Main entry point."""
    try:
        simple_interactive_menu()
    except KeyboardInterrupt:
        print("\nGoodbye!")
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == '__main__':
    main() 