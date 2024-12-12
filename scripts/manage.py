#!/usr/bin/env python3
"""Management script for ENS Manager development tasks."""

import click
import subprocess
import os
from rich.console import Console

console = Console()

@click.group()
def cli():
    """ENS Manager development tools."""
    pass

@cli.command()
def setup():
    """Set up the development environment."""
    console.print("[blue]Setting up development environment...[/blue]")
    
    # Install dependencies
    subprocess.run(["poetry", "install"])
    
    # Set up pre-commit hooks
    subprocess.run(["poetry", "run", "pre-commit", "install"])
    
    console.print("[green]Setup complete![/green]")

@cli.command()
def test():
    """Run tests with pytest."""
    console.print("[blue]Running tests...[/blue]")
    subprocess.run(["poetry", "run", "pytest"])

@cli.command()
def format():
    """Format code with black and isort."""
    console.print("[blue]Formatting code...[/blue]")
    subprocess.run(["poetry", "run", "black", "."])
    subprocess.run(["poetry", "run", "isort", "."])
    console.print("[green]Formatting complete![/green]")

@cli.command()
def lint():
    """Run linting checks."""
    console.print("[blue]Running linting checks...[/blue]")
    subprocess.run(["poetry", "run", "flake8"])
    subprocess.run(["poetry", "run", "mypy", "."])

@cli.command()
def clean():
    """Clean up generated files."""
    console.print("[blue]Cleaning up...[/blue]")
    patterns = [
        "**/__pycache__",
        "**/*.pyc",
        "**/*.pyo",
        "**/*.pyd",
        ".pytest_cache",
        ".coverage",
        "htmlcov",
        "dist",
        "build",
        "*.egg-info",
    ]
    
    for pattern in patterns:
        os.system(f"find . -name '{pattern}' -exec rm -rf {{}} +")
    
    console.print("[green]Cleanup complete![/green]")

@cli.command()
@click.argument('name')
def run(name):
    """Run a specific command defined in pyproject.toml."""
    console.print(f"[blue]Running {name}...[/blue]")
    subprocess.run(["poetry", "run", name])

if __name__ == '__main__':
    cli()
