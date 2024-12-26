"""Cross-network ENS resolution."""

from typing import Dict, List, Optional, Any
from web3 import Web3
from eth_utils import is_address, to_checksum_address
import asyncio
from datetime import datetime, timezone

from .network_manager import NetworkManager

class CrossNetworkResolver:
    """Handle ENS resolution across different networks."""
    
    def __init__(self, network_manager: NetworkManager):
        """Initialize cross-network resolver.
        
        Args:
            network_manager: Network manager instance
        """
        self.network_manager = network_manager
    
    async def resolve_name_all_networks(self, name: str) -> Dict[str, Optional[str]]:
        """Resolve ENS name across all connected networks.
        
        Args:
            name: ENS name to resolve
            
        Returns:
            Dict mapping network names to resolved addresses
        """
        results = {}
        
        for network in self.network_manager.get_available_networks():
            web3 = self.network_manager.get_web3(network)
            if not web3:
                continue
                
            try:
                address = web3.ens.address(name)
                results[network] = address if address else None
            except Exception:
                results[network] = None
        
        return results
    
    async def reverse_lookup_all_networks(self, address: str) -> Dict[str, Optional[str]]:
        """Perform reverse lookup across all connected networks.
        
        Args:
            address: Ethereum address to look up
            
        Returns:
            Dict mapping network names to ENS names
        """
        if not is_address(address):
            return {}
            
        results = {}
        address = to_checksum_address(address)
        
        for network in self.network_manager.get_available_networks():
            web3 = self.network_manager.get_web3(network)
            if not web3:
                continue
                
            try:
                name = web3.ens.name(address)
                results[network] = name if name else None
            except Exception:
                results[network] = None
        
        return results
    
    async def get_owner_all_networks(self, name: str) -> Dict[str, Optional[str]]:
        """Get ENS name owner across all connected networks.
        
        Args:
            name: ENS name to check
            
        Returns:
            Dict mapping network names to owner addresses
        """
        results = {}
        
        for network in self.network_manager.get_available_networks():
            web3 = self.network_manager.get_web3(network)
            if not web3:
                continue
                
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
                results[network] = owner if owner != "0x0000000000000000000000000000000000000000" else None
            except Exception:
                results[network] = None
        
        return results
    
    async def get_resolver_all_networks(self, name: str) -> Dict[str, Optional[str]]:
        """Get ENS name resolver across all connected networks.
        
        Args:
            name: ENS name to check
            
        Returns:
            Dict mapping network names to resolver addresses
        """
        results = {}
        
        for network in self.network_manager.get_available_networks():
            web3 = self.network_manager.get_web3(network)
            if not web3:
                continue
                
            try:
                node = web3.ens.namehash(name)
                registry = web3.eth.contract(
                    address="0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e",
                    abi=[{
                        "inputs": [{"name": "node", "type": "bytes32"}],
                        "name": "resolver",
                        "outputs": [{"name": "", "type": "address"}],
                        "type": "function"
                    }]
                )
                resolver = registry.functions.resolver(node).call()
                results[network] = resolver if resolver != "0x0000000000000000000000000000000000000000" else None
            except Exception:
                results[network] = None
        
        return results
    
    async def get_content_hash_all_networks(self, name: str) -> Dict[str, Optional[str]]:
        """Get ENS name content hash across all connected networks.
        
        Args:
            name: ENS name to check
            
        Returns:
            Dict mapping network names to content hashes
        """
        results = {}
        
        for network in self.network_manager.get_available_networks():
            web3 = self.network_manager.get_web3(network)
            if not web3:
                continue
                
            try:
                node = web3.ens.namehash(name)
                resolver_address = web3.ens.resolver(name)
                if not resolver_address:
                    results[network] = None
                    continue
                    
                resolver = web3.eth.contract(
                    address=resolver_address,
                    abi=[{
                        "inputs": [{"name": "node", "type": "bytes32"}],
                        "name": "contenthash",
                        "outputs": [{"name": "", "type": "bytes"}],
                        "type": "function"
                    }]
                )
                content_hash = resolver.functions.contenthash(node).call()
                results[network] = content_hash if content_hash else None
            except Exception:
                results[network] = None
        
        return results 