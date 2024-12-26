"""Network manager module."""

from typing import Dict, Optional
from web3 import Web3
from eth_account import Account
import json
import os
from pathlib import Path
import zipfile
from datetime import datetime
import logging

from .account_manager import AccountManager
from .logger import Logger
from .config import Config

class NetworkManager:
    """Manage network connections and accounts."""
    
    def __init__(self):
        """Initialize network manager."""
        self.providers: Dict[str, Web3] = {}
        self.account_manager = AccountManager()
        self.config = Config()
        self.logger = Logger(self.config)
        self.default_provider = None
        self.default_gas_limit = 500000
        self.default_gas_price = None
        
    def add_provider(self, network: str, provider_url: str) -> bool:
        """Add provider for network."""
        try:
            provider = Web3(Web3.HTTPProvider(provider_url))
            if provider.is_connected():
                self.providers[network] = provider
                
                # Set current account if exists
                current_account = self.account_manager.get_current_account()
                if current_account:
                    provider.eth.default_account = current_account['address']
                    
                # Save to config
                self.config.add_provider(network, provider_url)
                
                # Set as default if first provider
                if not self.default_provider:
                    self.default_provider = network
                    
                self.logger.info(f"Added provider for network: {network}")
                return True
                
            self.logger.error(f"Failed to connect to provider for network: {network}")
            return False
            
        except Exception as e:
            self.logger.error(f"Error adding provider: {e}")
            return False
            
    def remove_provider(self, network: str) -> bool:
        """Remove provider for network."""
        if network in self.providers:
            del self.providers[network]
            self.config.remove_provider(network)
            
            # Update default provider if needed
            if self.default_provider == network:
                self.default_provider = next(iter(self.providers)) if self.providers else None
                
            self.logger.info(f"Removed provider for network: {network}")
            return True
            
        return False
        
    def set_default_provider(self, network: str) -> bool:
        """Set default provider."""
        if network in self.providers:
            self.default_provider = network
            self.config.set_setting('default_network', network)
            self.logger.info(f"Set default provider to: {network}")
            return True
        return False
        
    def get_web3(self, network: Optional[str] = None) -> Optional[Web3]:
        """Get Web3 instance for network."""
        if not network:
            network = self.default_provider
            
        return self.providers.get(network)
        
    def get_providers(self) -> Dict[str, str]:
        """Get all configured providers."""
        return {network: str(provider.provider.endpoint_uri) for network, provider in self.providers.items()}
        
    def is_connected(self, network: str) -> bool:
        """Check if connected to network."""
        web3 = self.get_web3(network)
        return web3 is not None and web3.is_connected()
        
    def get_block_number(self, network: str) -> Optional[int]:
        """Get current block number for network."""
        try:
            web3 = self.get_web3(network)
            return web3.eth.block_number if web3 else None
        except Exception as e:
            self.logger.error(f"Error getting block number: {e}")
            return None
            
    def get_gas_price(self, network: str) -> Optional[float]:
        """Get current gas price for network in Gwei."""
        try:
            web3 = self.get_web3(network)
            if not web3:
                return None
            wei_price = web3.eth.gas_price
            return round(web3.from_wei(wei_price, 'gwei'), 2)
        except Exception as e:
            self.logger.error(f"Error getting gas price: {e}")
            return None
            
    def set_default_gas_limit(self, limit: int):
        """Set default gas limit."""
        self.default_gas_limit = limit
        self.config.set_setting('gas_limit', limit)
        self.logger.info(f"Set default gas limit to: {limit}")
        
    def set_default_gas_price(self, price_gwei: int):
        """Set default gas price in Gwei."""
        self.default_gas_price = price_gwei
        self.config.set_setting('gas_price', price_gwei)
        self.logger.info(f"Set default gas price to: {price_gwei} Gwei")
        
    def get_transaction_params(self, network: Optional[str] = None) -> Dict:
        """Get transaction parameters."""
        params = {'gas': self.default_gas_limit}
        
        if self.default_gas_price:
            params['gasPrice'] = Web3.to_wei(self.default_gas_price, 'gwei')
            
        return params
        
    def set_logging_level(self, level: str):
        """Set logging level."""
        self.logger.set_level(level)
        
    def backup_configuration(self, backup_path: Path):
        """Backup configuration to zip file."""
        try:
            with zipfile.ZipFile(backup_path, 'w') as backup:
                # Backup config files
                config_files = [
                    self.config.config_file,
                    self.account_manager.accounts_file
                ]
                
                # Add keystore files
                keystore_dir = Path(self.config.get_setting('keystore_dir'))
                if keystore_dir.exists():
                    for keystore in keystore_dir.glob('*'):
                        config_files.append(keystore)
                        
                # Write files to zip
                for file in config_files:
                    if file.exists():
                        backup.write(file, file.name)
                        
            self.logger.info(f"Configuration backed up to: {backup_path}")
            
        except Exception as e:
            self.logger.error(f"Error backing up configuration: {e}")
            raise
            
    def restore_configuration(self, backup_path: Path):
        """Restore configuration from zip file."""
        try:
            with zipfile.ZipFile(backup_path, 'r') as backup:
                # Extract to temp directory
                temp_dir = Path(self.config.get_setting('cache_dir')) / 'restore_temp'
                temp_dir.mkdir(exist_ok=True)
                backup.extractall(temp_dir)
                
                # Restore config files
                for file in temp_dir.glob('*'):
                    if file.name == self.config.config_file.name:
                        file.replace(self.config.config_file)
                    elif file.name == self.account_manager.accounts_file.name:
                        file.replace(self.account_manager.accounts_file)
                    else:
                        # Assume it's a keystore file
                        keystore_dir = Path(self.config.get_setting('keystore_dir'))
                        keystore_dir.mkdir(exist_ok=True)
                        file.replace(keystore_dir / file.name)
                        
                # Reload configuration
                self.config = Config()
                self.account_manager = AccountManager()
                
                # Reconnect providers
                self.providers = {}
                for network, url in self.config.get_providers().items():
                    self.add_provider(network, url)
                    
                self.logger.info(f"Configuration restored from: {backup_path}")
                
        except Exception as e:
            self.logger.error(f"Error restoring configuration: {e}")
            raise
        finally:
            # Cleanup
            if temp_dir.exists():
                for file in temp_dir.glob('*'):
                    file.unlink()
                temp_dir.rmdir()
                
    def get_private_key(self) -> Optional[str]:
        """Get current account private key."""
        return self.account_manager.get_private_key()