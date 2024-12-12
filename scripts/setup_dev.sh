#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Setting up ENS Manager development environment...${NC}\n"

# Check if Poetry is installed
if ! command -v poetry &> /dev/null; then
    echo -e "${RED}Poetry not found. Installing Poetry...${NC}"
    curl -sSL https://install.python-poetry.org | python3 -
    export PATH="/home/$USER/.local/bin:$PATH"
fi

# Install dependencies
echo -e "\n${BLUE}Installing project dependencies...${NC}"
poetry install

# Set up pre-commit hooks
echo -e "\n${BLUE}Setting up pre-commit hooks...${NC}"
poetry run pre-commit install

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo -e "\n${BLUE}Creating .env file...${NC}"
    cat > .env << EOL
# Ethereum provider URL (required)
ETH_PROVIDER_URL=https://mainnet.infura.io/v3/YOUR-PROJECT-ID

# Private key for transactions (optional)
# ETH_PRIVATE_KEY=your-private-key

# Logging configuration
LOG_LEVEL=INFO
LOG_FILE=ens_operations.log
EOL
    echo -e "${GREEN}Created .env file. Please update with your settings.${NC}"
fi

# Run tests to verify setup
echo -e "\n${BLUE}Running tests...${NC}"
poetry run pytest

# Final instructions
echo -e "\n${GREEN}Development environment setup complete!${NC}"
echo -e "\nNext steps:"
echo -e "1. Update .env file with your Ethereum provider URL"
echo -e "2. Run 'poetry shell' to activate the virtual environment"
echo -e "3. Use 'poetry run ens-manager' to run the CLI"
echo -e "4. Run 'poetry run pytest' to run tests"
echo -e "\nHappy coding! 🚀"