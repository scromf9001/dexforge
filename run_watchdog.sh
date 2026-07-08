#!/bin/bash
# Launches the dexforge Pokemon-data watchdog.
# Auto-commits + pushes changes to data/*.json files to the dexforge GitHub repo.
# Stop with Ctrl+C. If it exits unexpectedly, the window stays open so you can read the error.

clear
echo "===================================="
echo "   Dexforge Watchdog"
echo "===================================="
echo ""
echo "Watching: $(pwd)/data"
echo "Auto-commits + pushes changes to https://github.com/scromf9001/dexforge"
echo "Press Ctrl+C to stop."
echo ""

PYTHON="/c/Users/sebas/AppData/Local/Programs/Python/Python312/python.exe"
"$PYTHON" watchdog_push.py
EXIT_CODE=$?

echo ""
echo "===================================="
echo "Watchdog exited (code: $EXIT_CODE)."
echo "Press Enter to close this window..."
read
