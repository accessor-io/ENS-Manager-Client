"""Configuration manager for ENS Manager."""

import os
import json
import base64
from pathlib import Path
from typing import Dict, Any, Optional, List
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

class ConfigManager:
    """Manages configuration settings for ENS Manager."""
    
    DEFAULT_PROVIDERS = {
        "Infura": "https://mainnet.infura.io/v3/{}",
        "Alchemy": "https://eth-mainnet.alchemyapi.io/v2/{}",
        "QuickNode": "https://api.quicknode.com/{}"
    }
    
    def __init__(self):
        """Initialize the configuration manager."""
        self.config_dir = Path.home() / '.ens_manager'
        self.config_file = self.config_dir / 'config.json'
        self.salt_file = self.config_dir / '.salt'
        self.fernet = None
        self._ensure_config_exists()
        self.config = {}

    def _generate_key(self, password: str) -> bytes:
        """Generate encryption key from password."""
        if not self.salt_file.exists():
            salt = os.urandom(16)
            self.salt_file.write_bytes(salt)
        else:
            salt = self.salt_file.read_bytes()

        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
        return key

    def initialize(self, password: str = None) -> bool:
        """Initialize configuration with password."""
        try:
            if not password and self.config_file.exists():
                return True

            if not password:
                return False

            key = self._generate_key(password)
            self.fernet = Fernet(key)
            
            if not self.config_file.exists():
                default_config = {
                    'networks': {
                        'mainnet': {
                            'provider_url': 'https://mainnet.infura.io/v3/YOUR-PROJECT-ID',
                            'chain_id': 1
                        },
                        'goerli': {
                            'provider_url': 'https://goerli.infura.io/v3/YOUR-PROJECT-ID',
                            'chain_id': 5
                        }
                    },
                    'default_network': 'mainnet',
                    'accounts': {},
                    'providers': {}
                }
                encrypted_data = self.fernet.encrypt(json.dumps(default_config).encode())
                self.config_file.write_bytes(encrypted_data)
            
            self.config = self._load_config()
            return True
        except Exception as e:
            print(f"Initialization error: {str(e)}")
            return False

    def _ensure_config_exists(self) -> None:
        """Ensure the configuration directory exists."""
        self.config_dir.mkdir(exist_ok=True)

    def _load_config(self) -> Dict[str, Any]:
        """Load and decrypt the configuration from file."""
        if not self.config_file.exists() or not self.fernet:
            return {}
        try:
            encrypted_data = self.config_file.read_bytes()
            decrypted_data = self.fernet.decrypt(encrypted_data)
            return json.loads(decrypted_data.decode())
        except Exception as e:
            print(f"Error loading configuration: {str(e)}")
            return {}

    def _save_config(self) -> None:
        """Encrypt and save the configuration to file."""
        if not self.fernet:
            return
        try:
            encrypted_data = self.fernet.encrypt(json.dumps(self.config).encode())
            self.config_file.write_bytes(encrypted_data)
        except Exception as e:
            print(f"Error saving configuration: {str(e)}")

    def get(self, key: str, default: Any = None) -> Any:
        """Get a configuration value."""
        return self.config.get(key, default)

    def set(self, key: str, value: Any) -> None:
        """Set a configuration value."""
        self.config[key] = value
        self._save_config()

    def get_network_config(self, network: str) -> Optional[Dict[str, Any]]:
        """Get configuration for a specific network."""
        return self.config.get('networks', {}).get(network)

    def set_network_config(self, network: str, config: Dict[str, Any]) -> None:
        """Set configuration for a specific network."""
        if 'networks' not in self.config:
            self.config['networks'] = {}
        self.config['networks'][network] = config
        self._save_config()

    def get_default_network(self) -> str:
        """Get the default network."""
        return self.config.get('default_network', 'mainnet')

    def set_default_network(self, network: str) -> None:
        """Set the default network."""
        self.config['default_network'] = network
        self._save_config()

    def add_provider(self, name: str, api_key: str, provider_type: Optional[str] = None) -> bool:
        """Add a new provider configuration."""
        try:
            if 'providers' not in self.config:
                self.config['providers'] = {}

            if provider_type and provider_type in self.DEFAULT_PROVIDERS:
                url = self.DEFAULT_PROVIDERS[provider_type].format(api_key)
            else:
                url = api_key

            self.config['providers'][name] = {
                'url': url,
                'type': provider_type
            }
            self._save_config()
            return True
        except Exception as e:
            print(f"Error adding provider: {str(e)}")
            return False

    def remove_provider(self, name: str) -> bool:
        """Remove a provider configuration."""
        try:
            if name in self.config.get('providers', {}):
                del self.config['providers'][name]
                self._save_config()
                return True
            return False
        except Exception as e:
            print(f"Error removing provider: {str(e)}")
            return False

    def list_providers(self) -> List[str]:
        """List configured providers."""
        return list(self.config.get('providers', {}).keys())

    def get_provider(self, name: Optional[str] = None) -> Optional[str]:
        """Get provider URL by name or active provider."""
        providers = self.config.get('providers', {})
        if not name:
            name = self.get_active_provider()
        return providers.get(name, {}).get('url') if name else None

    def set_active_provider(self, name: str) -> bool:
        """Set the active provider."""
        if name in self.config.get('providers', {}):
            self.config['active_provider'] = name
            self._save_config()
            return True
        return False 

    def get_provider_info(self, name: str) -> Dict[str, Any]:
        """Get detailed information about a provider."""
        return self.config.get('providers', {}).get(name, {})

    def get_active_provider(self) -> Optional[str]:
        """Get the name of the active provider."""
        return self.config.get('active_provider')

    def add_account(self, name: str, private_key: str) -> bool:
        """Add a new account configuration."""
        try:
            if 'accounts' not in self.config:
                self.config['accounts'] = {}
                
            self.config['accounts'][name] = {
                'private_key': private_key,
                'address': self._derive_address(private_key)
            }
            self._save_config()
            return True
        except Exception as e:
            print(f"Error adding account: {str(e)}")
            return False
            
    def remove_account(self, name: str) -> bool:
        """Remove an account configuration."""
        try:
            if name in self.config.get('accounts', {}):
                del self.config['accounts'][name]
                self._save_config()
                return True
            return False
        except Exception as e:
            print(f"Error removing account: {str(e)}")
            return False
            
    def list_accounts(self) -> List[str]:
        """List configured accounts."""
        return list(self.config.get('accounts', {}).keys())
        
    def get_account(self, name: Optional[str] = None) -> Optional[str]:
        """Get account private key by name or active account."""
        accounts = self.config.get('accounts', {})
        if not name:
            name = self.get_active_account()
        return accounts.get(name, {}).get('private_key') if name else None
        
    def set_active_account(self, name: str) -> bool:
        """Set the active account."""
        if name in self.config.get('accounts', {}):
            self.config['active_account'] = name
            self._save_config()
            return True
        return False
        
    def get_account_info(self, name: str) -> Dict[str, Any]:
        """Get detailed information about an account."""
        return self.config.get('accounts', {}).get(name, {})
        
    def get_active_account(self) -> Optional[str]:
        """Get the name of the active account."""
        return self.config.get('active_account')
        
    def _derive_address(self, private_key: str) -> str:
        """Derive Ethereum address from private key."""
        from eth_account import Account
        account = Account.from_key(private_key)
        return account.address