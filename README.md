# ENS Manager

A comprehensive Ethereum Name Service (ENS) management tool that provides a command-line interface for interacting with ENS names.

## Features

- Interactive menu with arrow key navigation
- Secure account management with encrypted storage
- Multiple provider support (Infura, Alchemy, QuickNode, Custom)
- Multiple wallet support with password protection
- Resolve ENS names to Ethereum addresses
- Reverse resolve Ethereum addresses to ENS names
- Get ENS name owner information
- View resolver contract addresses
- Get TTL values
- Manage text records
- Handle content hashes (IPFS/Swarm)
- View name history

## Installation

```bash
# Install globally
pip install -e .

# Or use directly with Poetry
poetry install
```

## First Run

When you first run the tool, you'll be prompted to create a password. This password will be used to encrypt your configuration file that stores your provider API keys and wallet private keys.

```bash
# Run the interactive menu
ens-manager
```

## Configuration

The tool will guide you through setting up:

1. Provider Configuration:
   - Choose from Infura, Alchemy, QuickNode, or custom provider
   - Enter your API key
   - Name your provider configuration
   - Set as active provider if desired

2. Account Management:
   - Add multiple Ethereum accounts
   - Name each account for easy reference
   - Securely store private keys
   - Switch between accounts easily

All configuration is stored encrypted in `~/.ens-manager/config.enc`

## Usage

The interactive menu provides the following options:

- **Look up ENS information**: Get comprehensive details about an ENS name
- **Resolve ENS name**: Convert ENS name to Ethereum address
- **Reverse resolve**: Convert Ethereum address to ENS name
- **Get owner**: View the owner of an ENS name
- **Get text record**: View specific text records
- **View name history**: See the ownership history of a name
- **Manage providers**: Add/remove/switch between providers
- **Manage accounts**: Add/remove/switch between accounts
- **View configuration**: See current provider and account settings

## Security

- All sensitive information is encrypted using Fernet (symmetric encryption)
- Configuration file is stored with restricted permissions (700)
- Private keys are never stored in plain text
- Single master password protects all configurations

## License

MIT License 