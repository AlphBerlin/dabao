# Multi-Tenant Loyalty/Rewards SaaS Platform

A Docker-based multi-tenant loyalty and rewards platform using Kong, Supabase, and Next.js.

## Architecture Overview

This platform implements a multi-tenant architecture where each customer gets their own branded loyalty/rewards program. The system uses:

- **Kong API Gateway**: Routes requests to appropriate services and handles authentication
- **Supabase**: Provides authentication and PostgreSQL database with row-level security for multi-tenancy
- **Prisma ORM**: For type-safe database access and migrations
- **Next.js Apps**:
  - **www**: Public landing pages + dashboard for user signup and project creation
  - **studio**: Project console for configuration
  - **client**: Tenant-specific dashboards with dynamic Tailwind CSS theming

### Authentication Flow

1. Users register/login through Supabase Auth in www, studio, or client apps
2. Supabase GoTrue issues JWT tokens containing tenant information
3. Kong validates JWTs and forwards authenticated requests
4. Each Next.js app verifies tenant access permissions via Supabase RLS policies

### Multi-tenancy Implementation

- **Schema-based multi-tenancy**: Each project has its own PostgreSQL schema
- **JWT claims** contain tenant identifiers used by RLS policies
- **Separate subdomains**: Each tenant is accessible via `{tenant-slug}.client.dabao.in`

### Dynamic Theming

- Each project can have custom colors, border radius, and other theme properties
- Theme configuration is stored in the database and applied dynamically
- CSS variables are used to implement theming with Tailwind CSS

## Development Setup

1. Copy `.env.dev.example` to `.env.dev`
2. Update environment variables with your Supabase credentials
3. Start development environment:

```bash
cd docker
docker-compose -f docker-compose.dev.yml up -d
```

4. Run Prisma migrations and seed the database:

```bash
docker-compose -f docker-compose.dev.yml --profile tools up prisma-migrate
```

5. Access the applications:
   - WWW: http://localhost:3000
   - Studio: http://localhost:3001
   - Client: http://localhost:3002/{project-slug}

## Production Deployment

1. Create a Supabase project for production
2. Set up environment variables in your hosting platform using `.env.prod.example` as a template
3. Build and deploy Docker images:

```bash
# Build all production images
docker-compose -f docker/docker-compose.prod.yml build

# Push images to your registry
docker-compose -f docker/docker-compose.prod.yml push
```

4. Deploy to your infrastructure using your preferred orchestration tool (Kubernetes, Docker Swarm, etc.)

## Project Structure

```
├── apps                      # Next.js applications
│   ├── client                # Client app (tenant-specific dashboard)
│   ├── studio                # Studio app (project configuration)
│   └── www                   # WWW app (public site + user signup)
├── docker                    # Docker configurations
│   ├── apps                  # App-specific Dockerfiles
│   ├── database              # Database Dockerfiles
│   ├── kong                  # Kong API Gateway configuration
│   ├── docker-compose.dev.yml # Development Docker Compose
│   └── docker-compose.prod.yml # Production Docker Compose
└── packages                  # Shared packages
    ├── database              # Prisma schema and client
    ├── eslint-config         # Shared ESLint configuration
    ├── typescript-config     # Shared TypeScript configuration
    └── ui                    # Shared UI components
```

## Configuration Management

- Development settings: `.env.dev`
- Production settings: `.env.prod`
- Secrets are managed via environment variables and never committed to the repository
