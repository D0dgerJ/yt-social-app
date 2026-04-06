# Docker launch

## Start
```bash
cp .env.docker.example .env.docker
docker-compose --env-file .env.docker up --build -d

## Stop
docker-compose down

## Logs

docker-compose logs -f
Open
App: http://YOUR_SERVER_IP
API health: http://YOUR_SERVER_IP/api/v1/health
Notes
Microphone access requires HTTPS or localhost because browser media APIs need a secure context.
Backend, frontend, and postgres run in Docker.