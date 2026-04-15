@echo off
REM Quick start script for Ollama + EBP integration

echo.
echo ========================================
echo  EBP Ollama Integration Quick Start
echo ========================================
echo.

REM Check if Ollama is installed
echo [1/4] Checking Ollama installation...
where ollama >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Ollama not found!
    echo.
    echo Please install Ollama from: https://ollama.ai/download/windows
    echo.
    pause
    exit /b 1
)
echo ✓ Ollama found

REM Check if Ollama server is running
echo.
echo [2/4] Checking Ollama server...
curl -s http://localhost:11434/api/tags >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo WARNING: Ollama server not running!
    echo.
    echo Starting Ollama server...
    start cmd /k "ollama serve"
    timeout /t 5 /nobreak
)
echo ✓ Ollama server running

REM Check if Mistral model is available
echo.
echo [3/4] Checking Mistral model...
ollama list | findstr mistral >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo Mistral model not found. Downloading...
    echo This may take 5-10 minutes...
    echo.
    ollama pull mistral
    if %errorlevel% neq 0 (
        echo.
        echo ERROR: Failed to download Mistral model
        pause
        exit /b 1
    )
)
echo ✓ Mistral model available

REM Build and run backend
echo.
echo [4/4] Building and starting backend...
echo.
cd backend
mvn clean package -q
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Maven build failed
    pause
    exit /b 1
)

echo.
echo ========================================
echo  ✓ Setup Complete!
echo ========================================
echo.
echo Backend starting on http://localhost:8080
echo Ollama running on http://localhost:11434
echo.
echo Open chatbot and ask: "Predict leave for employee 42"
echo.
echo Press Ctrl+C to stop the server
echo.

java -jar target/backend-1.0.0-SNAPSHOT-runner.jar
