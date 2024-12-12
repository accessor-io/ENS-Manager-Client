"""Configuration manager for ENS Manager."""

import os
import json
from pathlib import Path
from typing import Dict, List, Optional
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64
from getpass import getpass
from rich.console import Console
from rich.table import Table

console = Console()

class ConfigManager:
    """Manages encrypted configuration storage for ENS Manager."""
    
    CONFIG_DIR = os.path.expanduser("~/.ens-manager")
    CONFIG_FILE = os.path.join(CONFIG_DIR, "config.enc")
    SALT_FILE = os.path.join(CONFIG_DIR, "salt")
    
    DEFAULT_PROVIDERS = {
        "Infura": "https://mainnet.infura.io/v3/{}",
        "Alchemy": "https://eth-mainnet.alchemyapi.io/v2/{}",
        "QuickNode": "https://api.quicknode.com/{}"
    }
    
    def __init__(self):
        """Initialize configuration manager."""
        self.ensure_config_dir()
        self._fernet = None
        self._config = None
    
    def ensure_config_dir(self):
        """Ensure configuration directory exists."""
        os.makedirs(self.CONFIG_DIR, mode=0o700, exist_ok=True)
    
    def _init_encryption(self, password: str) -> None:
        """Initialize encryption with password."""
        if not os.path.exists(self.SALT_FILE):
            salt = os.urandom(16)
            with open(self.SALT_FILE, 'wb') as f:
                f.write(salt)
        else:
            with open(self.SALT_FILE, 'rb') as f:
                salt = f.read()
        
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=480000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
        self._fernet = Fernet(key)
    
    def _load_config(self, password: str) -> None:
        """Load configuration from encrypted file."""
        if not os.path.exists(self.CONFIG_FILE):
            self._config = {
                "providers": {},
                "accounts": {},
                "active_provider": None,
                "active_account": None
            }
            return
        
        try:
            with open(self.CONFIG_FILE, 'rb') as f:
                encrypted_data = f.read()
            decrypted_data = self._fernet.decrypt(encrypted_data)
            self._config = json.loads(decrypted_data.decode())
        except Exception as e:
            console.print(f"[error]Error loading configuration: {str(e)}[/error]")
            self._config = {
                "providers": {},
                "accounts": {},
                "active_provider": None,
                "active_account": None
            }
    
    def _save_config(self) -> None:
        """Save configuration to encrypted file."""
        if not self._fernet or not self._config:
            return
            
        encrypted_data = self._fernet.encrypt(json.dumps(self._config).encode())
        with open(self.CONFIG_FILE, 'wb') as f:
            f.write(encrypted_data)
    
    def initialize(self, password: str = None) -> bool:
        """Initialize configuration with password."""
        if not password:
            password = getpass("Enter password for configuration encryption: ")
        
        try:
            self._init_encryption(password)
            self._load_config(password)
            return True
        except Exception as e:
            console.print(f"[error]Error initializing configuration: {str(e)}[/error]")
            return False
    
    def add_provider(self, name: str, api_key: str, provider_type: str = None) -> bool:
        """Add a new provider configuration."""
        if not self._config:
            return False
            
        if provider_type and provider_type in self.DEFAULT_PROVIDERS:
            url = self.DEFAULT_PROVIDERS[provider_type].format(api_key)
        else:
            url = api_key
            
        self._config["providers"][name] = {
            "url": url,
            "type": provider_type
        }
        self._save_config()
        return True
    
    def add_account(self, name: str, private_key: str) -> bool:
        """Add a new account configuration."""
        if not self._config:
            return False
            
        self._config["accounts"][name] = {
            "private_key": private_key
        }
        self._save_config()
        return True
    
    def get_provider(self, name: str = None) -> Optional[str]:
        """Get provider URL by name or active provider."""
        if not self._config:
            return None
            
        if not name:
            name = self._config.get("active_provider")
            
        if not name:
            return None
            
        provider = self._config["providers"].get(name)
        return provider["url"] if provider else None
    
    def get_account(self, name: str = None) -> Optional[str]:
        """Get account private key by name or active account."""
        if not self._config:
            return None
            
        if not name:
            name = self._config.get("active_account")
            
        if not name:
            return None
            
        account = self._config["accounts"].get(name)
        return account["private_key"] if account else None
    
    def set_active_provider(self, name: str) -> bool:
        """Set active provider."""
        if not self._config or name not in self._config["providers"]:
            return False
            
        self._config["active_provider"] = name
        self._save_config()
        return True
    
    def set_active_account(self, name: str) -> bool:
        """Set active account."""
        if not self._config or name not in self._config["accounts"]:
            return False
            
        self._config["active_account"] = name
        self._save_config()
        return True
    
    def list_providers(self) -> List[str]:
        """List all configured providers."""
        if not self._config:
            return []
        return list(self._config["providers"].keys())
    
    def list_accounts(self) -> List[str]:
        """List all configured accounts."""
        if not self._config:
            return []
        return list(self._config["accounts"].keys())
    
    def get_active_provider(self) -> Optional[str]:
        """Get active provider name."""
        if not self._config:
            return None
        return self._config.get("active_provider")
    
    def get_active_account(self) -> Optional[str]:
        """Get active account name."""
        if not self._config:
            return None
        return self._config.get("active_account")
    
    def remove_provider(self, name: str) -> bool:
        """Remove a provider configuration."""
        if not self._config or name not in self._config["providers"]:
            return False
            
        del self._config["providers"][name]
        if self._config["active_provider"] == name:
            self._config["active_provider"] = None
        self._save_config()
        return True
    
    def remove_account(self, name: str) -> bool:
        """Remove an account configuration."""
        if not self._config or name not in self._config["accounts"]:
            return False
            
        del self._config["accounts"][name]
        if self._config["active_account"] == name:
            self._config["active_account"] = None
        self._save_config()
        return True
    
    def display_config_status(self) -> None:
        """Display current configuration status."""
        if not self._config:
            console.print("[warning]Configuration not initialized[/warning]")
            return
            
        table = Table(title="ENS Manager Configuration")
        
        # Providers section
        table.add_section()
        table.add_row("[bold cyan]Providers[/bold cyan]", "")
        for name, provider in self._config["providers"].items():
            active = " [green](active)[/green]" if name == self._config["active_provider"] else ""
            table.add_row(
                f"  {name}{active}",
                f"{provider['type'] if provider.get('type') else 'Custom'}"
            )
        
        # Accounts section
        table.add_section()
        table.add_row("[bold cyan]Accounts[/bold cyan]", "")
        for name in self._config["accounts"].keys():
            active = " [green](active)[/green]" if name == self._config["active_account"] else ""
            table.add_row(f"  {name}{active}", "")
        
        console.print(table) 