"""Account management module."""

import json
import os
from pathlib import Path
from typing import Dict, Optional, List
from eth_account import Account
import secrets
from datetime import datetime
from eth_utils import remove_0x_prefix, add_0x_prefix

class AccountManager:
    """Manage Ethereum accounts and their persistence."""
    
    def __init__(self):
        """Initialize account manager."""
        self.base_dir = Path.home() / '.ens-manager'
        self.keystore_dir = self.base_dir / 'keystore'
        self.accounts_file = self.base_dir / 'accounts.json'
        self.current_account = None
        self.private_key = None
        
        # Create necessary directories
        self.base_dir.mkdir(exist_ok=True)
        self.keystore_dir.mkdir(exist_ok=True)
        
        # Load accounts registry
        self.accounts = self._load_accounts()
        
    def _load_accounts(self) -> Dict:
        """Load accounts registry from file."""
        if self.accounts_file.exists():
            try:
                with open(self.accounts_file, 'r') as f:
                    return json.load(f)
            except Exception:
                return {}
        return {}
        
    def _save_accounts(self):
        """Save accounts registry to file."""
        with open(self.accounts_file, 'w') as f:
            json.dump(self.accounts, f, indent=2)
            
    def create_account(self, password: str, name: Optional[str] = None) -> Dict:
        """Create new account.
        
        Args:
            password: Account password
            name: Optional account name
            
        Returns:
            Account information
        """
        # Create new account
        acct = Account.create()
        address = acct.address
        private_key = acct.key.hex()
        
        # Generate keystore filename
        timestamp = datetime.now().strftime('%Y-%m-%d-%H-%M-%S')
        keystore_name = f"UTC--{timestamp}--{address[2:].lower()}"
        keystore_path = self.keystore_dir / keystore_name
        
        # Create keystore file
        keystore = Account.encrypt(private_key, password)
        with open(keystore_path, 'w') as f:
            json.dump(keystore, f)
            
        # Add to accounts registry
        account_info = {
            'address': address,
            'keystore': str(keystore_path),
            'name': name or address[:10],
            'created_at': timestamp
        }
        self.accounts[address] = account_info
        self._save_accounts()
        
        # Set as current account
        self.current_account = address
        self.private_key = private_key
        
        return account_info
        
    def load_account(self, keystore_path: str, password: str) -> Dict:
        """Load account from keystore.
        
        Args:
            keystore_path: Path to keystore file
            password: Account password
            
        Returns:
            Account information
        """
        # Load and decrypt keystore
        with open(keystore_path) as f:
            keystore = json.load(f)
            
        private_key = Account.decrypt(keystore, password)
        account = Account.from_key(private_key)
        address = account.address
        
        # Add to accounts registry if not exists
        if address not in self.accounts:
            self.accounts[address] = {
                'address': address,
                'keystore': str(keystore_path),
                'name': address[:10],
                'created_at': datetime.now().strftime('%Y-%m-%d-%H-%M-%S')
            }
            self._save_accounts()
            
        # Set as current account
        self.current_account = address
        self.private_key = private_key.hex()
        
        return self.accounts[address]
        
    def list_accounts(self) -> List[Dict]:
        """List all registered accounts.
        
        Returns:
            List of account information
        """
        return list(self.accounts.values())
        
    def get_account(self, address: str) -> Optional[Dict]:
        """Get account information.
        
        Args:
            address: Account address
            
        Returns:
            Account information or None
        """
        return self.accounts.get(address)
        
    def rename_account(self, address: str, name: str):
        """Rename account.
        
        Args:
            address: Account address
            name: New account name
        """
        if address in self.accounts:
            self.accounts[address]['name'] = name
            self._save_accounts()
            
    def export_private_key(self, address: str, keystore_path: str, password: str) -> str:
        """Export account private key.
        
        Args:
            address: Account address
            keystore_path: Path to keystore file
            password: Account password
            
        Returns:
            Private key hex string
        """
        try:
            # Ensure keystore path is a Path object
            keystore_path = Path(keystore_path)
            
            # Read and decrypt keystore
            with open(keystore_path, 'r') as f:
                keystore = json.load(f)
                
            # Decrypt the keystore
            private_key_bytes = Account.decrypt(keystore, password)
            
            # Convert to hex string and ensure 0x prefix
            private_key = add_0x_prefix(private_key_bytes.hex())
            
            return private_key
            
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid keystore file format: {e}")
        except ValueError as e:
            raise ValueError(f"Failed to decrypt keystore: {e}")
        except Exception as e:
            raise ValueError(f"Error exporting private key: {e}")
        
    def get_current_account(self) -> Optional[Dict]:
        """Get current account information.
        
        Returns:
            Current account information or None
        """
        if self.current_account:
            return self.accounts.get(self.current_account)
        return None
        
    def get_private_key(self) -> Optional[str]:
        """Get current account private key.
        
        Returns:
            Private key hex string or None
        """
        return self.private_key