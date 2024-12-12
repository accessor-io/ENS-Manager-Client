"""Tests for ENS Manager."""

import pytest
from src.ens_operations import ENSManager
import os
from unittest.mock import patch, MagicMock

@pytest.fixture
def manager():
    """Create ENS Manager instance for testing."""
    return ENSManager(
        provider_url="https://mainnet.infura.io/v3/test",
        private_key="0x0000000000000000000000000000000000000000000000000000000000000000"
    )

def test_validate_name(manager):
    """Test ENS name validation."""
    # Valid names
    assert manager.validate_name("test.eth")
    assert manager.validate_name("sub.domain.eth")
    assert manager.validate_name("valid-name.eth")
    assert manager.validate_name("123.eth")
    
    # Invalid names
    assert not manager.validate_name("")
    assert not manager.validate_name("invalid")
    assert not manager.validate_name(".eth")
    assert not manager.validate_name("invalid..name.eth")
    assert not manager.validate_name("invalid@name.eth")
    assert not manager.validate_name("-invalid.eth")
    assert not manager.validate_name("invalid-.eth")

@pytest.mark.asyncio
async def test_resolve_name(manager):
    """Test ENS name resolution."""
    with patch('web3.ens.ENS.resolve') as mock_resolve:
        mock_resolve.return_value = "0x1234567890123456789012345678901234567890"
        
        result = await manager.resolve_name("test.eth")
        assert result == "0x1234567890123456789012345678901234567890"
        mock_resolve.assert_called_once_with("test.eth")

@pytest.mark.asyncio
async def test_reverse_resolve(manager):
    """Test reverse ENS resolution."""
    with patch('web3.ens.ENS.reverse') as mock_reverse:
        mock_reverse.return_value = "test.eth"
        
        result = await manager.reverse_resolve("0x1234567890123456789012345678901234567890")
        assert result == "test.eth"
        mock_reverse.assert_called_once_with("0x1234567890123456789012345678901234567890")

@pytest.mark.asyncio
async def test_get_owner(manager):
    """Test getting ENS name owner."""
    with patch('web3.ens.ENS.owner') as mock_owner:
        mock_owner.return_value = "0x1234567890123456789012345678901234567890"
        
        result = await manager.get_owner("test.eth")
        assert result == "0x1234567890123456789012345678901234567890"
        mock_owner.assert_called_once_with("test.eth")

@pytest.mark.asyncio
async def test_get_text_record(manager):
    """Test getting ENS text record."""
    mock_resolver = MagicMock()
    mock_resolver.functions.text.return_value.call.return_value = "test@example.com"
    
    with patch('web3.ens.ENS.resolver') as mock_get_resolver:
        mock_get_resolver.return_value = mock_resolver
        
        result = await manager.get_text_record("test.eth", "email")
        assert result == "test@example.com"

@pytest.mark.asyncio
async def test_batch_resolve(manager):
    """Test batch ENS name resolution."""
    with patch('web3.ens.ENS.resolve') as mock_resolve:
        mock_resolve.side_effect = [
            "0x1111111111111111111111111111111111111111",
            "0x2222222222222222222222222222222222222222",
            None
        ]
        
        names = ["one.eth", "two.eth", "nonexistent.eth"]
        results = await manager.batch_resolve(names)
        
        assert results == {
            "one.eth": "0x1111111111111111111111111111111111111111",
            "two.eth": "0x2222222222222222222222222222222222222222",
            "nonexistent.eth": None
        }
        assert mock_resolve.call_count == 3

@pytest.mark.asyncio
async def test_set_address(manager):
    """Test setting ENS name address."""
    with patch('web3.ens.ENS.setup_address') as mock_setup_address:
        mock_setup_address.return_value = True
        
        result = await manager.set_address(
            "test.eth",
            "0x1234567890123456789012345678901234567890"
        )
        assert result is True
        mock_setup_address.assert_called_once()

def test_initialization_without_provider():
    """Test initialization without provider URL."""
    with pytest.raises(ValueError):
        ENSManager(provider_url=None)

def test_initialization_with_env_vars():
    """Test initialization with environment variables."""
    with patch.dict(os.environ, {
        'ETH_PROVIDER_URL': 'https://mainnet.infura.io/v3/test',
        'ETH_PRIVATE_KEY': '0x0000000000000000000000000000000000000000000000000000000000000000'
    }):
        manager = ENSManager()
        assert manager.provider_url == 'https://mainnet.infura.io/v3/test'
        assert manager.private_key == '0x0000000000000000000000000000000000000000000000000000000000000000'
