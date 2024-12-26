"""ENS operations module."""

from typing import Dict, List, Optional, Any
from web3 import Web3
from eth_utils import is_address, to_checksum_address
import asyncio
from datetime import datetime, timezone
from decimal import Decimal

from .network_manager import NetworkManager
from .cross_network_resolver import CrossNetworkResolver

class ENSOperations:
    """Handle ENS operations."""
    
    def __init__(self, network_manager: NetworkManager):
        """Initialize ENS operations.
        
        Args:
            network_manager: Network manager instance
        """
        self.network_manager = network_manager
        self.cross_resolver = CrossNetworkResolver(network_manager)
        
    async def resolve_name(self, name: str, network: Optional[str] = None) -> Optional[str]:
        """Resolve ENS name to address.
        
        Args:
            name: ENS name to resolve
            network: Optional network to use
            
        Returns:
            Resolved address or None
        """
        if network:
            web3 = self.network_manager.get_web3(network)
            if not web3:
                return None
            try:
                return web3.ens.address(name)
            except Exception:
                return None
        
        results = await self.cross_resolver.resolve_name_all_networks(name)
        return next((addr for addr in results.values() if addr), None)
        
    async def reverse_lookup(self, address: str, network: Optional[str] = None) -> Optional[str]:
        """Perform reverse lookup of address to ENS name.
        
        Args:
            address: Ethereum address
            network: Optional network to use
            
        Returns:
            ENS name or None
        """
        if not is_address(address):
            return None
            
        address = to_checksum_address(address)
        
        if network:
            web3 = self.network_manager.get_web3(network)
            if not web3:
                return None
            try:
                return web3.ens.name(address)
            except Exception:
                return None
                
        results = await self.cross_resolver.reverse_lookup_all_networks(address)
        return next((name for name in results.values() if name), None)
        
    async def get_owner(self, name: str, network: Optional[str] = None) -> Optional[str]:
        """Get owner of ENS name.
        
        Args:
            name: ENS name
            network: Optional network to use
            
        Returns:
            Owner address or None
        """
        if network:
            web3 = self.network_manager.get_web3(network)
            if not web3:
                return None
            try:
                node = web3.ens.namehash(name)
                registry = web3.eth.contract(
                    address="0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e",
                    abi=[{
                        "inputs": [{"name": "node", "type": "bytes32"}],
                        "name": "owner",
                        "outputs": [{"name": "", "type": "address"}],
                        "type": "function"
                    }]
                )
                owner = registry.functions.owner(node).call()
                return owner if owner != "0x0000000000000000000000000000000000000000" else None
            except Exception:
                return None
                
        results = await self.cross_resolver.get_owner_all_networks(name)
        return next((owner for owner in results.values() if owner), None)
        
    async def get_registration_cost(self, name: str, duration_years: int, network: str) -> Optional[Decimal]:
        """Get cost to register ENS name.
        
        Args:
            name: ENS name to register
            duration_years: Registration duration in years
            network: Network to check on
            
        Returns:
            Registration cost in ETH or None
        """
        web3 = self.network_manager.get_web3(network)
        if not web3:
            return None
            
        try:
            # Get controller contract
            controller = web3.eth.contract(
                address="0x283Af0B28c62C092C9727F1Ee09c02CA627EB7F5",
                abi=[{
                    "inputs": [
                        {"name": "name", "type": "string"},
                        {"name": "duration", "type": "uint256"}
                    ],
                    "name": "rentPrice",
                    "outputs": [{"name": "", "type": "uint256"}],
                    "type": "function"
                }]
            )
            
            # Calculate registration cost
            duration_seconds = duration_years * 365 * 24 * 60 * 60
            cost_wei = controller.functions.rentPrice(name, duration_seconds).call()
            return Decimal(cost_wei) / Decimal(10**18)
        except Exception:
            return None
            
    async def register_name(self, name: str, owner_address: str, duration_years: int, network: str) -> Optional[str]:
        """Register ENS name.
        
        Args:
            name: ENS name to register
            owner_address: Address that will own the name
            duration_years: Registration duration in years
            network: Network to register on
            
        Returns:
            Transaction hash or None
        """
        web3 = self.network_manager.get_web3(network)
        if not web3:
            return None
            
        try:
            # Get controller contract
            controller = web3.eth.contract(
                address="0x283Af0B28c62C092C9727F1Ee09c02CA627EB7F5",
                abi=[{
                    "inputs": [
                        {"name": "name", "type": "string"},
                        {"name": "owner", "type": "address"},
                        {"name": "duration", "type": "uint256"}
                    ],
                    "name": "register",
                    "outputs": [],
                    "type": "function"
                }]
            )
            
            # Build transaction
            duration_seconds = duration_years * 365 * 24 * 60 * 60
            tx = controller.functions.register(
                name,
                owner_address,
                duration_seconds
            ).build_transaction({
                'from': owner_address,
                'gas': 500000,
                'gasPrice': web3.eth.gas_price,
                'nonce': web3.eth.get_transaction_count(owner_address)
            })
            
            # Sign and send transaction
            signed_tx = web3.eth.account.sign_transaction(tx, self.network_manager.get_private_key())
            tx_hash = web3.eth.send_raw_transaction(signed_tx.rawTransaction)
            return web3.to_hex(tx_hash)
        except Exception:
            return None
            
    async def renew_name(self, name: str, duration_years: int, network: str) -> Optional[str]:
        """Renew ENS name registration.
        
        Args:
            name: ENS name to renew
            duration_years: Renewal duration in years
            network: Network to renew on
            
        Returns:
            Transaction hash or None
        """
        web3 = self.network_manager.get_web3(network)
        if not web3:
            return None
            
        try:
            # Get controller contract
            controller = web3.eth.contract(
                address="0x283Af0B28c62C092C9727F1Ee09c02CA627EB7F5",
                abi=[{
                    "inputs": [
                        {"name": "name", "type": "string"},
                        {"name": "duration", "type": "uint256"}
                    ],
                    "name": "renew",
                    "outputs": [],
                    "type": "function"
                }]
            )
            
            # Build transaction
            duration_seconds = duration_years * 365 * 24 * 60 * 60
            tx = controller.functions.renew(
                name,
                duration_seconds
            ).build_transaction({
                'from': web3.eth.default_account,
                'gas': 500000,
                'gasPrice': web3.eth.gas_price,
                'nonce': web3.eth.get_transaction_count(web3.eth.default_account)
            })
            
            # Sign and send transaction
            signed_tx = web3.eth.account.sign_transaction(tx, self.network_manager.get_private_key())
            tx_hash = web3.eth.send_raw_transaction(signed_tx.rawTransaction)
            return web3.to_hex(tx_hash)
        except Exception:
            return None
            
    async def set_address(self, name: str, address: str, network: str) -> Optional[str]:
        """Set address for ENS name.
        
        Args:
            name: ENS name
            address: Ethereum address to set
            network: Network to use
            
        Returns:
            Transaction hash or None
        """
        if not is_address(address):
            return None
            
        web3 = self.network_manager.get_web3(network)
        if not web3:
            return None
            
        try:
            # Get resolver
            resolver_address = web3.ens.resolver(name)
            if not resolver_address:
                return None
                
            resolver = web3.eth.contract(
                address=resolver_address,
                abi=[{
                    "inputs": [
                        {"name": "node", "type": "bytes32"},
                        {"name": "addr", "type": "address"}
                    ],
                    "name": "setAddr",
                    "outputs": [],
                    "type": "function"
                }]
            )
            
            # Build transaction
            node = web3.ens.namehash(name)
            tx = resolver.functions.setAddr(
                node,
                to_checksum_address(address)
            ).build_transaction({
                'from': web3.eth.default_account,
                'gas': 500000,
                'gasPrice': web3.eth.gas_price,
                'nonce': web3.eth.get_transaction_count(web3.eth.default_account)
            })
            
            # Sign and send transaction
            signed_tx = web3.eth.account.sign_transaction(tx, self.network_manager.get_private_key())
            tx_hash = web3.eth.send_raw_transaction(signed_tx.rawTransaction)
            return web3.to_hex(tx_hash)
        except Exception:
            return None
            
    async def set_content_hash(self, name: str, content_hash: str, network: str) -> Optional[str]:
        """Set content hash for ENS name.
        
        Args:
            name: ENS name
            content_hash: Content hash to set
            network: Network to use
            
        Returns:
            Transaction hash or None
        """
        web3 = self.network_manager.get_web3(network)
        if not web3:
            return None
            
        try:
            # Get resolver
            resolver_address = web3.ens.resolver(name)
            if not resolver_address:
                return None
                
            resolver = web3.eth.contract(
                address=resolver_address,
                abi=[{
                    "inputs": [
                        {"name": "node", "type": "bytes32"},
                        {"name": "hash", "type": "bytes"}
                    ],
                    "name": "setContenthash",
                    "outputs": [],
                    "type": "function"
                }]
            )
            
            # Build transaction
            node = web3.ens.namehash(name)
            tx = resolver.functions.setContenthash(
                node,
                content_hash
            ).build_transaction({
                'from': web3.eth.default_account,
                'gas': 500000,
                'gasPrice': web3.eth.gas_price,
                'nonce': web3.eth.get_transaction_count(web3.eth.default_account)
            })
            
            # Sign and send transaction
            signed_tx = web3.eth.account.sign_transaction(tx, self.network_manager.get_private_key())
            tx_hash = web3.eth.send_raw_transaction(signed_tx.rawTransaction)
            return web3.to_hex(tx_hash)
        except Exception:
            return None