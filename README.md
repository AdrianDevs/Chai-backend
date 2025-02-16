# Basic Inventory Application

A basic inventory application for a store consisting of items and their categories. Users can create, read, update, and delete any item or category.

# Running

## Locally

#### Install Dependencies

```bash
$ npm install
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

Run typescript without compilation. 

```bash
$ npm run local
```

#### Watch

Run typescript without compilation, watch for file changes, and restart the server when they are detected.

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

## Backend

- Runtime: `NodeJS`
- Framework: `ExpressJS`
- Unit and integration testing with `Vitest` and `Supertest`
- Structured database with `PostgreSQL`
- Database migrations with `Kysley`
