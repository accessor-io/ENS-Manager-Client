# ENS Manager

A command-line tool for managing Ethereum Name Service (ENS) domains.

## Features

- Create and load Ethereum accounts
- Configure network providers
- Resolve ENS names to addresses
- Perform reverse lookups (address to ENS name)
- Get ENS name owners
- Check registration costs
- Register new ENS names
- Renew ENS name registrations
- Set address records
- Set content hashes
- Cross-network ENS resolution

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ens-manager.git
cd ens-manager
```

2. Install dependencies using Poetry:
```bash
poetry install
```

## Usage

Run the ENS Manager in interactive mode:
```bash
poetry run ens-manager
```

The interactive menu will guide you through the following operations:

1. Create new account
2. Load existing account
3. Configure provider
4. Resolve ENS name
5. Reverse lookup
6. Get name owner
7. Check registration cost
8. Register name
9. Renew name
10. Set address record
11. Set content hash

## Configuration

Before using ENS Manager, you need to:

1. Create or load an Ethereum account
2. Configure at least one network provider (e.g., Infura, Alchemy)

## Development

1. Install development dependencies:
```bash
poetry install --with dev
```

2. Run tests:
```bash
poetry run pytest
```

3. Format code:
```bash
poetry run black src tests
poetry run isort src tests
```

4. Run linter:
```bash
poetry run flake8 src tests
```

## License

This project is licensed under the MIT License - see the LICENSE file for details. 