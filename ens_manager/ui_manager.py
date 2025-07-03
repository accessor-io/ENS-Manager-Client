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
import questionary
from typing import List, Dict, Any, Optional

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
        
    def display_header(self):
        """Display application header."""
        header = Panel(
            Align(
                Text("ENS Manager", style="bold blue"),
                align="center"
            ),
            subtitle="Ethereum Name Service Management Tool",
            box=box.DOUBLE
        )
        self.console.print(header)
    
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
                qmark="🔹",
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
        """Display ENS information in a styled table."""
        layout = Layout()
        layout.split_column(
            Layout(name="header"),
            Layout(name="main"),
            Layout(name="footer")
        )
        
        # Header
        layout["header"].update(
            Panel(
                f"[header]ENS Name Information:[/header] [highlight]{info.get('name', 'N/A')}[/highlight]",
                box=ROUNDED
            )
        )
        
        # Main content
        table = Table(box=box.ROUNDED, show_header=True, header_style="bold cyan")
        table.add_column("Property", style="cyan")
        table.add_column("Value", style="green")
        
        for key, value in info.items():
            if key != 'name':
                if value:
                    table.add_row(key, str(value))
                else:
                    table.add_row(key, "[error]Not set[/error]")
        
        layout["main"].update(table)
        
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
                qmark="🔒"
            ).ask()
        return questionary.text(
            message,
            style=QUESTIONARY_STYLE,
            qmark="💭"
        ).ask()
        
    def confirm(self, message: str) -> bool:
        """Display a confirmation prompt with styling."""
        return questionary.confirm(
            message,
            style=QUESTIONARY_STYLE,
            qmark="❓"
        ).ask()
        
    def display_success(self, message: str):
        """Display a success message."""
        self.console.print(f"[success]✓[/success] {message}")
        
    def display_error(self, message: str):
        """Display an error message."""
        self.console.print(f"[error]✗[/error] {message}")
        
    def display_warning(self, message: str):
        """Display a warning message."""
        self.console.print(f"[warning]⚠[/warning] {message}")
        
    def display_info(self, message: str):
        """Display an info message."""
        self.console.print(f"[info]ℹ[/info] {message}")
        
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
        
    def pause(self):
        """Display a styled pause prompt."""
        self.prompt_input("[dim]Press Enter to continue...[/dim]") 