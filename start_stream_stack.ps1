# Start Watchdog
Start-Process "C:\Program Files\Git\git-bash.exe" `
    -ArgumentList "--cd=""C:\Users\sebas\Desktop\Stream Stuff\Pokemon System\dexforge"" -c ""python watchdog_push.py""" 

Start-Sleep -Seconds 2

# Start Mix It Up (use FULL explicit path)
Start-Process "C:\Users\sebas\AppData\Local\MixItUp\MixItUp.exe"