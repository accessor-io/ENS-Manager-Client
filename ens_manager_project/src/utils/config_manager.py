"""Configuration management for ENS Manager."""

import os
from pathlib import Path
import json
from typing import Optional, Dict, List
from datetime import datetime
from rich.console import Console

console = Console()

class ConfigManager:
    """Manages configuration settings for ENS Manager."""
    
    def __init__(self):
        """Initialize configuration manager."""
        self.config_dir = Path.home() / ".ens_manager"
        self.config_file = self.config_dir / "config.json"
        self.accounts_dir = self.config_dir / "accounts"
        self._ensure_dirs()
        self.config = self._load_config()
    
    def _ensure_dirs(self):
        """Ensure configuration directories exist."""
        self.config_dir.mkdir(exist_ok=True)
        self.accounts_dir.mkdir(exist_ok=True)
    
    def _load_config(self) -> Dict:
        """Load configuration from file."""
        default_config = {
            "active_account": None,
            "active_provider": None,
            "providers": {},
            "networks": {}
        }
        
        if not self.config_file.exists():
            return default_config.copy()
        
        try:
            with open(self.config_file, 'r') as f:
                config = json.load(f)
                # Ensure all required keys exist
                for key in default_config:
                    if key not in config:
                        config[key] = default_config[key]
                return config
        except Exception as e:
            console.print(f"[red]Error loading config: {e}[/red]")
            return default_config.copy()
    
    def _save_config(self):
        """Save configuration to file."""
        try:
            with open(self.config_file, 'w') as f:
                json.dump(self.config, f, indent=4)
        except Exception as e:
            console.print(f"[red]Error saving config: {e}[/red]")
    
    def get_account(self) -> Optional[str]:
        """Get active account private key."""
        if not self.config["active_account"]:
            return None
            
        account_file = self.accounts_dir / f"{self.config['active_account']}.json"
        if not account_file.exists():
            return None
            
        try:
            with open(account_file, 'r') as f:
                data = json.load(f)
                return data.get("private_key")
        except Exception:
            return None
    
    def get_provider(self) -> Optional[str]:
        """Get active provider URL."""
        if not self.config["active_provider"]:
            return None
            
        return self.config["providers"].get(self.config["active_provider"])
    
    def add_provider(self, name: str, url: str):
        """Add a new provider configuration."""
        self.config["providers"][name] = url
        self._save_config()
    
    def remove_provider(self, name: str):
        """Remove a provider configuration."""
        if name in self.config["providers"]:
            del self.config["providers"][name]
            if self.config["active_provider"] == name:
                self.config["active_provider"] = None
            self._save_config()
    
    def set_active_provider(self, name: str):
        """Set the active provider."""
        if name in self.config["providers"]:
            self.config["active_provider"] = name
            self._save_config()
    
    def get_providers(self) -> Dict[str, str]:
        """Get all configured providers."""
        return self.config["providers"]
    
    def create_account(self, name: str, private_key: str):
        """Create a new account configuration."""
        account_file = self.accounts_dir / f"{name}.json"
        
        if account_file.exists():
            raise ValueError(f"Account {name} already exists")
            
        try:
            with open(account_file, 'w') as f:
                json.dump({
                    "private_key": private_key,
                    "created_at": str(datetime.now())
                }, f, indent=4)
            
            self.config["active_account"] = name
            self._save_config()
        except Exception as e:
            console.print(f"[red]Error creating account: {e}[/red]")
            raise
    
    def load_account(self, name: str):
        """Load an existing account."""
        account_file = self.accounts_dir / f"{name}.json"
        
        if not account_file.exists():
            raise ValueError(f"Account {name} does not exist")
            
        self.config["active_account"] = name
        self._save_config()
    
    def get_accounts(self) -> List[str]:
        """Get list of available accounts."""
        return [f.stem for f in self.accounts_dir.glob("*.json")] 