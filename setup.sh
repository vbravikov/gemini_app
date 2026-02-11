#!/usr/bin/env bash

echo "Detecting operating system..."

OS=$(uname -s)

if [[ "$OS" == "Darwin" ]]; then
    echo "Running on macOS"
    PYTHON=python3
    VENV_PYTHON=.venv/bin/python
elif [[ "$OS" == "Linux" ]]; then
    echo "Running on Linux"
    PYTHON=python3
    VENV_PYTHON=.venv/bin/python
elif [[ "$OS" == "MINGW64_NT"* || "$OS" == "MSYS_NT"* || "$OS" == "CYGWIN_NT"* ]]; then
    echo "Running on Windows"
    PYTHON=python
    VENV_PYTHON=.venv/Scripts/python
else
    echo "Unsupported operating system: $OS"
    exit 1
fi

echo "Creating virtual environment..."
$PYTHON -m venv .venv

echo "Upgrading pip..."
$VENV_PYTHON -m pip install --upgrade pip

echo "Installing dependencies..."
$VENV_PYTHON -m pip install -r requirements.txt

echo "Starting server..."
$VENV_PYTHON -m uvicorn gemini_backend:app --reload --port 8000