#!/bin/bash

# Quick start script for Ollama + EBP integration (macOS/Linux)

echo ""
echo "========================================"
echo "  EBP Ollama Integration Quick Start"
echo "========================================"
echo ""

# Check if Ollama is installed
echo "[1/4] Checking Ollama installation..."
if ! command -v ollama &> /dev/null; then
    echo ""
    echo "ERROR: Ollama not found!"
    echo ""
    echo "Please install Ollama from: https://ollama.ai/download"
    echo ""
    exit 1
fi
echo "✓ Ollama found"

# Check if Ollama server is running
echo ""
echo "[2/4] Checking Ollama server..."
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo ""
    echo "WARNING: Ollama server not running!"
    echo ""
    echo "Starting Ollama server in background..."
    ollama serve &
    sleep 5
fi
echo "✓ Ollama server running"

# Check if Mistral model is available
echo ""
echo "[3/4] Checking Mistral model..."
if ! ollama list | grep -q mistral; then
    echo ""
    echo "Mistral model not found. Downloading..."
    echo "This may take 5-10 minutes..."
    echo ""
    ollama pull mistral
    if [ $? -ne 0 ]; then
        echo ""
        echo "ERROR: Failed to download Mistral model"
        exit 1
    fi
fi
echo "✓ Mistral model available"

# Build and run backend
echo ""
echo "[4/4] Building and starting backend..."
echo ""
cd backend
mvn clean package -q
if [ $? -ne 0 ]; then
    echo ""
    echo "ERROR: Maven build failed"
    exit 1
fi

echo ""
echo "========================================"
echo "  ✓ Setup Complete!"
echo "========================================"
echo ""
echo "Backend starting on http://localhost:8080"
echo "Ollama running on http://localhost:11434"
echo ""
echo "Open chatbot and ask: \"Predict leave for employee 42\""
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

java -jar target/backend-1.0.0-SNAPSHOT-runner.jar
