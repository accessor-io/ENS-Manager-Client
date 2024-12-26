#!/bin/bash

# Temporarily increase file descriptor limit for this session
ulimit -n 65535

# Load environment variables
set -a
source .env.development
set +a

# Start development server with optimized settings
exec npm run dev 