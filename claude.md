This is a cloudflare worker that wraps the bart api, providing real-time departure information for stations near the users.

Tech stack:

- Cloudflare workers
- Typescript
- node's built-in test runner.

To validate changes:

1. `npm run typecheck`
2. `npm run test`. If you get a failure in the legacy comparison test that is only slight time differences, run the test again to make sure it's transient.

To run a specific test:
`npm run test -- test/apiIntegration.test.ts`

setup notes:
source .env && echo $CLOUDFLARE_ANALYTICS_ACCOUNT_ID | wrangler secret put CLOUDFLARE_ACCOUNT_ID
source .env && echo $CLOUDFLARE_ANALYTICS_API_TOKEN | wrangler secret put CLOUDFLARE_API_TOKEN
