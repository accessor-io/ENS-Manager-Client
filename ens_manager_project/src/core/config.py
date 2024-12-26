"""Configuration module for ENS Manager."""

import os
from pathlib import Path
from typing import Optional, Dict, Any
from dotenv import load_dotenv

from .errors import ConfigurationError

class Config:
    """Configuration manager for ENS Manager."""
    
    def __init__(self):
        """Initialize configuration."""
        self.config_dir = Path.home() / '.ens-manager'
        self.config_dir.mkdir(exist_ok=True)
        
        # Load environment variables
        self._load_env()
        
        # Default settings
        self.settings = {
            'keystore_dir': str(self.config_dir / 'keystore'),
            'cache_dir': str(self.config_dir / 'cache'),
            'log_dir': str(self.config_dir / 'logs'),
            'default_network': 'mainnet',
            'gas_limit': 500000,
            'cache_duration': 300,  # 5 minutes
            'max_retries': 3,
            'request_timeout': 30,
        }
        
        # Create necessary directories
        Path(self.settings['keystore_dir']).mkdir(exist_ok=True)
        Path(self.settings['cache_dir']).mkdir(exist_ok=True)
        Path(self.settings['log_dir']).mkdir(exist_ok=True)
        
    def _load_env(self):
        """Load environment variables."""
        # Try to load from .env file
        env_file = Path('.env')
        if env_file.exists():
            load_dotenv(env_file)
            
    def get_provider_url(self, network: str) -> Optional[str]:
        """Get provider URL for network.
        
        Args:
            network: Network name
            
        Returns:
            Provider URL if configured, None otherwise
        """
        env_var = f'ETH_{network.upper()}_PROVIDER'
        return os.getenv(env_var)
        
    def get_etherscan_api_key(self) -> Optional[str]:
        """Get Etherscan API key.
        
        Returns:
            API key if configured, None otherwise
        """
        return os.getenv('ETHERSCAN_API_KEY')
        
    def get_setting(self, key: str) -> Any:
        """Get setting value.
        
        Args:
            key: Setting key
            
        Returns:
            Setting value
            
        Raises:
            ConfigurationError: If setting doesn't exist
        """
        if key not in self.settings:
            raise ConfigurationError(f"Setting '{key}' not found")
        return self.settings[key]
        
    def set_setting(self, key: str, value: Any):
        """Set setting value.
        
        Args:
            key: Setting key
            value: Setting value
        """
        self.settings[key] = value
        
    def get_all_settings(self) -> Dict[str, Any]:
        """Get all settings.
        
        Returns:
            Dictionary of all settings
        """
        return self.settings.copy()
        
    def validate_configuration(self) -> bool:
        """Validate configuration.
        
        Returns:
            True if configuration is valid
        """
        required_dirs = ['keystore_dir', 'cache_dir', 'log_dir']
        for dir_key in required_dirs:
            dir_path = Path(self.settings[dir_key])
            if not dir_path.exists() or not dir_path.is_dir():
                return False
                
        return True 