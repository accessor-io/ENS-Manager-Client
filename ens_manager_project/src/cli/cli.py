"""Command line interface for ENS Manager."""

import click
import asyncio
from typing import Optional, List, Dict, Any, Callable
from decimal import Decimal
from pathlib import Path
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from datetime import datetime

from ..core.network_manager import NetworkManager
from ..core.ens_operations import ENSOperations
from ..core.account_manager import AccountManager
from ..utils.ui_manager import UIManager

console = Console()

class Menu:
    """Menu class for handling menu options and navigation."""
    
    def __init__(self, title: str, parent: Optional['Menu'] = None):
        """Initialize menu."""
        self.title = title
        self.parent = parent
        self.options: List[Dict[str, Any]] = []
        
    def add_option(self, title: str, handler: Optional[Callable] = None, submenu: Optional['Menu'] = None):
        """Add menu option."""
        self.options.append({
            'title': title,
            'handler': handler,
            'submenu': submenu
        })
        
    async def display(self) -> Optional['Menu']:
        """Display menu and handle selection."""
        while True:
            console.clear()
            console.print(Panel(f"[bold cyan]{self.title}[/bold cyan]"))
            
            # Display options
            for i, option in enumerate(self.options, 1):
                console.print(f"{i}. {option['title']}")
                
            # Add back/exit option
            if self.parent:
                console.print("[bold red]0. Back[/bold red]")
            else:
                console.print("[bold red]0. Exit[/bold red]")
                
            try:
                choice = click.prompt("\nSelect an option", type=int)
                
                if choice == 0:
                    return self.parent
                
                if 1 <= choice <= len(self.options):
                    option = self.options[choice - 1]
                    
                    if option['submenu']:
                        return option['submenu']
                    elif option['handler']:
                        await option['handler']()
        else:
                    console.print("[red]Invalid option. Please try again.[/red]")
                    click.pause()
            except click.Abort:
                return self.parent
            except Exception as e:
                console.print(f"[red]Error: {e}[/red]")
                click.pause()

class ENSManagerCLI:
    """CLI for ENS Manager."""
    
    def __init__(self):
        """Initialize CLI."""
        self.network_manager = NetworkManager()
        self.account_manager = AccountManager()
        self.ens_ops = None
        self.ui = UIManager()
        self.setup_menus()
        
    def init_ens_ops(self):
        """Initialize ENS operations."""
        if not self.ens_ops:
            self.ens_ops = ENSOperations(self.network_manager)
            
    def setup_menus(self):
        """Set up menu structure."""
        # Main menu
        self.main_menu = Menu("ENS Manager")
        
        # Account management menu
        account_menu = Menu("Account Management", self.main_menu)
        account_menu.add_option("Create new account", self.create_account)
        account_menu.add_option("Load existing account", self.load_account)
        account_menu.add_option("List accounts", self.list_accounts)
        account_menu.add_option("Export private key", self.export_private_key)
        account_menu.add_option("Rename account", self.rename_account)
        account_menu.add_option("Show current account", self.show_current_account)
        account_menu.add_option("Import account from private key", self.import_account)
        self.main_menu.add_option("Account Management", submenu=account_menu)
        
        # Network management menu
        network_menu = Menu("Network Management", self.main_menu)
        network_menu.add_option("Configure provider", self.configure_provider)
        network_menu.add_option("List providers", self.list_providers)
        network_menu.add_option("Remove provider", self.remove_provider)
        network_menu.add_option("Set default provider", self.set_default_provider)
        network_menu.add_option("Show network status", self.show_network_status)
        self.main_menu.add_option("Network Management", submenu=network_menu)
        
        # Name resolution menu
        resolution_menu = Menu("Name Resolution", self.main_menu)
        resolution_menu.add_option("Resolve ENS name", self.resolve_name)
        resolution_menu.add_option("Reverse lookup", self.reverse_lookup)
        resolution_menu.add_option("Get name owner", self.get_owner)
        resolution_menu.add_option("Get resolver address", self.get_resolver)
        resolution_menu.add_option("Get content hash", self.get_content_hash)
        resolution_menu.add_option("Get text record", self.get_text_record)
        self.main_menu.add_option("Name Resolution", submenu=resolution_menu)
        
        # Registration menu
        registration_menu = Menu("Name Registration", self.main_menu)
        registration_menu.add_option("Check name availability", self.check_name_availability)
        registration_menu.add_option("Check registration cost", self.check_registration_cost)
        registration_menu.add_option("Register name", self.register_name)
        registration_menu.add_option("Renew name", self.renew_name)
        registration_menu.add_option("Transfer name", self.transfer_name)
        self.main_menu.add_option("Name Registration", submenu=registration_menu)
        
        # Record management menu
        records_menu = Menu("Record Management", self.main_menu)
        records_menu.add_option("Set address record", self.set_address)
        records_menu.add_option("Set content hash", self.set_content_hash)
        records_menu.add_option("Set text record", self.set_text_record)
        records_menu.add_option("Set resolver", self.set_resolver)
        records_menu.add_option("Clear record", self.clear_record)
        self.main_menu.add_option("Record Management", submenu=records_menu)
        
        # Settings menu
        settings_menu = Menu("Settings", self.main_menu)
        settings_menu.add_option("Configure gas settings", self.configure_gas)
        settings_menu.add_option("Set logging level", self.set_logging_level)
        settings_menu.add_option("Backup configuration", self.backup_config)
        settings_menu.add_option("Restore configuration", self.restore_config)
        self.main_menu.add_option("Settings", submenu=settings_menu)
            
    async def run(self):
        """Run the CLI."""
        current_menu = self.main_menu
        while current_menu:
            current_menu = await current_menu.display()

    # New methods for expanded functionality
    
    async def import_account(self):
        """Import account from private key."""
        try:
            private_key = click.prompt("Enter private key (0x prefix optional)", hide_input=True)
            password = click.prompt("Enter password for keystore", hide_input=True, confirmation_prompt=True)
            name = click.prompt("Enter account name (optional)", default="", show_default=False)
            
            if not private_key.startswith('0x'):
                private_key = '0x' + private_key
                
            account = self.account_manager.import_account(private_key, password, name or None)
            console.print(f"\n[green]Imported account: {account['name']} ({account['address']})[/green]")
            console.print(f"[green]Keystore file: {account['keystore']}[/green]")
            
        except click.Abort:
            console.print("\n[yellow]Account import cancelled.[/yellow]")
    except Exception as e:
            console.print(f"\n[red]Error importing account: {e}[/red]")
        click.pause()

    async def list_providers(self):
        """List configured providers."""
        providers = self.network_manager.get_providers()
        
        if not providers:
            console.print("\n[yellow]No providers configured.[/yellow]")
        else:
            table = Table(title="Configured Providers")
            table.add_column("Network", style="cyan")
            table.add_column("URL", style="green")
            table.add_column("Status", style="yellow")
            
            for network, url in providers.items():
                status = "Active" if self.network_manager.is_connected(network) else "Inactive"
                table.add_row(network, url, status)
                
            console.print(table)
        click.pause()

    async def remove_provider(self):
        """Remove provider configuration."""
        providers = self.network_manager.get_providers()
        
        if not providers:
            console.print("\n[yellow]No providers configured.[/yellow]")
            click.pause()
            return
            
        console.print("\nSelect provider to remove:")
        for i, (network, _) in enumerate(providers.items(), 1):
            console.print(f"{i}. {network}")
            
        try:
            choice = click.prompt("Enter provider number", type=int)
            if 1 <= choice <= len(providers):
                network = list(providers.keys())[choice - 1]
                self.network_manager.remove_provider(network)
                console.print(f"\n[green]Removed provider for network: {network}[/green]")
            else:
                console.print("\n[red]Invalid provider number.[/red]")
        except click.Abort:
            console.print("\n[yellow]Provider removal cancelled.[/yellow]")
        except Exception as e:
            console.print(f"\n[red]Error removing provider: {e}[/red]")
        click.pause()

    async def set_default_provider(self):
        """Set default provider."""
        providers = self.network_manager.get_providers()
        
        if not providers:
            console.print("\n[yellow]No providers configured.[/yellow]")
            click.pause()
            return
            
        console.print("\nSelect default provider:")
        for i, (network, _) in enumerate(providers.items(), 1):
            console.print(f"{i}. {network}")
            
        try:
            choice = click.prompt("Enter provider number", type=int)
            if 1 <= choice <= len(providers):
                network = list(providers.keys())[choice - 1]
                self.network_manager.set_default_provider(network)
                console.print(f"\n[green]Set default provider to: {network}[/green]")
            else:
                console.print("\n[red]Invalid provider number.[/red]")
        except click.Abort:
            console.print("\n[yellow]Default provider selection cancelled.[/yellow]")
                except Exception as e:
            console.print(f"\n[red]Error setting default provider: {e}[/red]")
        click.pause()

    async def show_network_status(self):
        """Show network status."""
        providers = self.network_manager.get_providers()
        
        if not providers:
            console.print("\n[yellow]No providers configured.[/yellow]")
        else:
            table = Table(title="Network Status")
            table.add_column("Network", style="cyan")
            table.add_column("Status", style="yellow")
            table.add_column("Block Number", style="green")
            table.add_column("Gas Price (Gwei)", style="magenta")
            
            for network in providers:
                status = "Connected" if self.network_manager.is_connected(network) else "Disconnected"
                block = self.network_manager.get_block_number(network) or "N/A"
                gas = self.network_manager.get_gas_price(network) or "N/A"
                
                table.add_row(
                    network,
                    status,
                    str(block),
                    str(gas)
                )
                
            console.print(table)
        click.pause()

    async def get_resolver(self):
        """Get resolver address for ENS name."""
        try:
            self.init_ens_ops()
            name = click.prompt("Enter ENS name")
            network = click.prompt("Enter network (optional)", default="", show_default=False)
            
            resolver = await self.ens_ops.get_resolver(name, network or None)
            if resolver:
                console.print(f"\n[green]Resolver address: {resolver}[/green]")
            else:
                console.print("\n[yellow]Could not get resolver[/yellow]")
        except click.Abort:
            console.print("\n[yellow]Resolver lookup cancelled.[/yellow]")
        except Exception as e:
            console.print(f"\n[red]Error getting resolver: {e}[/red]")
        click.pause()

    async def get_content_hash(self):
        """Get content hash for ENS name."""
        try:
            self.init_ens_ops()
            name = click.prompt("Enter ENS name")
            network = click.prompt("Enter network (optional)", default="", show_default=False)
            
            content_hash = await self.ens_ops.get_content_hash(name, network or None)
            if content_hash:
                console.print(f"\n[green]Content hash: {content_hash}[/green]")
            else:
                console.print("\n[yellow]Could not get content hash[/yellow]")
        except click.Abort:
            console.print("\n[yellow]Content hash lookup cancelled.[/yellow]")
            except Exception as e:
            console.print(f"\n[red]Error getting content hash: {e}[/red]")
        click.pause()

    async def get_text_record(self):
        """Get text record for ENS name."""
        try:
            self.init_ens_ops()
            name = click.prompt("Enter ENS name")
            key = click.prompt("Enter record key (e.g., email, url, avatar)")
            network = click.prompt("Enter network (optional)", default="", show_default=False)
            
            value = await self.ens_ops.get_text_record(name, key, network or None)
            if value:
                console.print(f"\n[green]Text record '{key}': {value}[/green]")
            else:
                console.print(f"\n[yellow]No text record found for key: {key}[/yellow]")
        except click.Abort:
            console.print("\n[yellow]Text record lookup cancelled.[/yellow]")
        except Exception as e:
            console.print(f"\n[red]Error getting text record: {e}[/red]")
        click.pause()

    async def check_name_availability(self):
        """Check if ENS name is available for registration."""
        try:
            self.init_ens_ops()
            name = click.prompt("Enter ENS name")
            network = click.prompt("Enter network")
            
            available = await self.ens_ops.is_name_available(name, network)
            if available:
                console.print(f"\n[green]The name '{name}' is available for registration![/green]")
            else:
                console.print(f"\n[yellow]The name '{name}' is already registered.[/yellow]")
        except click.Abort:
            console.print("\n[yellow]Availability check cancelled.[/yellow]")
        except Exception as e:
            console.print(f"\n[red]Error checking name availability: {e}[/red]")
        click.pause()

    async def transfer_name(self):
        """Transfer ENS name to new owner."""
        try:
            self.init_ens_ops()
            name = click.prompt("Enter ENS name")
            new_owner = click.prompt("Enter new owner address")
            network = click.prompt("Enter network")
            
            tx_hash = await self.ens_ops.transfer_name(name, new_owner, network)
            if tx_hash:
                console.print(f"\n[green]Transfer transaction: {tx_hash}[/green]")
            else:
                console.print("\n[red]Transfer failed[/red]")
        except click.Abort:
            console.print("\n[yellow]Transfer cancelled.[/yellow]")
            except Exception as e:
            console.print(f"\n[red]Error transferring name: {e}[/red]")
        click.pause()

    async def set_text_record(self):
        """Set text record for ENS name."""
        try:
            self.init_ens_ops()
            name = click.prompt("Enter ENS name")
            key = click.prompt("Enter record key (e.g., email, url, avatar)")
            value = click.prompt("Enter record value")
            network = click.prompt("Enter network")
            
            tx_hash = await self.ens_ops.set_text_record(name, key, value, network)
            if tx_hash:
                console.print(f"\n[green]Set text record transaction: {tx_hash}[/green]")
            else:
                console.print("\n[red]Failed to set text record[/red]")
        except click.Abort:
            console.print("\n[yellow]Text record setting cancelled.[/yellow]")
        except Exception as e:
            console.print(f"\n[red]Error setting text record: {e}[/red]")
        click.pause()

    async def set_resolver(self):
        """Set resolver for ENS name."""
        try:
            self.init_ens_ops()
            name = click.prompt("Enter ENS name")
            resolver = click.prompt("Enter resolver address")
            network = click.prompt("Enter network")
            
            tx_hash = await self.ens_ops.set_resolver(name, resolver, network)
            if tx_hash:
                console.print(f"\n[green]Set resolver transaction: {tx_hash}[/green]")
            else:
                console.print("\n[red]Failed to set resolver[/red]")
        except click.Abort:
            console.print("\n[yellow]Resolver setting cancelled.[/yellow]")
        except Exception as e:
            console.print(f"\n[red]Error setting resolver: {e}[/red]")
        click.pause()

    async def clear_record(self):
        """Clear ENS name record."""
        try:
            self.init_ens_ops()
            name = click.prompt("Enter ENS name")
            record_type = click.prompt("Enter record type (address/content/text)")
            network = click.prompt("Enter network")
            
            if record_type.lower() == 'text':
                key = click.prompt("Enter text record key")
                tx_hash = await self.ens_ops.clear_text_record(name, key, network)
            else:
                tx_hash = await self.ens_ops.clear_record(name, record_type, network)
                
            if tx_hash:
                console.print(f"\n[green]Clear record transaction: {tx_hash}[/green]")
            else:
                console.print("\n[red]Failed to clear record[/red]")
        except click.Abort:
            console.print("\n[yellow]Record clearing cancelled.[/yellow]")
        except Exception as e:
            console.print(f"\n[red]Error clearing record: {e}[/red]")
        click.pause()

    async def configure_gas(self):
        """Configure gas settings."""
        try:
            gas_limit = click.prompt("Enter default gas limit (leave empty for auto)", default="", show_default=False)
            gas_price = click.prompt("Enter default gas price in Gwei (leave empty for auto)", default="", show_default=False)
            
            if gas_limit:
                self.network_manager.set_default_gas_limit(int(gas_limit))
            if gas_price:
                self.network_manager.set_default_gas_price(int(gas_price))
                
            console.print("\n[green]Gas settings updated successfully![/green]")
        except click.Abort:
            console.print("\n[yellow]Gas configuration cancelled.[/yellow]")
        except Exception as e:
            console.print(f"\n[red]Error configuring gas settings: {e}[/red]")
        click.pause()

    async def set_logging_level(self):
        """Set logging level."""
        try:
            levels = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']
            console.print("\nAvailable logging levels:")
            for i, level in enumerate(levels, 1):
                console.print(f"{i}. {level}")
                
            choice = click.prompt("Select logging level", type=int)
            if 1 <= choice <= len(levels):
                level = levels[choice - 1]
                # Assuming logger is accessible through network_manager
                self.network_manager.set_logging_level(level)
                console.print(f"\n[green]Logging level set to: {level}[/green]")
            else:
                console.print("\n[red]Invalid logging level.[/red]")
        except click.Abort:
            console.print("\n[yellow]Logging level configuration cancelled.[/yellow]")
            except Exception as e:
            console.print(f"\n[red]Error setting logging level: {e}[/red]")
        click.pause()

    async def backup_config(self):
        """Backup configuration."""
        try:
            backup_dir = click.prompt("Enter backup directory path", default=str(Path.home()))
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            backup_file = Path(backup_dir) / f"ens_manager_backup_{timestamp}.zip"
            
            # Assuming backup method in network_manager
            self.network_manager.backup_configuration(backup_file)
            console.print(f"\n[green]Configuration backed up to: {backup_file}[/green]")
        except click.Abort:
            console.print("\n[yellow]Backup cancelled.[/yellow]")
        except Exception as e:
            console.print(f"\n[red]Error backing up configuration: {e}[/red]")
        click.pause()

    async def restore_config(self):
        """Restore configuration."""
        try:
            backup_file = click.prompt("Enter backup file path")
            if click.confirm("\nThis will overwrite current configuration. Continue?"):
                # Assuming restore method in network_manager
                self.network_manager.restore_configuration(backup_file)
                console.print("\n[green]Configuration restored successfully![/green]")
        except click.Abort:
            console.print("\n[yellow]Restore cancelled.[/yellow]")
        except Exception as e:
            console.print(f"\n[red]Error restoring configuration: {e}[/red]")
        click.pause()

@click.group()
def cli():
    """ENS Manager CLI."""
    pass

@cli.command()
def interactive():
    """Run in interactive mode."""
    manager = ENSManagerCLI()
    asyncio.run(manager.run())

if __name__ == '__main__':
    cli()