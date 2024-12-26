"""ENS Manager core functionality."""

from typing import Optional, List, Dict, Any, Tuple
from web3 import Web3
from eth_account import Account
from eth_account.signers.local import LocalAccount
from web3.middleware import geth_poa_middleware
from eth_utils import is_address, to_checksum_address
import json
from datetime import datetime, timezone
import asyncio

# ENS Registry ABI (mainnet: 0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e)
ENS_REGISTRY_ABI = [
    {"inputs":[{"name":"node","type":"bytes32"}],"name":"resolver","outputs":[{"name":"","type":"address"}],"type":"function"},
    {"inputs":[{"name":"node","type":"bytes32"}],"name":"owner","outputs":[{"name":"","type":"address"}],"type":"function"},
    {"inputs":[{"name":"node","type":"bytes32"}],"name":"ttl","outputs":[{"name":"","type":"uint64"}],"type":"function"},
    {"inputs":[{"name":"node","type":"bytes32"},{"name":"owner","type":"address"}],"name":"setOwner","outputs":[],"type":"function"},
    {"inputs":[{"name":"node","type":"bytes32"},{"name":"resolver","type":"address"}],"name":"setResolver","outputs":[],"type":"function"},
]

# ENS Public Resolver ABI
ENS_RESOLVER_ABI = [
    {"inputs":[{"name":"node","type":"bytes32"}],"name":"addr","outputs":[{"name":"","type":"address"}],"type":"function"},
    {"inputs":[{"name":"node","type":"bytes32"},{"name":"addr","type":"address"}],"name":"setAddr","outputs":[],"type":"function"},
    {"inputs":[{"name":"node","type":"bytes32"}],"name":"name","outputs":[{"name":"","type":"string"}],"type":"function"},
    {"inputs":[{"name":"node","type":"bytes32"},{"name":"name","type":"string"}],"name":"setName","outputs":[],"type":"function"},
    {"inputs":[{"name":"node","type":"bytes32"}],"name":"contenthash","outputs":[{"name":"","type":"bytes"}],"type":"function"},
    {"inputs":[{"name":"node","type":"bytes32"},{"name":"hash","type":"bytes"}],"name":"setContenthash","outputs":[],"type":"function"},
]

# ENS Registrar Controller ABI
ENS_CONTROLLER_ABI = [
    {"inputs":[{"name":"name","type":"string"},{"name":"duration","type":"uint256"}],"name":"rentPrice","outputs":[{"name":"","type":"uint256"}],"type":"function"},
    {"inputs":[{"name":"name","type":"string"},{"name":"owner","type":"address"},{"name":"duration","type":"uint256"}],"name":"register","outputs":[],"type":"function"},
    {"inputs":[{"name":"name","type":"string"},{"name":"duration","type":"uint256"}],"name":"renew","outputs":[],"type":"function"},
]

class ENSManager:
    """Manages ENS operations."""
    
    def __init__(self, provider_url: Optional[str] = None, private_key: Optional[str] = None):
        """Initialize ENS Manager.
        
        Args:
            provider_url: Ethereum node provider URL
            private_key: Account private key for transactions
        """
        self.provider_url = provider_url
        self.private_key = private_key
        self.w3: Optional[Web3] = None
        self.account: Optional[LocalAccount] = None
        self.ens = None
        self.registry = None
        self.resolver = None
        self.controller = None
        
        # Don't connect immediately, wait for explicit connect call
        self._connected = False
        
        if provider_url:
            self.connect()
    
    def connect(self) -> bool:
        """Connect to Ethereum network and initialize account."""
        if self._connected:
            return True
            
        if not self.provider_url:
            return False
            
        try:
            self.w3 = Web3(Web3.HTTPProvider(self.provider_url))
            self.w3.middleware_onion.inject(geth_poa_middleware, layer=0)
            
            if self.private_key:
                self.account = Account.from_key(self.private_key)
            
            # Initialize ENS contracts
            self.ens = self.w3.ens
            self.registry = self.w3.eth.contract(
                address="0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e",
                abi=ENS_REGISTRY_ABI
            )
            
            # Initialize default public resolver
            resolver_address = "0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41"
            self.resolver = self.w3.eth.contract(
                address=resolver_address,
                abi=ENS_RESOLVER_ABI
            )
            
            # Initialize registrar controller
            controller_address = "0x283Af0B28c62C092C9727F1Ee09c02CA627EB7F5"
            self.controller = self.w3.eth.contract(
                address=controller_address,
                abi=ENS_CONTROLLER_ABI
            )
            
            self._connected = True
            return True
            
        except Exception:
            self.w3 = None
            self.account = None
            self.ens = None
            self.registry = None
            self.resolver = None
            self.controller = None
            self._connected = False
            return False
    
    @property
    def is_connected(self) -> bool:
        """Check if connected to Ethereum network."""
        return self._connected and self.w3 is not None
    
    @property
    def has_account(self) -> bool:
        """Check if account is configured."""
        return self.account is not None
    
    def resolve_name(self, name: str) -> Optional[str]:
        """Resolve ENS name to Ethereum address."""
        if not self.is_connected:
            return None
            
        try:
            return self.ens.address(name)
        except Exception:
            return None
    
    def reverse_lookup(self, address: str) -> Optional[str]:
        """Get ENS name for an Ethereum address."""
        if not self.is_connected:
            return None
            
        try:
            if not is_address(address):
                return None
            return self.ens.name(address)
        except Exception:
            return None
    
    def get_owner(self, name: str) -> Optional[str]:
        """Get owner of an ENS name."""
        if not self.is_connected:
            return None
            
        try:
            node = self.ens.namehash(name)
            owner = self.registry.functions.owner(node).call()
            return owner if owner != "0x0000000000000000000000000000000000000000" else None
        except Exception:
            return None
    
    def get_resolver(self, name: str) -> Optional[str]:
        """Get resolver address for an ENS name."""
        if not self.is_connected:
            return None
            
        try:
            node = self.ens.namehash(name)
            return self.registry.functions.resolver(node).call()
        except Exception:
            return None
    
    def get_content_hash(self, name: str) -> Optional[str]:
        """Get content hash for an ENS name."""
        if not self.is_connected:
            return None
            
        try:
            node = self.ens.namehash(name)
            resolver_address = self.get_resolver(name)
            if not resolver_address:
                return None
                
            resolver = self.w3.eth.contract(
                address=resolver_address,
                abi=ENS_RESOLVER_ABI
            )
            return resolver.functions.contenthash(node).call()
        except Exception:
            return None
    
    def get_registration_cost(self, name: str, duration_years: int = 1) -> Optional[int]:
        """Get cost to register/renew an ENS name."""
        if not self.is_connected:
            return None
            
        try:
            duration = duration_years * 365 * 24 * 60 * 60  # Convert years to seconds
            return self.controller.functions.rentPrice(name, duration).call()
        except Exception:
            return None
    
    def register_name(self, name: str, duration_years: int = 1) -> bool:
        """Register an ENS name."""
        if not self.is_connected or not self.has_account:
            return False
            
        try:
            duration = duration_years * 365 * 24 * 60 * 60  # Convert years to seconds
            cost = self.get_registration_cost(name, duration_years)
            
            if not cost:
                return False
                
            tx = self.controller.functions.register(
                name,
                self.account.address,
                duration
            ).build_transaction({
                'from': self.account.address,
                'value': cost,
                'nonce': self.w3.eth.get_transaction_count(self.account.address)
            })
            
            signed_tx = self.w3.eth.account.sign_transaction(tx, self.private_key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)
            self.w3.eth.wait_for_transaction_receipt(tx_hash)
            return True
            
        except Exception:
            return False
    
    def renew_name(self, name: str, duration_years: int = 1) -> bool:
        """Renew an ENS name registration."""
        if not self.is_connected or not self.has_account:
            return False
            
        try:
            duration = duration_years * 365 * 24 * 60 * 60  # Convert years to seconds
            cost = self.get_registration_cost(name, duration_years)
            
            if not cost:
                return False
                
            tx = self.controller.functions.renew(
                name,
                duration
            ).build_transaction({
                'from': self.account.address,
                'value': cost,
                'nonce': self.w3.eth.get_transaction_count(self.account.address)
            })
            
            signed_tx = self.w3.eth.account.sign_transaction(tx, self.private_key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)
            self.w3.eth.wait_for_transaction_receipt(tx_hash)
            return True
            
        except Exception:
            return False
    
    def set_address(self, name: str, address: str) -> bool:
        """Set address record for an ENS name."""
        if not self.is_connected or not self.has_account:
            return False
            
        try:
            if not is_address(address):
                return False
                
            node = self.ens.namehash(name)
            resolver_address = self.get_resolver(name)
            
            if not resolver_address:
                return False
                
            resolver = self.w3.eth.contract(
                address=resolver_address,
                abi=ENS_RESOLVER_ABI
            )
            
            tx = resolver.functions.setAddr(
                node,
                to_checksum_address(address)
            ).build_transaction({
                'from': self.account.address,
                'nonce': self.w3.eth.get_transaction_count(self.account.address)
            })
            
            signed_tx = self.w3.eth.account.sign_transaction(tx, self.private_key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)
            self.w3.eth.wait_for_transaction_receipt(tx_hash)
            return True
            
        except Exception:
            return False
    
    def set_content_hash(self, name: str, content_hash: str) -> bool:
        """Set content hash for an ENS name."""
        if not self.is_connected or not self.has_account:
            return False
            
        try:
            node = self.ens.namehash(name)
            resolver_address = self.get_resolver(name)
            
            if not resolver_address:
                return False
                
            resolver = self.w3.eth.contract(
                address=resolver_address,
                abi=ENS_RESOLVER_ABI
            )
            
            tx = resolver.functions.setContenthash(
                node,
                content_hash
            ).build_transaction({
                'from': self.account.address,
                'nonce': self.w3.eth.get_transaction_count(self.account.address)
            })
            
            signed_tx = self.w3.eth.account.sign_transaction(tx, self.private_key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)
            self.w3.eth.wait_for_transaction_receipt(tx_hash)
            return True
            
        except Exception:
            return False