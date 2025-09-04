"""UI Manager for ENS Manager."""

from rich.console import Console
from rich.panel import Panel
from rich.layout import Layout
from rich.table import Table
from rich.text import Text
from rich.style import Style
from rich.theme import Theme
from rich.box import DOUBLE, ROUNDED
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.live import Live
from rich.align import Align
from rich import box
import time
import random
import questionary
from typing import List, Dict, Any, Optional
from pyfiglet import figlet_format

# Custom theme for consistent styling
THEME = Theme({
    "info": "bright_cyan",
    "warning": "bright_yellow",
    "error": "bright_red bold",
    "success": "bright_green bold",
    "header": "bright_blue bold",
    "subheader": "bright_cyan",
    "highlight": "bright_magenta",
    "dim": "grey50",
    "accent": "bright_yellow bold",
})

# Enhanced questionary style with better colors and contrast
QUESTIONARY_STYLE = questionary.Style([
    ('qmark', 'fg:#61afef bold'),           # Bright blue question mark
    ('question', 'fg:#e06c75 bold'),        # Bright red question text
    ('answer', 'fg:#98c379 bold'),          # Bright green answer
    ('pointer', 'fg:#e5c07b bold'),         # Bright yellow pointer
    ('highlighted', 'fg:#e5c07b bold'),     # Bright yellow highlighted
    ('selected', 'fg:#282c34 bg:#61afef'),  # Dark text on blue background
    ('separator', 'fg:#5c6370'),           # Grey separator
    ('instruction', 'fg:#abb2bf'),         # Light grey instruction
    ('text', 'fg:#abb2bf'),                # Light grey text
    ('disabled', 'fg:#5c6370'),            # Grey disabled
])

class UIManager:
    """Manages the user interface for ENS Manager."""
    
    def __init__(self):
        """Initialize UI Manager."""
        self.console = Console(theme=THEME)
        
    def display_header(self, animate: bool = True):
        """Display application header with optional color-cycling animation."""
        ascii_logo = figlet_format("ENS Manager", font="slant")

        def _rainbow_text(figlet_str: str) -> Text:
            """Return Text object where each non-space char cycles through rainbow colors."""
            rainbow_colors = [
                "bright_red",
                "bright_yellow",
                "bright_green",
                "bright_cyan",
                "bright_blue",
                "bright_magenta",
            ]
            txt = Text()
            color_index = 0
            for ch in figlet_str:
                if ch.strip():
                    txt.append(ch, style=rainbow_colors[color_index % len(rainbow_colors)])
                    color_index += 1
                else:
                    txt.append(ch)
            return txt

        banner_text = _rainbow_text(ascii_logo)

        def _panel(text: Text, border_color: str = "bright_blue"):
            return Panel(
                text,
                box=box.DOUBLE,
                border_style=border_color,
                padding=(1, 2),
                title="ENS Manager",
                subtitle="Ethereum Name Service Toolkit • by accessor.eth"
            )

        def _random_ens_name() -> str:
            letters = "abcdefghijklmnopqrstuvwxyz0123456789"
            length = random.randint(3, 8)
            name = "".join(random.choice(letters) for _ in range(length))
            return f"{name}.eth"

        def _matrix_effect(duration: float = 1.5, width: int = 60, height: int = 12):
            """Display a falling matrix of random ENS names for visual flair."""
            frames = int(duration / 0.05)
            lines = [" " * width for _ in range(height)]
            initial = Text("\n".join(lines), style="green")
            with Live(initial, console=self.console, refresh_per_second=20) as live:
                for _ in range(frames):
                    # Shift lines down
                    lines.pop()
                    # Create new top line composed of random ENS names separated by spaces
                    new_line = " ".join(_random_ens_name() for _ in range(width // 10))
                    lines.insert(0, new_line[:width].ljust(width))
                    live.update(Text("\n".join(lines), style="green"))
                    time.sleep(0.05)

        if animate:
            # ---------- Matrix waterfall of ENS names ---------- #
            _matrix_effect()

            # Clear the matrix so the banner can be revealed in the same space
            self.console.clear()

            # ---------- Fade-in rainbow banner ---------- #
            border_colors = [
                "bright_red",
                "bright_yellow",
                "bright_green",
                "bright_cyan",
                "bright_magenta",
                "bright_blue",
            ]

            banner_lines_raw = ascii_logo.splitlines()
            assembled_text = Text()

            with Live(_panel(assembled_text), console=self.console, refresh_per_second=30) as live:
                # Gradually append each line to create a fade-in effect
                for raw_line in banner_lines_raw:
                    rainbow_line = _rainbow_text(raw_line + "\n")
                    assembled_text.append(rainbow_line)
                    live.update(_panel(assembled_text))
                    time.sleep(0.05)

                # Cycle the border colors a few times for flair
                for i in range(18):
                    live.update(_panel(assembled_text, border_color=border_colors[i % len(border_colors)]))
                    time.sleep(0.04)
            # Live context exits leaving the last frame rendered
        else:
            # Static banner only
            self.console.print(_panel(banner_text))
    
    def display_simple_title(self):
        """Display a simple title without the full banner."""
        self.console.print()  # Add some spacing
        self.console.print("[header]ENS Manager[/header]", justify="center")
        self.console.print("[dim]─" * 60 + "[/dim]", justify="center")
        self.console.print()  # Add some spacing
        
    def create_menu(self, title: str, options: List[str]) -> Optional[str]:
        """Create an interactive menu with enhanced styling."""
        try:
            # Add some visual spacing
            self.console.print()
            
            result = questionary.select(
                title,
                choices=options,
                style=QUESTIONARY_STYLE,
                qmark="*",
                instruction="(Use arrow keys and Enter to select)",
                show_selected=True
            ).ask()
            
            # Add spacing after selection
            if result:
                self.console.print()
                
            return result
        except KeyboardInterrupt:
            # Handle Ctrl+C gracefully
            self.console.print("\n[warning]Operation cancelled by user[/warning]")
            return None
        except Exception as e:
            self.display_error(f"Menu error: {str(e)}")
            return None
        
    def display_ens_info(self, info: Dict[str, Any]):
        """Display comprehensive ENS information with enhanced layout."""
        layout = Layout()
        layout.split_column(
            Layout(name="header", size=3),
            Layout(name="main"),
            Layout(name="footer", size=8)
        )
        
        # Header with name and status
        name = info.get('name', 'N/A')
        address = info.get('Address')
        owner = info.get('Owner')
        
        status = "[success]Active[/success]" if address else "[error]Not Resolved[/error]"
        header_text = f"[header]ENS Name Information:[/header] [highlight]{name}[/highlight] {status}"
        
        layout["header"].update(
            Panel(
                header_text,
                box=ROUNDED,
                border_style="bright_blue"
            )
        )
        
        # Main content - Core Information
        main_table = Table(box=box.ROUNDED, show_header=True, header_style="bold cyan", title="Core Information")
        main_table.add_column("Property", style="cyan", width=20)
        main_table.add_column("Value", style="green", width=50)
        
        # Core properties in order of importance
        core_properties = [
            ('Address', 'Address'),
            ('Owner', 'Owner'),
            ('Resolver', 'Resolver'),
            ('TTL', 'Expiry Date'),
            ('Content Hash', 'Content Hash')
        ]
        
        for display_name, key in core_properties:
            value = info.get(key)
            if value:
                # Format long addresses
                if key in ['Address', 'Owner', 'Resolver'] and len(str(value)) > 42:
                    formatted_value = f"{str(value)[:20]}...{str(value)[-20:]}"
                else:
                    formatted_value = str(value)
                main_table.add_row(display_name, formatted_value)
            else:
                main_table.add_row(display_name, "[dim]Not set[/dim]")
        
        layout["main"].update(main_table)
        
        # Footer - Text Records and Additional Info
        footer_layout = Layout()
        footer_layout.split_row(
            Layout(name="text_records", ratio=2),
            Layout(name="additional_info", ratio=1)
        )
        
        # Text Records Section
        text_records_table = Table(box=box.ROUNDED, show_header=True, header_style="bold yellow", title="Text Records")
        text_records_table.add_column("Key", style="yellow", width=20)
        text_records_table.add_column("Value", style="white", width=40)
        
        text_records_found = False
        for key, value in info.items():
            if key.startswith('Text: '):
                text_records_found = True
                record_key = key.replace('Text: ', '')
                # Truncate long values
                if len(str(value)) > 35:
                    formatted_value = f"{str(value)[:32]}..."
                else:
                    formatted_value = str(value)
                text_records_table.add_row(record_key, formatted_value)
        
        if not text_records_found:
            text_records_table.add_row("No text records", "[dim]None found[/dim]")
        
        footer_layout["text_records"].update(text_records_table)
        
        # Additional Information Section
        additional_info = []
        
        # Registration status
        if owner:
            additional_info.append(("Status", "[success]Registered[/success]"))
        else:
            additional_info.append(("Status", "[error]Not Registered[/error]"))
        
        # Name length analysis
        name_without_eth = name.replace('.eth', '')
        if len(name_without_eth) <= 3:
            additional_info.append(("Length", f"[highlight]Short ({len(name_without_eth)})[/highlight]"))
        elif len(name_without_eth) <= 6:
            additional_info.append(("Length", f"[warning]Medium ({len(name_without_eth)})[/warning]"))
        else:
            additional_info.append(("Length", f"[dim]Long ({len(name_without_eth)})[/dim]"))
        
        # Check if it's a premium name (common words)
        premium_words = ['eth', 'crypto', 'web3', 'defi', 'nft', 'dao', 'blockchain', 'wallet', 'exchange']
        if name_without_eth.lower() in premium_words:
            additional_info.append(("Premium", "[highlight]Yes[/highlight]"))
        
        additional_table = Table(box=box.ROUNDED, show_header=True, header_style="bold magenta", title="Additional Info")
        additional_table.add_column("Property", style="magenta", width=15)
        additional_table.add_column("Value", style="white", width=25)
        
        for key, value in additional_info:
            additional_table.add_row(key, value)
        
        footer_layout["additional_info"].update(additional_table)
        
        layout["footer"].update(footer_layout)
        
        self.console.print(layout)
        
    def display_config_status(self, config: Dict[str, Any]):
        """Display configuration status with enhanced styling."""
        layout = Layout()
        layout.split_column(
            Layout(name="header"),
            Layout(name="providers"),
            Layout(name="accounts")
        )
        
        # Header
        layout["header"].update(
            Panel(
                "[header]Configuration Status[/header]",
                box=ROUNDED
            )
        )
        
        # Providers section
        providers_table = Table(
            title="[subheader]Providers[/subheader]",
            box=box.ROUNDED,
            show_header=True,
            title_style="bold cyan"
        )
        providers_table.add_column("Name", style="cyan")
        providers_table.add_column("Type", style="green")
        providers_table.add_column("Status", style="yellow")
        
        for name, provider in config.get("providers", {}).items():
            status = "[success]Active[/success]" if name == config.get("active_provider") else ""
            provider_type = provider.get("type", "Custom")
            providers_table.add_row(name, provider_type, status)
            
        layout["providers"].update(providers_table)
        
        # Accounts section
        accounts_table = Table(
            title="[subheader]Accounts[/subheader]",
            box=box.ROUNDED,
            show_header=True,
            title_style="bold cyan"
        )
        accounts_table.add_column("Name", style="cyan")
        accounts_table.add_column("Status", style="yellow")
        
        for name in config.get("accounts", {}):
            status = "[success]Active[/success]" if name == config.get("active_account") else ""
            accounts_table.add_row(name, status)
            
        layout["accounts"].update(accounts_table)
        
        self.console.print(layout)
        
    def display_loading(self, message: str):
        """Display a loading spinner with message."""
        return Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            transient=True
        )
        
    def prompt_input(self, message: str, password: bool = False) -> str:
        """Prompt for user input with styling."""
        if password:
            return questionary.password(
                message,
                style=QUESTIONARY_STYLE,
                qmark="[pwd]"
            ).ask()
        return questionary.text(
            message,
            style=QUESTIONARY_STYLE,
            qmark=">"
        ).ask()
        
    def confirm(self, message: str) -> bool:
        """Display a confirmation prompt with styling."""
        return questionary.confirm(
            message,
            style=QUESTIONARY_STYLE,
            qmark="?"
        ).ask()
        
    def display_success(self, message: str):
        """Display a success message."""
        self.console.print(f"[success]SUCCESS[/success] {message}")
        
    def display_error(self, message: str):
        """Display an error message."""
        self.console.print(f"[error]ERROR[/error] {message}")
        
    def display_warning(self, message: str):
        """Display a warning message."""
        self.console.print(f"[warning]WARNING[/warning] {message}")
        
    def display_info(self, message: str):
        """Display an info message."""
        self.console.print(f"[info]INFO[/info] {message}")
        
    def display_history(self, history: List[Dict[str, Any]], name: str):
        """Display ENS name history with enhanced styling."""
        layout = Layout()
        layout.split_column(
            Layout(name="header"),
            Layout(name="main")
        )
        
        # Header
        layout["header"].update(
            Panel(
                f"[header]History for:[/header] [highlight]{name}[/highlight]",
                box=ROUNDED
            )
        )
        
        # Main content
        table = Table(box=box.ROUNDED, show_header=True, header_style="bold cyan")
        table.add_column("Type", style="cyan")
        table.add_column("From/Owner", style="green")
        table.add_column("To", style="blue")
        table.add_column("Time", style="magenta")
        table.add_column("Block", style="yellow")
        
        for event in history:
            if event['type'] == 'Transfer':
                table.add_row(
                    event['type'],
                    event['from'],
                    event['to'],
                    event['timestamp'],
                    str(event['block'])
                )
            else:  # NewOwner
                table.add_row(
                    event['type'],
                    event['owner'],
                    "",
                    event['timestamp'],
                    str(event['block'])
                )
                
        layout["main"].update(table)
        self.console.print(layout)
        
    def display_transaction_history(self, transactions: List[Dict[str, Any]], name: str):
        """Display transaction history for an ENS name with enhanced styling."""
        layout = Layout()
        layout.split_column(
            Layout(name="header"),
            Layout(name="main")
        )
        
        # Header
        layout["header"].update(
            Panel(
                f"[header]Transaction History for:[/header] [highlight]{name}[/highlight]",
                box=ROUNDED
            )
        )
        
        # Main content
        table = Table(box=box.ROUNDED, show_header=True, header_style="bold cyan")
        table.add_column("Hash", style="cyan", width=20)
        table.add_column("From", style="green", width=20)
        table.add_column("To", style="blue", width=20)
        table.add_column("Contract", style="yellow", width=12)
        table.add_column("Value (ETH)", style="magenta", width=12)
        table.add_column("Time", style="white", width=20)
        
        for tx in transactions:
            # Truncate hash for display
            hash_display = f"{tx['hash'][:10]}...{tx['hash'][-8:]}"
            
            # Format timestamp
            timestamp = tx['timestamp']
            if hasattr(timestamp, 'strftime'):
                time_display = timestamp.strftime("%Y-%m-%d %H:%M")
            else:
                time_display = str(timestamp)
            
            # Format value
            value = tx.get('value', 0)
            if hasattr(value, '__float__'):
                value_display = f"{float(value):.6f}"
            else:
                value_display = str(value)
            
            table.add_row(
                hash_display,
                tx.get('from', 'N/A'),
                tx.get('to', 'N/A'),
                tx.get('contract', 'N/A'),
                value_display,
                time_display
            )
                
        layout["main"].update(table)
        self.console.print(layout)
        
        # Show summary
        total_transactions = len(transactions)
        total_value = sum(float(tx.get('value', 0)) for tx in transactions)
        
        summary_panel = Panel(
            f"[header]Summary:[/header] {total_transactions} transactions, "
            f"Total value: {total_value:.6f} ETH",
            box=ROUNDED,
            border_style="bright_blue"
        )
        self.console.print(summary_panel)
        
    def display_comprehensive_activity(self, activity_data: Dict[str, Any], name: str, days: int):
        """Display comprehensive activity analysis for an ENS name."""
        from datetime import datetime, timedelta
        from collections import defaultdict
        
        layout = Layout()
        layout.split_column(
            Layout(name="header"),
            Layout(name="summary"),
            Layout(name="events"),
            Layout(name="transactions"),
            Layout(name="patterns"),
            Layout(name="analysis")
        )
        
        # Header
        layout["header"].update(
            Panel(
                f"[header]Comprehensive Activity Analysis for:[/header] [highlight]{name}[/highlight]\n"
                f"[dim]Period: Last {days} days[/dim]",
                box=ROUNDED
            )
        )
        
        # Summary statistics
        events = activity_data.get('events', [])
        transactions = activity_data.get('transactions', [])
        metrics = activity_data.get('metrics', {})
        analysis = activity_data.get('analysis', {})
        
        summary_table = Table(box=box.ROUNDED, show_header=True, header_style="bold cyan")
        summary_table.add_column("Metric", style="cyan")
        summary_table.add_column("Count", style="green")
        summary_table.add_column("Details", style="yellow")
        
        summary_table.add_row("Total Events", str(len(events)), "On-chain events")
        summary_table.add_row("Total Transactions", str(len(transactions)), "Etherscan transactions")
        summary_table.add_row("Total Activities", str(metrics.get('total_activities', 0)), "Combined activity")
        
        # Calculate unique addresses
        unique_addresses = set()
        for tx in transactions:
            unique_addresses.add(tx.get('from', ''))
            unique_addresses.add(tx.get('to', ''))
        unique_addresses.discard('')
        
        summary_table.add_row("Unique Addresses", str(len(unique_addresses)), "Involved in transactions")
        
        # Calculate total value
        total_value = sum(float(tx.get('value', 0)) for tx in transactions)
        summary_table.add_row("Total Value (ETH)", f"{total_value:.6f}", "Transaction values")
        
        # Add ownership changes
        ownership_changes = metrics.get('ownership_changes', 0)
        summary_table.add_row("Ownership Changes", str(ownership_changes), "Transfer events")
        
        # Add activity intensity
        intensity = analysis.get('activity_intensity', 'Unknown')
        summary_table.add_row("Activity Intensity", intensity, "Activity level")
        
        layout["summary"].update(Panel(summary_table, title="Summary Statistics"))
        
        # Events breakdown
        if events:
            event_table = Table(box=box.ROUNDED, show_header=True, header_style="bold magenta")
            event_table.add_column("Timestamp", style="cyan")
            event_table.add_column("Event Type", style="green")
            event_table.add_column("Transaction", style="blue")
            event_table.add_column("Details", style="yellow")
            
            # Group events by type
            event_types = defaultdict(int)
            
            for event in events[-20:]:  # Show last 20 events
                timestamp = datetime.fromisoformat(event['timestamp'])
                formatted_time = timestamp.strftime('%Y-%m-%d %H:%M')
                
                # Format transaction hash
                tx_hash = event['data'].get('transaction', 'N/A')
                if len(tx_hash) > 20:
                    tx_hash = f"{tx_hash[:10]}...{tx_hash[-8:]}"
                
                # Format details
                details = []
                for k, v in event['data'].get('args', {}).items():
                    if k != 'node' and len(str(v)) < 50:  # Skip long values
                        details.append(f"{k}: {v}")
                details_str = "; ".join(details[:3])  # Limit to 3 details
                
                event_table.add_row(
                    formatted_time,
                    event['type'],
                    tx_hash,
                    details_str
                )
                
                event_types[event['type']] += 1
            
            layout["events"].update(Panel(event_table, title="Recent Events"))
            
            # Event type breakdown
            event_breakdown = Table(box=box.ROUNDED, show_header=True, header_style="bold magenta")
            event_breakdown.add_column("Event Type", style="cyan")
            event_breakdown.add_column("Count", style="green")
            event_breakdown.add_column("Percentage", style="yellow")
            
            total_events = len(events)
            for event_type, count in sorted(event_types.items(), key=lambda x: x[1], reverse=True):
                percentage = (count / total_events * 100) if total_events > 0 else 0
                event_breakdown.add_row(event_type, str(count), f"{percentage:.1f}%")
            
            layout["events"].update(Panel(event_breakdown, title="Event Type Breakdown"))
        else:
            layout["events"].update(Panel("No events recorded in this period", title="Events"))
        
        # Transactions breakdown
        if transactions:
            tx_table = Table(box=box.ROUNDED, show_header=True, header_style="bold blue")
            tx_table.add_column("Timestamp", style="cyan")
            tx_table.add_column("Hash", style="green")
            tx_table.add_column("From", style="blue")
            tx_table.add_column("To", style="magenta")
            tx_table.add_column("Value (ETH)", style="yellow")
            tx_table.add_column("Contract", style="white")
            
            # Group transactions by contract
            contract_stats = defaultdict(lambda: {'count': 0, 'value': 0})
            
            for tx in transactions[-15:]:  # Show last 15 transactions
                timestamp = tx['timestamp']
                if hasattr(timestamp, 'strftime'):
                    formatted_time = timestamp.strftime('%Y-%m-%d %H:%M')
                else:
                    formatted_time = str(timestamp)
                
                # Format hash
                tx_hash = f"{tx['hash'][:10]}...{tx['hash'][-8:]}"
                
                # Format addresses
                from_addr = f"{tx['from'][:10]}...{tx['from'][-8:]}" if len(tx['from']) > 20 else tx['from']
                to_addr = f"{tx['to'][:10]}...{tx['to'][-8:]}" if len(tx['to']) > 20 else tx['to']
                
                # Format value
                value = float(tx.get('value', 0))
                value_str = f"{value:.6f}"
                
                contract = tx.get('contract', 'N/A')
                
                tx_table.add_row(
                    formatted_time,
                    tx_hash,
                    from_addr,
                    to_addr,
                    value_str,
                    contract
                )
                
                contract_stats[contract]['count'] += 1
                contract_stats[contract]['value'] += value
            
            layout["transactions"].update(Panel(tx_table, title="Recent Transactions"))
            
            # Contract breakdown
            contract_breakdown = Table(box=box.ROUNDED, show_header=True, header_style="bold blue")
            contract_breakdown.add_column("Contract", style="cyan")
            contract_breakdown.add_column("Transactions", style="green")
            contract_breakdown.add_column("Total Value (ETH)", style="yellow")
            
            for contract, stats in sorted(contract_stats.items(), key=lambda x: x[1]['count'], reverse=True):
                contract_breakdown.add_row(
                    contract,
                    str(stats['count']),
                    f"{stats['value']:.6f}"
                )
            
            layout["transactions"].update(Panel(contract_breakdown, title="Contract Activity"))
        else:
            layout["transactions"].update(Panel("No transactions found in this period", title="Transactions"))
        
        # Activity patterns
        patterns = activity_data.get('patterns', {})
        if patterns:
            patterns_layout = Layout()
            patterns_layout.split_row(
                Layout(name="daily"),
                Layout(name="hourly")
            )
            
            # Daily activity pattern
            daily_activity = patterns.get('daily_activity', {})
            if daily_activity:
                daily_table = Table(box=box.ROUNDED, show_header=True, header_style="bold green")
                daily_table.add_column("Date", style="cyan")
                daily_table.add_column("Activities", style="green")
                
                for date, count in sorted(daily_activity.items())[-10:]:  # Show last 10 days
                    daily_table.add_row(date.strftime('%Y-%m-%d'), str(count))
                
                patterns_layout["daily"].update(Panel(daily_table, title="Daily Activity"))
            
            # Hourly activity pattern
            hourly_activity = patterns.get('hourly_activity', {})
            if hourly_activity:
                hourly_table = Table(box=box.ROUNDED, show_header=True, header_style="bold green")
                hourly_table.add_column("Hour", style="cyan")
                hourly_table.add_column("Activities", style="green")
                
                for hour, count in sorted(hourly_activity.items()):
                    hourly_table.add_row(f"{hour:02d}:00", str(count))
                
                patterns_layout["hourly"].update(Panel(hourly_table, title="Hourly Activity"))
            
            layout["patterns"].update(patterns_layout)
        else:
            layout["patterns"].update(Panel("No activity patterns available", title="Activity Patterns"))
        
        # Activity analysis
        analysis_table = Table(box=box.ROUNDED, show_header=True, header_style="bold green")
        analysis_table.add_column("Analysis", style="cyan")
        analysis_table.add_column("Value", style="green")
        
        # Most active periods
        if 'most_active_day' in analysis:
            most_active = analysis['most_active_day']
            analysis_table.add_row("Most Active Day", f"{most_active['date']}: {most_active['activities']} activities")
        
        if 'least_active_day' in analysis:
            least_active = analysis['least_active_day']
            analysis_table.add_row("Least Active Day", f"{least_active['date']}: {least_active['activities']} activities")
        
        if 'most_active_hour' in analysis:
            most_active_hour = analysis['most_active_hour']
            analysis_table.add_row("Most Active Hour", f"{most_active_hour['hour']:02d}:00 ({most_active_hour['activities']} activities)")
        
        # Value analysis
        if transactions:
            avg_value = metrics.get('avg_value', 0)
            max_value = metrics.get('max_value', 0)
            min_value = metrics.get('min_value', 0)
            
            analysis_table.add_row("Average Transaction Value", f"{avg_value:.6f} ETH")
            analysis_table.add_row("Largest Transaction", f"{max_value:.6f} ETH")
            analysis_table.add_row("Smallest Transaction", f"{min_value:.6f} ETH")
        
        # Most active address
        if 'most_active_address' in analysis:
            most_active_addr = analysis['most_active_address']
            addr = most_active_addr['address']
            short_addr = f"{addr[:10]}...{addr[-8:]}" if len(addr) > 20 else addr
            analysis_table.add_row("Most Active Address", f"{short_addr} ({most_active_addr['transactions']} tx)")
        
        # Current state
        if 'current_state' in analysis:
            current_state = analysis['current_state']
            owner = current_state.get('owner', 'Not set')
            if owner and len(owner) > 20:
                owner = f"{owner[:10]}...{owner[-8:]}"
            analysis_table.add_row("Current Owner", owner)
        
        layout["analysis"].update(Panel(analysis_table, title="Activity Analysis"))
        
        self.console.print(layout)
        
    def pause(self):
        """Display a styled pause prompt."""
        self.prompt_input("[dim]Press Enter to continue...[/dim]")
        
    def display_recent_transactions(self, transactions: List[Dict[str, Any]], name: str):
        """Display recent transactions for an ENS name."""
        if not transactions:
            return
            
        tx_table = Table(
            box=box.ROUNDED, 
            show_header=True, 
            header_style="bold bright_blue", 
            title=f"Recent Transactions for {name}"
        )
        tx_table.add_column("Hash", style="bright_blue", width=20)
        tx_table.add_column("Type", style="yellow", width=15)
        tx_table.add_column("Block", style="cyan", width=10)
        tx_table.add_column("Gas Used", style="green", width=12)
        tx_table.add_column("Status", style="white", width=10)
        
        for tx in transactions[:5]:  # Show last 5 transactions
            tx_hash = tx.get('hash', 'Unknown')
            tx_type = tx.get('type', 'Unknown')
            block = tx.get('block_number', 'Unknown')
            gas_used = tx.get('gas_used', 'Unknown')
            status = tx.get('status', 'Unknown')
            
            # Truncate hash for display
            display_hash = f"{tx_hash[:8]}...{tx_hash[-6:]}" if len(tx_hash) > 14 else tx_hash
            
            # Color code status
            status_style = "[success]Success[/success]" if status == 1 else "[error]Failed[/error]" if status == 0 else "[dim]Unknown[/dim]"
            
            tx_table.add_row(display_hash, tx_type, str(block), str(gas_used), status_style)
        
        self.console.print(tx_table) 