@echo off
title Mise a jour saasykon
echo Pulling latest image...
docker pull ghcr.io/itykon/saasykon-app:latest

echo Stopping old container...
docker stop saasykon-auto 2>nul
docker rm saasykon-auto 2>nul

echo Starting new container...
docker run -d -p 3000:3000 --name saasykon-auto ghcr.io/itykon/saasykon-app:latest

echo Waiting 3 s...
timeout /t 3 /nobreak >nul
echo ✅ Done - http://localhost:3000
start http://localhost:3000