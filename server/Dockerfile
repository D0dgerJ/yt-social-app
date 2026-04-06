FROM node:20-bookworm-slim

WORKDIR /app

# Системные зависимости для whisper
RUN apt-get update && apt-get install -y \
    python3 \
    python3-venv \
    python3-pip \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Node dependencies without postinstall
COPY package*.json ./
RUN npm ci --ignore-scripts

# Source code
COPY . .

# Python venv for whisper
RUN python3 -m venv /opt/venv
RUN /opt/venv/bin/pip install --upgrade pip
RUN /opt/venv/bin/pip install openai-whisper

# Prisma + build
RUN npm run prisma:generate
RUN npm run build

ENV PATH="/opt/venv/bin:$PATH"

EXPOSE 5000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/interfaces/server.js"]