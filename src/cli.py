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
                provider_type = ui.create_menu(
                    "Select provider type:",
                    list(ConfigManager.DEFAULT_PROVIDERS.keys()) + ["Custom"],
                )
                
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
                config_manager.display_config_status()
            
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

def manage_names():
    """Manage ENS names."""
    actions = [
        "Register new name",
        "Transfer name",
        "Set name resolution",
        "Manage subdomains",
        "Batch operations",
        "Monitor names",
        "Advanced info",
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
                
            if action == "Batch operations":
                manage_batch_operations(manager)
            elif action == "Monitor names":
                monitor_names(manager)
            elif action == "Advanced info":
                get_advanced_info(manager)
            else:
                if action == "Register new name":
                    name = ui.prompt_input("Enter name to register (without .eth):")
                    if not name:
                        continue
                        
                    # Check availability
                    with ui.display_loading("Checking availability...") as progress:
                        task = progress.add_task("Checking...", total=None)
                        available = manager.check_name_available(name)
                    
                    if not available:
                        ui.display_error(f"{name}.eth is not available")
                        ui.pause()
                        continue
                    
                    # Get registration cost
                    with ui.display_loading("Getting registration cost...") as progress:
                        task = progress.add_task("Calculating...", total=None)
                        duration = ui.prompt_input("Enter registration duration in years (default: 1):")
                        duration = int(duration) if duration.isdigit() else 1
                        cost = manager.get_registration_cost(name, duration)
                    
                    if cost is None:
                        ui.display_error("Could not get registration cost")
                        ui.pause()
                        continue
                    
                    if not ui.confirm(f"Registration will cost {cost} ETH. Proceed?"):
                        continue
                    
                    # Register the name
                    with ui.display_loading("Registering name...") as progress:
                        task = progress.add_task("Processing...", total=None)
                        success, message = manager.register_name(name, duration)
                    
                    if success:
                        ui.display_success(message)
                    else:
                        ui.display_error(message)
                    
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
                            success, message = manager.transfer_name(name, to_address)
                        
                        if success:
                            ui.display_success(message)
                        else:
                            ui.display_error(message)
                    
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
                            success, message = manager.set_address(name, address)
                        
                        if success:
                            ui.display_success(message)
                        else:
                            ui.display_error(message)
                    
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
                        success, message = manager.create_subdomain(domain, subdomain, owner if owner else None)
                    
                    if success:
                        ui.display_success(message)
                    else:
                        ui.display_error(message)
                
            elif action == "View subdomains":
                domain = ui.prompt_input("Enter domain name:")
                if domain:
                    with ui.display_loading("Getting subdomains...") as progress:
                        task = progress.add_task("Fetching...", total=None)
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
            
            ui.pause()
            
        except Exception as e:
            ui.display_error(f"Operation failed: {str(e)}")
            ui.pause()

def manage_batch_operations(manager: ENSManager):
    """Handle batch operations."""
    actions = [
        "Check multiple names",
        "Get registration costs",
        "Create multiple subdomains",
        "Get reverse records",
        "Back to name management"
    ]
    
    while True:
        try:
            action = ui.create_menu("Batch Operations", actions)
            
            if action == "Back to name management" or not action:
                break
                
            if action == "Check multiple names":
                names_input = ui.prompt_input("Enter names to check (comma-separated):")
                if names_input:
                    names = [n.strip() for n in names_input.split(",")]
                    
                    with ui.display_loading("Checking names...") as progress:
                        task = progress.add_task("Processing...", total=None)
                        results = asyncio.run(manager.batch_check_availability(names))
                    
                    # Display results in table
                    table = Table(title="Name Availability")
                    table.add_column("Name", style="cyan")
                    table.add_column("Status", style="green")
                    
                    for name, available in results.items():
                        status = "[green]Available[/green]" if available else "[red]Taken[/red]"
                        table.add_row(name, status)
                    
                    ui.console.print(table)
                    
            elif action == "Get registration costs":
                names_input = ui.prompt_input("Enter names to check (comma-separated):")
                if names_input:
                    names = [n.strip() for n in names_input.split(",")]
                    duration = ui.prompt_input("Enter registration duration in years (default: 1):")
                    duration = int(duration) if duration.isdigit() else 1
                    
                    with ui.display_loading("Getting costs...") as progress:
                        task = progress.add_task("Processing...", total=None)
                        results = asyncio.run(manager.batch_get_costs(names, duration))
                    
                    # Display results in table
                    table = Table(title="Registration Costs")
                    table.add_column("Name", style="cyan")
                    table.add_column("Cost (ETH)", style="green")
                    
                    for name, cost in results.items():
                        cost_str = f"{cost:.4f}" if cost else "[red]Error[/red]"
                        table.add_row(name, cost_str)
                    
                    ui.console.print(table)
                    
            elif action == "Create multiple subdomains":
                domain = ui.prompt_input("Enter parent domain:")
                if domain:
                    subdomains_input = ui.prompt_input("Enter subdomains to create (comma-separated):")
                    if subdomains_input:
                        subdomains = [s.strip() for s in subdomains_input.split(",")]
                        owner = ui.prompt_input("Enter owner address (leave empty for current account):")
                        
                        with ui.display_loading("Creating subdomains...") as progress:
                            task = progress.add_task("Processing...", total=None)
                            results = manager.bulk_create_subdomains(domain, subdomains, owner if owner else None)
                        
                        # Display results in table
                        table = Table(title=f"Subdomain Creation Results for {domain}")
                        table.add_column("Subdomain", style="cyan")
                        table.add_column("Status", style="green")
                        table.add_column("Message", style="yellow")
                        
                        for subdomain, success, message in results:
                            status = "[green]Success[/green]" if success else "[red]Failed[/red]"
                            table.add_row(subdomain, status, message)
                        
                        ui.console.print(table)
                        
            elif action == "Get reverse records":
                addresses_input = ui.prompt_input("Enter addresses to check (comma-separated):")
                if addresses_input:
                    addresses = [a.strip() for a in addresses_input.split(",")]
                    
                    with ui.display_loading("Getting reverse records...") as progress:
                        task = progress.add_task("Processing...", total=None)
                        results = manager.get_reverse_records(addresses)
                    
                    # Display results in table
                    table = Table(title="Reverse Records")
                    table.add_column("Address", style="cyan")
                    table.add_column("ENS Name", style="green")
                    
                    for address, name in results.items():
                        name_str = name if name else "[red]Not set[/red]"
                        table.add_row(address, name_str)
                    
                    ui.console.print(table)
            
            ui.pause()
            
        except Exception as e:
            ui.display_error(f"Operation failed: {str(e)}")
            ui.pause()

def monitor_names(manager: ENSManager):
    """Monitor ENS names for changes."""
    try:
        names_input = ui.prompt_input("Enter names to monitor (comma-separated):")
        if not names_input:
            return
            
        names = [n.strip() for n in names_input.split(",")]
        
        def handle_event(event_type: str, name: str, event: dict):
            if event_type == "Transfer":
                ui.display_warning(f"Transfer event for {name}: {event['args']['owner']}")
            elif event_type == "NewOwner":
                ui.display_warning(f"New owner for {name}: {event['args']['owner']}")
            elif event_type == "AddrChanged":
                ui.display_warning(f"Address changed for {name}")
        
        ui.console.print("[yellow]Monitoring names for changes. Press Ctrl+C to stop.[/yellow]")
        manager.watch_names(names, handle_event)
        
    except KeyboardInterrupt:
        ui.console.print("\n[yellow]Stopped monitoring.[/yellow]")
    except Exception as e:
        ui.display_error(f"Monitoring failed: {str(e)}")

def get_advanced_info(manager: ENSManager):
    """Get advanced information about ENS names."""
    try:
        name = ui.prompt_input("Enter name to analyze:")
        if not name:
            return
            
        # Validate name first
        valid, normalized, issues = manager.validate_and_normalize_name(name)
        if not valid:
            ui.display_error("Name validation failed:")
            for issue in issues:
                ui.console.print(f"[red]• {issue}[/red]")
            return
            
        with ui.display_loading("Getting detailed information...") as progress:
            task = progress.add_task("Processing...", total=None)
            details = manager.get_name_details(normalized)
        
        # Create detailed report
        layout = Layout()
        layout.split_column(
            Layout(name="header"),
            Layout(name="basic"),
            Layout(name="records"),
            Layout(name="costs"),
            Layout(name="subdomains")
        )
        
        # Header
        layout["header"].update(
            Panel(
                f"[header]Detailed Analysis:[/header] [highlight]{normalized}[/highlight]",
                box=box.ROUNDED
            )
        )
        
        # Basic information
        basic_table = Table(box=box.ROUNDED, show_header=True, header_style="bold cyan")
        basic_table.add_column("Property", style="cyan")
        basic_table.add_column("Value", style="green")
        
        basic_table.add_row("Available", "[green]Yes[/green]" if details['available'] else "[red]No[/red]")
        basic_table.add_row("Owner", details['owner'] if details['owner'] else "[red]Not set[/red]")
        basic_table.add_row("Resolver", details['resolver'] if details['resolver'] else "[red]Not set[/red]")
        basic_table.add_row("Address", details['address'] if details['address'] else "[red]Not set[/red]")
        if details['expiry_date']:
            basic_table.add_row("Expires", details['expiry_date'].isoformat())
        
        layout["basic"].update(basic_table)
        
        # Text records
        if details['text_records']:
            records_table = Table(title="[subheader]Text Records[/subheader]", box=box.ROUNDED)
            records_table.add_column("Key", style="cyan")
            records_table.add_column("Value", style="green")
            
            for key, value in details['text_records'].items():
                records_table.add_row(key, value)
                
            layout["records"].update(records_table)
        
        # Gas costs
        if details['estimated_gas_costs']:
            costs_table = Table(title="[subheader]Estimated Gas Costs (ETH)[/subheader]", box=box.ROUNDED)
            costs_table.add_column("Operation", style="cyan")
            costs_table.add_column("Cost", style="green")
            
            for op, cost in details['estimated_gas_costs'].items():
                costs_table.add_row(op, f"{cost:.6f}")
                
            layout["costs"].update(costs_table)
        
        # Subdomains
        if details['subdomains']:
            subdomains_table = Table(title="[subheader]Subdomains[/subheader]", box=box.ROUNDED)
            subdomains_table.add_column("Name", style="cyan")
            
            for subdomain in details['subdomains']:
                subdomains_table.add_row(subdomain)
                
            layout["subdomains"].update(subdomains_table)
        
        ui.console.print(layout)
        
    except Exception as e:
        ui.display_error(f"Analysis failed: {str(e)}")

def format_activity(activity: Dict[str, Any]) -> str:
    """Format activity data for display."""
    timestamp = datetime.fromisoformat(activity['timestamp'])
    formatted_time = timestamp.strftime('%Y-%m-%d %H:%M:%S')
    
    event_type = activity['type']
    data = activity['data']
    
    # Format transaction data
    tx_hash = data.get('transaction', 'N/A')
    tx_hash = f"{tx_hash[:10]}...{tx_hash[-8:]}" if len(tx_hash) > 20 else tx_hash
    
    return f"[{formatted_time}] {event_type} - TX: {tx_hash}"

def create_activity_table(activities: List[Dict[str, Any]]) -> Table:
    """Create a rich table for activities."""
    table = Table(show_header=True, header_style="bold magenta")
    table.add_column("Timestamp")
    table.add_column("Event Type")
    table.add_column("Transaction")
    table.add_column("Details")
    
    for activity in activities:
        timestamp = datetime.fromisoformat(activity['timestamp'])
        formatted_time = timestamp.strftime('%Y-%m-%d %H:%M:%S')
        
        # Format transaction hash
        tx_hash = activity['data'].get('transaction', 'N/A')
        if len(tx_hash) > 20:
            tx_hash = f"{tx_hash[:10]}...{tx_hash[-8:]}"
        
        # Format details
        details = []
        for k, v in activity['data'].get('args', {}).items():
            if k != 'node':  # Skip node as it's usually not human-readable
                details.append(f"{k}: {v}")
        details_str = "\n".join(details)
        
        table.add_row(
            formatted_time,
            activity['type'],
            tx_hash,
            details_str
        )
    
    return table

@click.group()
def cli():
    """ENS Manager CLI tool."""
    pass

@cli.group()
def activity():
    """Manage ENS name activity tracking."""
    pass

@activity.command()
@click.argument('name')
@click.option('--days', default=7, help='Number of days of history to show')
@click.option('--export-dir', default='ens_activity', help='Directory to export activity data')
@click.option('--format', type=click.Choice(['table', 'json']), default='table', help='Output format')
def show(name: str, days: int, export_dir: str, format: str):
    """Show activity history for an ENS name."""
    try:
        manager = ENSManager()
        
        # Calculate date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            transient=True,
        ) as progress:
            progress.add_task(description="Fetching activity data...", total=None)
            
            # Get activity data
            activity_data = manager.get_name_activity(
                name,
                start_date=start_date,
                end_date=end_date,
                include_transactions=True
            )
        
        if format == 'json':
            # Export to JSON
            output_file = Path(export_dir) / f"{name.replace('.', '_')}_activity.json"
            output_file.parent.mkdir(parents=True, exist_ok=True)
            
            with open(output_file, 'w') as f:
                json.dump(activity_data, f, indent=2, default=str)
            
            console.print(f"Activity data exported to: {output_file}")
            
        else:
            # Display in table format
            if not activity_data['events'] and not activity_data['transactions']:
                console.print("No activity found for this name in the specified period.")
                return
            
            # Create layout
            layout = Layout()
            layout.split_column(
                Layout(name="header"),
                Layout(name="events", ratio=2),
                Layout(name="transactions", ratio=1)
            )
            
            # Header
            header_text = Text()
            header_text.append(f"Activity Report for {name}\n", style="bold blue")
            header_text.append(f"Period: {start_date.date()} to {end_date.date()}\n", style="dim")
            layout["header"].update(Panel(header_text))
            
            # Events table
            if activity_data['events']:
                events_table = create_activity_table(activity_data['events'])
                layout["events"].update(Panel(events_table, title="Events"))
            else:
                layout["events"].update(Panel("No events recorded", title="Events"))
            
            # Transactions table
            if activity_data['transactions']:
                tx_table = Table(show_header=True, header_style="bold magenta")
                tx_table.add_column("Timestamp")
                tx_table.add_column("From")
                tx_table.add_column("To")
                tx_table.add_column("Method")
                tx_table.add_column("Value (ETH)")
                
                for tx in activity_data['transactions']:
                    tx_table.add_row(
                        tx['timestamp'].strftime('%Y-%m-%d %H:%M:%S'),
                        f"{tx['from'][:10]}...",
                        f"{tx['to'][:10]}...",
                        tx['method'],
                        f"{tx['value']:.4f}"
                    )
                layout["transactions"].update(Panel(tx_table, title="Transactions"))
            else:
                layout["transactions"].update(Panel("No transactions found", title="Transactions"))
            
            console.print(layout)
            
    except Exception as e:
        console.print(f"[red]Error: {str(e)}")

@activity.command()
@click.argument('names', nargs=-1)
@click.option('--export-dir', default='ens_activity', help='Directory to export activity data')
def watch(names: List[str], export_dir: str):
    """Watch ENS names for real-time activity."""
    if not names:
        console.print("Please specify at least one name to watch")
        return
        
    try:
        manager = ENSManager()
        
        def activity_callback(event_type: str, name: str, event: dict):
            timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            console.print(f"[{timestamp}] {name}: {event_type}")
            console.print(event)
        
        console.print(f"Watching names: {', '.join(names)}")
        console.print("Press Ctrl+C to stop watching")
        
        manager.watch_names(list(names), activity_callback)
        
    except KeyboardInterrupt:
        console.print("\nStopped watching names")
    except Exception as e:
        console.print(f"[red]Error: {str(e)}")

@activity.command()
@click.argument('name')
@click.option('--start-date', type=click.DateTime(), help='Start date (YYYY-MM-DD)')
@click.option('--end-date', type=click.DateTime(), help='End date (YYYY-MM-DD)')
@click.option('--export-dir', default='ens_activity', help='Directory to export activity data')
def export(name: str, start_date: Optional[datetime], end_date: Optional[datetime], export_dir: str):
    """Export ENS name activity to JSON files."""
    try:
        manager = ENSManager()
        
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            transient=True,
        ) as progress:
            progress.add_task(description="Fetching and exporting activity data...", total=None)
            
            # Get activity data
            activity_data = manager.get_name_activity(
                name,
                start_date=start_date,
                end_date=end_date,
                include_transactions=True
            )
        
        # Create export directory
        export_path = Path(export_dir) / name.replace('.', '_')
        export_path.mkdir(parents=True, exist_ok=True)
        
        # Export main activity file
        main_file = export_path / 'activity.json'
        with open(main_file, 'w') as f:
            json.dump(activity_data, f, indent=2, default=str)
        
        # Export events to separate file
        events_file = export_path / 'events.json'
        with open(events_file, 'w') as f:
            json.dump(activity_data['events'], f, indent=2, default=str)
        
        # Export transactions to separate file
        tx_file = export_path / 'transactions.json'
        with open(tx_file, 'w') as f:
            json.dump(activity_data['transactions'], f, indent=2, default=str)
        
        # Create summary file
        summary = {
            'name': name,
            'period': {
                'start': start_date.isoformat() if start_date else None,
                'end': end_date.isoformat() if end_date else None
            },
            'total_events': len(activity_data['events']),
            'total_transactions': len(activity_data['transactions']),
            'export_date': datetime.now().isoformat()
        }
        
        summary_file = export_path / 'summary.json'
        with open(summary_file, 'w') as f:
            json.dump(summary, f, indent=2, default=str)
        
        console.print(f"Activity data exported to: {export_path}")
        console.print(f"Files created:")
        console.print(f"  - {main_file.name}")
        console.print(f"  - {events_file.name}")
        console.print(f"  - {tx_file.name}")
        console.print(f"  - {summary_file.name}")
        
    except Exception as e:
        console.print(f"[red]Error: {str(e)}")

@activity.command()
@click.argument('name')
@click.option('--days', default=7, help='Number of days of history to analyze')
def analyze(name: str, days: int):
    """Analyze ENS name activity patterns."""
    try:
        manager = ENSManager()
        
        # Calculate date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            transient=True,
        ) as progress:
            progress.add_task(description="Analyzing activity data...", total=None)
            
            # Get activity data
            activity_data = manager.get_name_activity(
                name,
                start_date=start_date,
                end_date=end_date,
                include_transactions=True
            )
        
        # Analyze events
        event_types = {}
        daily_activity = {}
        unique_addresses = set()
        total_value = 0
        
        # Process events
        for event in activity_data['events']:
            # Count event types
            event_type = event['type']
            event_types[event_type] = event_types.get(event_type, 0) + 1
            
            # Track daily activity
            day = datetime.fromisoformat(event['timestamp']).date()
            daily_activity[day] = daily_activity.get(day, 0) + 1
        
        # Process transactions
        for tx in activity_data['transactions']:
            # Track unique addresses
            unique_addresses.add(tx['from'])
            unique_addresses.add(tx['to'])
            
            # Sum transaction values
            total_value += float(tx['value'])
            
            # Track daily activity
            day = tx['timestamp'].date()
            daily_activity[day] = daily_activity.get(day, 0) + 1
        
        # Create analysis report
        layout = Layout()
        layout.split_column(
            Layout(name="header"),
            Layout(name="summary"),
            Layout(name="details")
        )
        
        # Header
        header_text = Text()
        header_text.append(f"Activity Analysis for {name}\n", style="bold blue")
        header_text.append(f"Period: {start_date.date()} to {end_date.date()}\n", style="dim")
        layout["header"].update(Panel(header_text))
        
        # Summary
        summary_table = Table(show_header=False)
        summary_table.add_column("Metric")
        summary_table.add_column("Value")
        
        summary_table.add_row("Total Events", str(len(activity_data['events'])))
        summary_table.add_row("Total Transactions", str(len(activity_data['transactions'])))
        summary_table.add_row("Unique Addresses", str(len(unique_addresses)))
        summary_table.add_row("Total Value (ETH)", f"{total_value:.4f}")
        
        layout["summary"].update(Panel(summary_table, title="Summary"))
        
        # Details
        details_layout = Layout()
        details_layout.split_row(
            Layout(name="events"),
            Layout(name="activity")
        )
        
        # Event types breakdown
        event_table = Table(show_header=True)
        event_table.add_column("Event Type")
        event_table.add_column("Count")
        
        for event_type, count in sorted(event_types.items(), key=lambda x: x[1], reverse=True):
            event_table.add_row(event_type, str(count))
        
        details_layout["events"].update(Panel(event_table, title="Event Types"))
        
        # Daily activity
        activity_table = Table(show_header=True)
        activity_table.add_column("Date")
        activity_table.add_column("Activity Count")
        
        for day, count in sorted(daily_activity.items()):
            activity_table.add_row(day.strftime('%Y-%m-%d'), str(count))
        
        details_layout["activity"].update(Panel(activity_table, title="Daily Activity"))
        
        layout["details"].update(details_layout)
        
        console.print(layout)
        
    except Exception as e:
        console.print(f"[red]Error: {str(e)}")

@cli.group()
def networks():
    """Manage cross-network ENS resolution."""
    pass

@networks.command()
@click.argument('name')
@click.option('--network', default='mainnet', help='Network to resolve on')
def resolve(name: str, network: str):
    """Resolve ENS name on a specific network."""
    try:
        manager = ENSManager()
        
        # Verify network is supported
        available_networks = manager.get_available_networks()
        if network not in available_networks:
            console.print(f"[red]Network {network} not supported. Available networks: {', '.join(available_networks)}")
            return
        
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            transient=True,
        ) as progress:
            progress.add_task(description=f"Resolving {name} on {network}...", total=None)
            address = manager.resolve_name(name, network)
        
        if address:
            console.print(f"[green]{name} resolves to {address} on {network}")
        else:
            console.print(f"[yellow]No resolution found for {name} on {network}")
            
    except Exception as e:
        console.print(f"[red]Error: {str(e)}")

@networks.command()
@click.argument('name')
def show_all(name: str):
    """Show all network resolutions for an ENS name."""
    try:
        manager = ENSManager()
        
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            transient=True,
        ) as progress:
            progress.add_task(description="Getting resolutions...", total=None)
            resolutions = manager.get_all_resolutions(name)
        
        # Create table for display
        table = Table(title=f"Network Resolutions for {name}")
        table.add_column("Network", style="cyan")
        table.add_column("Address", style="green")
        
        for network, address in resolutions.items():
            status = address if address else "[red]Not set[/red]"
            table.add_row(network, status)
        
        console.print(table)
        
    except Exception as e:
        console.print(f"[red]Error: {str(e)}")

@networks.command()
@click.argument('name')
@click.argument('network')
@click.argument('address')
def set_address(name: str, network: str, address: str):
    """Set network-specific resolution for an ENS name."""
    try:
        manager = ENSManager()
        
        # Verify network is supported
        available_networks = manager.get_available_networks()
        if network not in available_networks:
            console.print(f"[red]Network {network} not supported. Available networks: {', '.join(available_networks)}")
            return
        
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            transient=True,
        ) as progress:
            progress.add_task(description=f"Setting {network} address...", total=None)
            success, message = manager.set_network_resolution(name, network, address)
        
        if success:
            console.print(f"[green]{message}")
        else:
            console.print(f"[red]{message}")
            
    except Exception as e:
        console.print(f"[red]Error: {str(e)}")

@networks.command()
@click.argument('name')
def validate(name: str):
    """Validate network setup for an ENS name."""
    try:
        manager = ENSManager()
        
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            transient=True,
        ) as progress:
            progress.add_task(description="Validating setup...", total=None)
            issues = manager.validate_network_setup(name)
        
        if not issues:
            console.print("[green]Network setup is valid!")
        else:
            console.print("[red]Network setup has issues:")
            for issue in issues:
                console.print(f"[red]• {issue}")
            
    except Exception as e:
        console.print(f"[red]Error: {str(e)}")

@networks.command()
def list():
    """List available networks."""
    try:
        manager = ENSManager()
        networks = manager.get_available_networks()
        
        table = Table(title="Available Networks")
        table.add_column("Network", style="cyan")
        table.add_column("Chain ID", style="green")
        table.add_column("Explorer", style="blue")
        
        for network in networks:
            config = NETWORK_CONFIGS[network]
            table.add_row(
                network,
                str(config['chain_id']),
                config['explorer']
            )
        
        console.print(table)
        
    except Exception as e:
        console.print(f"[red]Error: {str(e)}")

@networks.command()
@click.argument('name')
def resolve_global(name: str):
    """Resolve ENS name globally across all networks."""
    try:
        manager = ENSManager()
        
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            transient=True,
        ) as progress:
            progress.add_task(description="Resolving globally...", total=None)
            results = asyncio.run(manager.resolve_globally(name))
        
        if 'error' in results:
            console.print(f"[red]Error: {results['error']}")
            return
        
        # Create layout for display
        layout = Layout()
        layout.split_column(
            Layout(name="header"),
            Layout(name="metadata"),
            Layout(name="resolutions")
        )
        
        # Header
        header_text = Text()
        header_text.append(f"Global Resolution Results for {name}\n", style="bold blue")
        header_text.append(f"Timestamp: {results['metadata']['timestamp']}\n", style="dim")
        layout["header"].update(Panel(header_text))
        
        # Metadata
        metadata_table = Table(show_header=False)
        metadata_table.add_column("Property")
        metadata_table.add_column("Value")
        
        metadata_table.add_row(
            "CCIP-Read Support",
            "[green]Yes[/green]" if results['supports_ccip'] else "[yellow]No[/yellow]"
        )
        metadata_table.add_row("Resolver", results['metadata']['resolver_address'])
        
        layout["metadata"].update(Panel(metadata_table, title="Metadata"))
        
        # Resolutions
        resolutions_table = Table(show_header=True)
        resolutions_table.add_column("Network", style="cyan")
        resolutions_table.add_column("Address", style="green")
        resolutions_table.add_column("Resolution Type", style="yellow")
        resolutions_table.add_column("Source", style="blue")
        
        for network, resolution in results['resolutions'].items():
            if 'error' in resolution:
                resolutions_table.add_row(
                    network,
                    "[red]Error[/red]",
                    "",
                    resolution['error']
                )
            else:
                address = resolution['address'] if resolution['address'] else "[red]Not set[/red]"
                res_type = resolution['resolution_type'] if resolution['resolution_type'] else "-"
                source = resolution['metadata'].get('source', '-')
                
                resolutions_table.add_row(network, address, res_type, source)
        
        layout["resolutions"].update(Panel(resolutions_table, title="Network Resolutions"))
        
        console.print(layout)
        
    except Exception as e:
        console.print(f"[red]Error: {str(e)}")

@networks.command()
@click.argument('name')
@click.option('--network', help='Specific network to verify')
def verify_global(name: str, network: Optional[str] = None):
    """Verify global resolution setup."""
    try:
        manager = ENSManager()
        
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            transient=True,
        ) as progress:
            progress.add_task(description="Verifying resolution setup...", total=None)
            results = asyncio.run(manager.verify_global_resolution(name, network))
        
        if network:
            # Single network verification
            if 'error' in results:
                console.print(f"[red]Error: {results['error']}")
                return
            
            console.print(f"\n[bold]Verification Results for {name} on {network}[/bold]")
            
            for check in results['checks']:
                status_color = {
                    'passed': 'green',
                    'warning': 'yellow',
                    'failed': 'red',
                    'error': 'red'
                }.get(check['status'], 'white')
                
                console.print(
                    f"[{status_color}]• {check['type']}: {check['message']}[/{status_color}]"
                )
        else:
            # Multi-network verification
            layout = Layout()
            layout.split_column(
                Layout(name="header"),
                Layout(name="results")
            )
            
            # Header
            header_text = Text()
            header_text.append(f"Global Resolution Verification for {name}\n", style="bold blue")
            layout["header"].update(Panel(header_text))
            
            # Results
            results_layout = Layout()
            network_layouts = []
            
            for network, network_results in results['networks'].items():
                if 'error' in network_results:
                    network_panel = Panel(
                        f"[red]Error: {network_results['error']}[/red]",
                        title=f"[red]{network}[/red]"
                    )
                else:
                    checks_text = Text()
                    for check in network_results['checks']:
                        status_color = {
                            'passed': 'green',
                            'warning': 'yellow',
                            'failed': 'red',
                            'error': 'red'
                        }.get(check['status'], 'white')
                        
                        checks_text.append(
                            f"• {check['type']}: {check['message']}\n",
                            style=status_color
                        )
                    
                    network_panel = Panel(
                        checks_text,
                        title=f"[bold]{network}[/bold]"
                    )
                
                network_layouts.append(Layout(name=network))
                network_layouts[-1].update(network_panel)
            
            results_layout.split_column(*network_layouts)
            layout["results"].update(results_layout)
            
            console.print(layout)
        
    except Exception as e:
        console.print(f"[red]Error: {str(e)}")

def manage_networks():
    """Manage cross-network ENS resolution."""
    actions = [
        "Resolve name on network",
        "Show all resolutions",
        "Set network address",
        "Global resolution",
        "Verify resolution",
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
            
            if action == "Global resolution":
                name = ui.prompt_input("Enter name to resolve:")
                if name:
                    with ui.display_loading("Resolving globally...") as progress:
                        task = progress.add_task("Processing...", total=None)
                        results = asyncio.run(manager.resolve_globally(name))
                    
                    if 'error' in results:
                        ui.display_error(results['error'])
                        continue
                    
                    # Display results
                    table = Table(title=f"Global Resolution Results for {name}")
                    table.add_column("Network", style="cyan")
                    table.add_column("Address", style="green")
                    table.add_column("Resolution Type", style="yellow")
                    table.add_column("Source", style="blue")
                    
                    for network, resolution in results['resolutions'].items():
                        if 'error' in resolution:
                            table.add_row(
                                network,
                                "[red]Error[/red]",
                                "",
                                resolution['error']
                            )
                        else:
                            address = resolution['address'] if resolution['address'] else "[red]Not set[/red]"
                            res_type = resolution['resolution_type'] if resolution['resolution_type'] else "-"
                            source = resolution['metadata'].get('source', '-')
                            
                            table.add_row(network, address, res_type, source)
                    
                    ui.console.print(table)
            
            elif action == "Verify resolution":
                name = ui.prompt_input("Enter name to verify:")
                if name:
                    networks = ["All networks"] + manager.get_available_networks()
                    network = ui.create_menu("Select network", networks)
                    
                    if network:
                        with ui.display_loading("Verifying resolution...") as progress:
                            task = progress.add_task("Processing...", total=None)
                            results = asyncio.run(manager.verify_global_resolution(
                                name,
                                None if network == "All networks" else network
                            ))
                        
                        if network != "All networks":
                            if 'error' in results:
                                ui.display_error(results['error'])
                                continue
                            
                            # Display single network results
                            for check in results['checks']:
                                status_color = {
                                    'passed': 'green',
                                    'warning': 'yellow',
                                    'failed': 'red',
                                    'error': 'red'
                                }.get(check['status'], 'white')
                                
                                ui.console.print(
                                    f"[{status_color}]• {check['type']}: {check['message']}[/{status_color}]"
                                )
                        else:
                            # Display multi-network results
                            for net, net_results in results['networks'].items():
                                ui.console.print(f"\n[bold]{net}[/bold]")
                                if 'error' in net_results:
                                    ui.display_error(net_results['error'])
                                else:
                                    for check in net_results['checks']:
                                        status_color = {
                                            'passed': 'green',
                                            'warning': 'yellow',
                                            'failed': 'red',
                                            'error': 'red'
                                        }.get(check['status'], 'white')
                                        
                                        ui.console.print(
                                            f"[{status_color}]• {check['type']}: {check['message']}[/{status_color}]"
                                        )
            
            # ... rest of existing network management code ...
            
            ui.pause()
            
        except Exception as e:
            ui.display_error(f"Operation failed: {str(e)}")
            ui.pause()

def interactive_menu():
    """Display interactive menu for ENS operations."""
    actions = [
        "Resolve name",
        "Reverse resolve",
        "Get owner",
        "Get resolver",
        "Get TTL",
        "Get text record",
        "View name history",
        "Manage names",
        "Manage networks",
        "Manage providers",
        "Manage accounts",
        "Exit"
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
            
            if action == "Look up ENS information":
                name = ui.prompt_input("Enter ENS name:")
                if name:
                    info = {
                        "name": name,
                        "Address": handle_ens_operation(name, "Resolving address", manager.resolve_name, name),
                        "Owner": handle_ens_operation(name, "Getting owner", manager.get_owner, name),
                        "Resolver": handle_ens_operation(name, "Getting resolver", manager.get_resolver, name),
                        "TTL": handle_ens_operation(name, "Getting TTL", manager.get_ttl, name),
                        "Content Hash": handle_ens_operation(name, "Getting content hash", manager.get_content_hash, name)
                    }
                    
                    # Add text records
                    text_keys = ['email', 'url', 'avatar', 'description', 'notice', 'keywords', 'com.twitter', 'com.github']
                    for key in text_keys:
                        value = handle_ens_operation(name, f"Getting {key} record", manager.get_text_record, name, key)
                        if value:
                            info[f"Text: {key}"] = value
                            
                    ui.display_ens_info(info)
                    
            elif action == "Resolve ENS name":
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
            
            ui.pause()
        except Exception as e:
            ui.display_error(f"Operation failed: {str(e)}")
            ui.pause()

def main():
    """Main entry point for the CLI."""
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