@echo off
docker pull ghcr.io/itykon/saasykon-app:latest
docker stop saasykon-auto 2>nul
docker rm saasykon-auto 2>nul
docker run -d -p 3000:3000 --name saasykon-auto ghcr.io/itykon/saasykon-app:latest
echo ✅ Derniere version lancee sur http://localhost:3000
start http://localhost:3000