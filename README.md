# Dev-Date: Developer Connection + Dating Platform

A platform where real developers connect based on code quality and interests.

## Features
- GitHub-only Login
- Developer Quality Score
- Smart Matching (Tech stack & experience)
- Real-time Chat
- Dating Mode (Optional)

## Project Structure
```text
.
├── apps/
│   ├── auth-service/     # GitHub OAuth & Session
│   ├── profile-service/  # GitHub data sync & Score calculation
│   ├── chat-service/     # Real-time messaging
│   └── web/              # Next.js Frontend
├── packages/
│   └── common/           # Shared types, constants, and utils
└── docker-compose.yml    # Infrastructure (Postgres, Redis, RabbitMQ)
```

## Getting Started

### Prerequisites
- Node.js (v18+)
- Docker & Docker Compose

### Installation
1. Install dependencies:
   ```bash
   npm install
   ```

2. Start infrastructure:
   ```bash
   docker-compose up -d
   ```

3. Run development mode:
   ```bash
   npm run dev
   ```

## Documentation
- [Phase Plan](file:///media/anything/AI-lab/Dev-Date/phase-plan.md)
- [System Architecture](file:///media/anything/AI-lab/Dev-Date/plan.md)
