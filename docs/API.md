# ENS Manager API Documentation

## Core Module: `ens_operations.py`

### Class: `ENSManager`

The main class for interacting with the Ethereum Name Service (ENS).

#### Initialization

```python
manager = ENSManager(provider_url: Optional[str] = None, private_key: Optional[str] = None)
```

- `provider_url`: Ethereum node provider URL (e.g., Infura endpoint)
- `private_key`: Private key for transactions (optional)

Environment variables:
- `ETH_PROVIDER_URL`: Default provider URL
- `ETH_PRIVATE_KEY`: Default private key

#### Methods

##### Name Resolution

```python
async def resolve_name(name: str) -> Optional[str]
```
Resolve ENS name to Ethereum address.

```python
async def reverse_resolve(address: str) -> Optional[str]
```
Reverse resolve Ethereum address to ENS name.

##### Record Management

```python
async def get_owner(name: str) -> Optional[str]
```
Get owner of ENS name.

```python
async def get_resolver(name: str) -> Optional[str]
```
Get resolver contract address for ENS name.

```python
async def get_ttl(name: str) -> Optional[int]
```
Get TTL for ENS name.

```python
async def get_text_record(name: str, key: str) -> Optional[str]
```
Get text record for ENS name.

```python
async def get_content_hash(name: str) -> Optional[str]
```
Get content hash for ENS name.

##### Record Updates

```python
async def set_address(name: str, address: str) -> bool
```
Set address for ENS name. Requires private key.

```python
async def set_text_record(name: str, key: str, value: str) -> bool
```
Set text record for ENS name. Requires private key.

```python
async def set_content_hash(name: str, content_hash: str) -> bool
```
Set content hash for ENS name. Requires private key.

##### Batch Operations

```python
async def batch_resolve(names: List[str]) -> Dict[str, Optional[str]]
```
Resolve multiple ENS names in parallel.

```python
async def batch_reverse_resolve(addresses: List[str]) -> Dict[str, Optional[str]]
```
Reverse resolve multiple addresses in parallel.

##### Validation

```python
def validate_name(name: str) -> bool
```
Validate ENS name format.

## CLI Interface: `cli.py`

### Commands

```bash
# Resolve ENS name
ens-manager resolve NAME

# Reverse resolve address
ens-manager reverse ADDRESS

# Get owner
ens-manager owner NAME

# Get text record
ens-manager get-text NAME KEY

# Set text record
ens-manager set-text NAME KEY VALUE

# Set address
ens-manager set-address NAME ADDRESS

# Batch resolve names
ens-manager batch-resolve NAME1 NAME2 ...

# Batch reverse resolve addresses
ens-manager batch-reverse ADDRESS1 ADDRESS2 ...

# Validate name
ens-manager validate NAME

# Get all information
ens-manager info NAME
```

### Environment Setup

Create a `.env` file:

```env
ETH_PROVIDER_URL=https://mainnet.infura.io/v3/YOUR-PROJECT-ID
ETH_PRIVATE_KEY=your-private-key  # Optional, needed for transactions
```

## Error Handling

All methods handle errors gracefully and:
- Return `None` for failed lookups
- Return `False` for failed operations
- Print error messages to console
- Raise `ValueError` for invalid initialization

## Best Practices

1. Always validate ENS names before operations
2. Use batch operations for multiple queries
3. Handle async operations properly
4. Secure private keys using environment variables
5. Check operation results before proceeding
