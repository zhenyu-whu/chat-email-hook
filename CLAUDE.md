# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Cloudflare Workers project that demonstrates using Workers with D1 (Cloudflare's serverless SQL database). The project creates a simple web interface that queries a comments table and displays the results.

## Key Commands

### Development
- `pnpm dev` - Start local development server (includes seeding local D1 database)
- `pnpm seedLocalD1` - Apply migrations to local D1 database
- `pnpm cf-typegen` - Generate TypeScript types from Wrangler

### Build & Deploy
- `pnpm check` - Type check and dry-run deployment
- `pnpm deploy` - Deploy to Cloudflare Workers (runs pre-deploy migration)
- `pnpm predeploy` - Apply migrations to remote D1 database

### Database Management
- `wrangler d1 migrations apply DB --local` - Apply migrations locally
- `wrangler d1 migrations apply DB --remote` - Apply migrations to remote database

## Architecture

### Core Structure
- **src/index.ts**: Main Worker handler that queries D1 database and returns HTML response
- **src/renderHtml.ts**: HTML template renderer for displaying query results
- **migrations/**: SQL migration files for D1 database schema

### D1 Database Integration
- Database binding name: `DB` (configured in wrangler.json)
- Database name: `d1-email`
- Schema: Single `comments` table with id, author, and content fields

### Worker Environment
- Uses TypeScript with strict mode enabled
- Targets ES Next with bundler module resolution
- Includes Cloudflare Worker type definitions in worker-configuration.d.ts

### Key Dependencies
- **wrangler**: Cloudflare Workers CLI for development and deployment
- **typescript**: TypeScript compiler

## Important Notes

- Always run migrations before deploying (`predeploy` script handles this automatically)
- Local development requires seeding the local D1 database first
- The project uses pnpm as the package manager
- Observability is enabled in the Wrangler configuration