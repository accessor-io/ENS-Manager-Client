"""User interface management for ENS Manager."""

from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich import box
from typing import List, Dict, Any

console = Console()

class UIManager:
    """Manages user interface elements for ENS Manager."""
    
    def display_error(self, message: str):
        """Display error message."""
        console.print(f"[red]Error: {message}[/red]")
    
    def display_success(self, message: str):
        """Display success message."""
        console.print(f"[green]{message}[/green]")
    
    def display_info(self, message: str):
        """Display info message."""
        console.print(f"[blue]{message}[/blue]")
    
    def display_warning(self, message: str):
        """Display warning message."""
        console.print(f"[yellow]Warning: {message}[/yellow]")
    
    def display_table(self, headers: List[str], rows: List[List[str]], title: str = None):
        """Display data in a table format."""
        table = Table(title=title, box=box.ROUNDED)
        
        for header in headers:
            table.add_column(header, style="cyan")
        
        for row in rows:
            table.add_row(*row)
        
        console.print(table)
    
    def display_dict(self, data: Dict[str, Any], title: str = None):
        """Display dictionary data in a formatted way."""
        if title:
            console.print(f"\n[bold cyan]{title}[/bold cyan]")
        
        for key, value in data.items():
            console.print(f"[cyan]{key}[/cyan]: {value}")
    
    def display_list(self, items: List[str], title: str = None):
        """Display list items in a formatted way."""
        if title:
            console.print(f"\n[bold cyan]{title}[/bold cyan]")
        
        for item in items:
            console.print(f"• {item}")
    
    def display_header(self, text: str):
        """Display header text."""
        console.print(Panel(text, style="bold cyan")) 