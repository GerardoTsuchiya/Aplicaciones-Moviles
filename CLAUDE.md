# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start with hot reload (nodemon)
npm start        # Start without hot reload (node index.js)
```

## Project

Plain Express.js 5.x backend. No TypeScript, no framework — just `index.js` as the entry point. CORS is available via the `cors` package.

The parent directory (`../`) contains a separate NestJS + Prisma project (`task-manager-api`). This `Demo-Back` project is independent from it.
