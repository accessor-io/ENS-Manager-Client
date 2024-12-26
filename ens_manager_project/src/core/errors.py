"""Error handling module for ENS Manager."""

class ENSManagerError(Exception):
    """Base exception class for ENS Manager."""
    pass

class NetworkError(ENSManagerError):
    """Raised when there are network-related issues."""
    pass

class AccountError(ENSManagerError):
    """Raised when there are account-related issues."""
    pass

class ProviderError(ENSManagerError):
    """Raised when there are provider-related issues."""
    pass

class ENSOperationError(ENSManagerError):
    """Raised when ENS operations fail."""
    pass

class ValidationError(ENSManagerError):
    """Raised when validation fails."""
    pass

class ConfigurationError(ENSManagerError):
    """Raised when there are configuration issues."""
    pass 