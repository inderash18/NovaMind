#!/usr/bin/env bash

# AetherOS Developer Bootstrap and Diagnostic Suite
# Set up virtual environments, install dependencies, and run local engine probes.

set -euo pipefail

# Output formatting helpers
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "    █▀▀█ █▀▀ ▀▀█▀▀ █  █ █▀▀ █▀▀█ █▀▀█ █▀▀"
echo "    █▄▄█ █▀▀   █   █▀▀█ █▀▀ █▄▄▀ █  █ ▀▀█"
echo "    ▀  ▀ ▀▀▀   ▀   ▀  ▀ ▀▀▀ ▀ ▀▀ ▀▀▀▀ ▀▀▀"
echo -e "   -- Sovereign Local-First AI Operating System --${NC}\n"

echo -e "${BLUE}[1/5] Verifying System Runtime Pre-requisites...${NC}"

# Check Python 3.11+
if command -v python3 &>/dev/null; then
    PYTHON_CMD="python3"
elif command -v python &>/dev/null; then
    PYTHON_CMD="python"
else
    echo -e "${RED}Error: Python is not installed. Please install Python 3.11+ before continuing.${NC}"
    exit 1
fi

PYTHON_VERSION=$($PYTHON_CMD -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
MAJOR=$(echo "$PYTHON_VERSION" | cut -d. -f1)
MINOR=$(echo "$PYTHON_VERSION" | cut -d. -f2)

if [ "$MAJOR" -lt 3 ] || { [ "$MAJOR" -eq 3 ] && [ "$MINOR" -lt 11 ]; }; then
    echo -e "${YELLOW}Warning: AetherOS requires Python 3.11+. Detected older version: $PYTHON_VERSION${NC}"
else
    echo -e "${GREEN}✓ Python version approved: $PYTHON_VERSION${NC}"
fi

# Check Node.js 18+
if command -v node &>/dev/null; then
    NODE_VERSION=$(node -v | cut -d'v' -f2)
    echo -e "${GREEN}✓ Node.js version approved: v$NODE_VERSION${NC}"
else
    echo -e "${YELLOW}Warning: Node.js is missing. Please install Node.js 18+ to run the Next.js frontend natively.${NC}"
fi

echo -e "\n${BLUE}[2/5] Bootstrapping Backend Environment & pip Dependencies...${NC}"

# Navigate to backend directory or project root
cd "$(dirname "$0")/.."

# Build python virtual environment if missing
if [ ! -d "backend/.venv" ]; then
    echo -e "Creating Python virtual environment in backend/.venv..."
    $PYTHON_CMD -m venv backend/.venv
    echo -e "${GREEN}✓ Virtual environment initialized.${NC}"
else
    echo -e "${GREEN}✓ Virtual environment already cached.${NC}"
fi

# Activate virtual environment
# Support Git Bash, WSL, standard bash
if [ -f "backend/.venv/bin/activate" ]; then
    source backend/.venv/bin/activate
elif [ -f "backend/.venv/Scripts/activate" ]; then
    source backend/.venv/Scripts/activate
fi

echo "Upgrading pip and installing production-grade framework packages..."
pip install --upgrade pip
pip install fastapi uvicorn pydantic pydantic-settings httpx websockets structlog pytest

echo -e "${GREEN}✓ Backend pip packages installed successfully.${NC}"

echo -e "\n${BLUE}[3/5] Setting up Local Environment Configs...${NC}"

# Prepare default environment settings file if missing
if [ ! -f ".env" ]; then
    echo "Creating .env configuration file from templates..."
    cat <<EOT > .env
# AetherOS Local Developer Configurations
DEBUG=true
JWT_SECRET=super-secret-aetheros-encryption-key-that-is-long-and-random-3948293849
OLLAMA_ENDPOINT=http://localhost:11434
LMSTUDIO_ENDPOINT=http://localhost:1234
EOT
    echo -e "${GREEN}✓ .env configuration initialized.${NC}"
else
    echo -e "${GREEN}✓ .env file already exists.${NC}"
fi

echo -e "\n${BLUE}[4/5] Probing Local Model inference Engines...${NC}"

# Probing Ollama (11434)
echo -n "Probing Ollama Local Server (port 11434)... "
if curl -s -f http://localhost:11434 &>/dev/null; then
    echo -e "${GREEN}ONLINE${NC}"
    echo "Querying Ollama cached model list..."
    curl -s http://localhost:11434/api/tags | $PYTHON_CMD -c "
import sys, json
try:
    data = json.load(sys.stdin)
    models = [m['name'] for m in data.get('models', [])]
    if models:
        print('  ✓ Available Local Models: ' + ', '.join(models))
    else:
        print('  ! Warning: Ollama is running but has no models pulled. Run: ollama pull qwen2.5:7b')
except Exception as e:
    print('  ! Failed to parse models: ' + str(e))
"
else
    echo -e "${YELLOW}OFFLINE${NC} (Port 11434 closed. Start Ollama on your host to enable local inference.)"
fi

# Probing LM Studio (1234)
echo -n "Probing LM Studio Local Server (port 1234)... "
if curl -s -f http://localhost:1234 &>/dev/null; then
    echo -e "${GREEN}ONLINE${NC}"
    echo "Querying LM Studio active model configurations..."
    curl -s http://localhost:1234/v1/models | $PYTHON_CMD -c "
import sys, json
try:
    data = json.load(sys.stdin)
    models = [m['id'] for m in data.get('data', [])]
    if models:
        print('  ✓ Active Models: ' + ', '.join(models))
    else:
        print('  ! Active: LM Studio is up but no models are currently loaded in its UI.')
except Exception as e:
    print('  ! Failed to query models: ' + str(e))
"
else
    echo -e "${YELLOW}OFFLINE${NC} (Port 1234 closed. Load model servers in LM Studio UI to enable failover paths.)"
fi

echo -e "\n${BLUE}[5/5] Launch Diagnostics Summary${NC}"
echo -e "=========================================================="
echo -e "${GREEN}✓ Foundation Node Bootstrap Complete!${NC}"
echo -e "To execute the AetherOS Sovereign Local Gateway natively:"
echo -e "  1. Run Backend Server:   ${CYAN}python -m uvicorn backend.main:app --reload --port 8000${NC}"
echo -e "  2. Run Frontend Client:  ${CYAN}npm run dev (inside frontend/ directory)${NC}"
echo -e "  3. Open Dashboard Page:  ${CYAN}http://localhost:3000${NC}"
echo -e "=========================================================="
echo -e "\nAetherOS is ready to run entirely on your private hardware."
