This is a cloudflare worker that wraps the bart api, providing real-time departure information for stations near the users.

Tech stack:

- Cloudflare workers
- Typescript
- node's built-in test runner.

To validate changes:

1. `npm run typecheck`
2. `npm run test`

To run a specific test:
`npm run test -- test/apiIntegration.test.ts`
