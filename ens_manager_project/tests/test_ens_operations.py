"""Tests for ENS operations."""

import pytest
from unittest.mock import Mock, patch
from web3 import Web3

from src.core.ens_operations import ENSOperations
from src.core.network_manager import NetworkManager
from src.core.errors import ENSOperationError

@pytest.fixture
def network_manager():
    """Create a mock network manager."""
    manager = Mock(spec=NetworkManager)
    manager.get_web3.return_value = Mock(spec=Web3)
    return manager

@pytest.fixture
def ens_ops(network_manager):
    """Create ENS operations instance."""
    return ENSOperations(network_manager)

@pytest.mark.asyncio
async def test_resolve_name(ens_ops, network_manager):
    """Test name resolution."""
    # Mock Web3 instance
    web3_mock = network_manager.get_web3.return_value
    web3_mock.ens.address.return_value = "0x1234567890123456789012345678901234567890"
    
    # Test successful resolution
    address = await ens_ops.resolve_name("test.eth", "mainnet")
    assert address == "0x1234567890123456789012345678901234567890"
    
    # Test failed resolution
    web3_mock.ens.address.return_value = None
    address = await ens_ops.resolve_name("nonexistent.eth", "mainnet")
    assert address is None

@pytest.mark.asyncio
async def test_reverse_lookup(ens_ops, network_manager):
    """Test reverse lookup."""
    # Mock Web3 instance
    web3_mock = network_manager.get_web3.return_value
    web3_mock.ens.name.return_value = "test.eth"
    
    # Test successful lookup
    name = await ens_ops.reverse_lookup("0x1234567890123456789012345678901234567890", "mainnet")
    assert name == "test.eth"
    
    # Test failed lookup
    web3_mock.ens.name.return_value = None
    name = await ens_ops.reverse_lookup("0x1234567890123456789012345678901234567890", "mainnet")
    assert name is None

@pytest.mark.asyncio
async def test_get_owner(ens_ops, network_manager):
    """Test getting owner."""
    # Mock Web3 instance
    web3_mock = network_manager.get_web3.return_value
    web3_mock.ens.owner.return_value = "0x1234567890123456789012345678901234567890"
    
    # Test successful owner lookup
    owner = await ens_ops.get_owner("test.eth", "mainnet")
    assert owner == "0x1234567890123456789012345678901234567890"
    
    # Test failed owner lookup
    web3_mock.ens.owner.return_value = "0x0000000000000000000000000000000000000000"
    owner = await ens_ops.get_owner("nonexistent.eth", "mainnet")
    assert owner is None

@pytest.mark.asyncio
async def test_get_registration_cost(ens_ops, network_manager):
    """Test getting registration cost."""
    # Mock Web3 instance and contract
    web3_mock = network_manager.get_web3.return_value
    contract_mock = Mock()
    contract_mock.functions.rentPrice.return_value.call.return_value = 1000000000000000000  # 1 ETH in wei
    web3_mock.eth.contract.return_value = contract_mock
    
    # Test successful cost lookup
    cost = await ens_ops.get_registration_cost("test.eth", 1, "mainnet")
    assert cost == 1.0  # 1 ETH
    
    # Test failed cost lookup
    contract_mock.functions.rentPrice.side_effect = Exception("Contract error")
    cost = await ens_ops.get_registration_cost("test.eth", 1, "mainnet")
    assert cost is None

@pytest.mark.asyncio
async def test_register_name(ens_ops, network_manager):
    """Test name registration."""
    # Mock Web3 instance and contract
    web3_mock = network_manager.get_web3.return_value
    contract_mock = Mock()
    tx_hash = "0x1234567890123456789012345678901234567890123456789012345678901234"
    contract_mock.functions.register.return_value.build_transaction.return_value = {
        'to': '0x1234567890123456789012345678901234567890',
        'data': '0x',
        'value': 1000000000000000000,
        'gas': 500000,
        'gasPrice': 20000000000,
        'nonce': 0
    }
    web3_mock.eth.contract.return_value = contract_mock
    web3_mock.eth.account.sign_transaction.return_value.rawTransaction = b'raw_tx'
    web3_mock.eth.send_raw_transaction.return_value = tx_hash
    web3_mock.to_hex.return_value = tx_hash
    
    # Test successful registration
    result = await ens_ops.register_name(
        "test.eth",
        "0x1234567890123456789012345678901234567890",
        1,
        "mainnet"
    )
    assert result == tx_hash
    
    # Test failed registration
    contract_mock.functions.register.side_effect = Exception("Contract error")
    result = await ens_ops.register_name(
        "test.eth",
        "0x1234567890123456789012345678901234567890",
        1,
        "mainnet"
    )
    assert result is None 