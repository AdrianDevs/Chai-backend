# Chai Chat App Server

RESTful API for the Chai chat app

# Running

## Locally

#### Install Dependencies

```bash
$ npm install
```

#### Start Database

```sh
$ make up-db-dev
```

#### Compile Build

Compile TypeScript files to JavaScript files.

```bash
$ npm run build
```

#### Run Build

Run compiled JavaScript files.

```bash
$ npm run start
```

#### Run Typescript

Run TypeScript without compilation. 

```bash
$ npm run local
```

#### Watch

Run Typescript without compilation, watch for file changes, and restart the server when they are detected.

```bash
$ npm run dev
```

#### Setup Tools

```sh
$ lefthook install
```

## Docker Compose

#### Watch

```sh
$ npm install
$ make up
```

# Features

## Tools

- VS Code
- GitHub
- Type checking with `TypeScript`
- Environmental variables with `dotenv`
- Formatting with `Prettier`
- Linting with `ESLint`
- Package validation with `npm audit`
- Branch name validation with `validate-branch-name`
- Secret scanner for commits with `Gitleaks`
- Commit message linting with `commitlint`
- Commit hooks with `lefthook`
- API documentation with `OpenAPI`, `Swagger`, and `JSDoc`.

## Backend

- Runtime: `NodeJS`
- Framework: `ExpressJS`
- Restful API Design
- Unit and integration testing with `Vitest` and `Supertest`
- Structured database with `PostgreSQL`
- Database migrations with `Kysley`
- Auth using JWTs with `PassportJS`

## Hosting (Local)

- Containerisation with `Docker Compose`
- File Storage with `MinIO` [TODO]
- Reverse Proxy with `NGINX` [TODO]

## Hosting (Production)

- CI/CD with GitHub Actions [TODO]
- AWS Cloudfront, API Gateway, ECS (Fargate), RDS, S3, Terraform [TODO]

## Principles

- Domain Driven Design
- Onion Architecture

## TODO

- Changelog
- Google Analytics
- Logging, APM (tracing), and Metrics
- Sentry
- Mixpanel
- JWT Refresh Tokens
- JWT black listing
- Email verification
- Local email testing
- Auth with `Supertokens` or `Zitadel`
- Webhooks
- WebSockets
- RabbitMQ
- Snowflake
