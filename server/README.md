# yt-social-app

# Clean Architecture Structure for Social Network Backend

```
/social-backend
├── src
│   ├── domain
│   │   ├── entities          # Core business models: User, Post, Comment, etc.
│   │   ├── repositories      # Interface definitions (e.g. IUserRepository)
│   │   └── usecases          # Application-specific logic (FollowUser, CreatePost, etc.)
│   │
│   ├── application
│   │   ├── services          # Logic that orchestrates domain entities (e.g. AuthService)
│   │   └── dtos              # Data Transfer Objects between layers
│   │
│   ├── infrastructure
│   │   ├── database          # Prisma schema, implementations of repositories
│   │   ├── redis             # Redis caching setup
│   │   └── external-apis     # Cloudinary, Email API integrations, etc.
│   │
│   ├── interfaces
│   │   ├── http
│   │   │   ├── controllers   # Express route handlers
│   │   │   ├── routes        # Express routers
│   │   │   └── middleware    # Auth, error handling, etc.
│   │   └── graphql           # If needed: resolvers, schemas
│   │
│   ├── shared
│   │   ├── config            # Environment setup, constants
│   │   ├── errors            # Centralized error handling
│   │   └── utils             # Helpers: file upload, validation, etc.
│   │
│   └── main.ts              # App entry point: initializes DI container, server, DB
│
├── prisma
│   └── schema.prisma        # Prisma schema definition
│
├── .env                     # Environment variables
├── package.json             # NPM dependencies
└── tsconfig.json            # TypeScript config (if used)
```

---

## What to do next:
1. Move existing models and services into `domain/` and `application/`
2. Setup controllers inside `interfaces/http/controllers`
3. Setup routes inside `interfaces/http/routes`
4. Refactor DB logic into `infrastructure/database`
5. Connect layers via dependency injection (optional but recommended)
6. Use `main.ts` to start the HTTP server

> Each layer should depend only on interfaces from the layer above it.
> Infrastructure and interfaces can depend on application and domain, but **domain must not depend on anything else**.
