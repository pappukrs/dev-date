# Phase Plan: Dev-Date Platform

## Phase 0: The Foundation (Architectural Setup) [x]
**Goal:** Setup the monorepo, docker environment, and shared packages.
- [x] Initialize Monorepo (npm workspaces)
- [x] Setup `docker-compose.yml` (Postgres, Redis, RabbitMQ)
- [x] Shared `packages/common` for standard responses, error types, and DTOs.
- [x] Project README and setup guides.

## Phase 1: MVP - The Connection Engine
**Goal:** GitHub-only login and base profile generation with Developer Score.
- **Service: Auth**
    - GitHub OAuth integration.
    - JWT session management.
- **Service: Profile**
    - Syncing GitHub data (repos, commits, stats).
    - Developer Score algorithm (v1).
    - Basic CRUD for profile details.
- **Service: Chat**
    - WebSocket setup with Socket.IO.
    - Basic message persistence & Markdown support.
- **Service: API Gateway**
    - Routing and Auth Middleware.
- **Frontend: Web**
    - Landing page & Dashboard.
    - Profile Discovery (Feed).
    - Chat interface.

## Phase 2: Engagement Layer
**Goal:** Dating mode, matching algorithm, and compatibility tests.
- **Service: Matching**
    - Preference-based filtering.
    - "Swipe" / Connection request logic.
- **Dating Mode Toggle**
    - Privacy settings and dating-specific profiles.
- **Service: Code Compatibility**
    - Coding challenge generator/validator.
    - Compatibility scoring based on "Clean Architecture" vs "Fast & Dirty" etc.

## Phase 3: Community & Gamification [x]
**Goal:** Reputation, project marketplace, and realtime collaboration.
- [x] **Service: Reputation**
    - Gamified levels (Junior → Architect).
- [x] **Service: Project Marketplace**
    - Posting collaboration needs.
- [x] **Service: Media**
    - WebRTC for pair programming and video calls.

## Phase 4: Scaling & Polish
- AI-driven icebreakers.
- Performance optimization (Redis caching).
- Global search and advanced filtering.
