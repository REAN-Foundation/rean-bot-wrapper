import { test as base, expect, APIRequestContext } from '@playwright/test';
import { ConfigurationManager } from './config/configuration.manager';

///////////////////////////////////////////////////////////////////////////

type ApiFixtures = {
    apiContext: APIRequestContext;
};

export const test = base.extend<ApiFixtures>({
    apiContext: async ({ playwright, baseURL }, use) => {
        const context = await playwright.request.newContext({
            baseURL,
            extraHTTPHeaders: {
                'x-api-key': ConfigurationManager.ApiKey(),
            },
        });
        await use(context);
        await context.dispose();
    },
});

export { expect };
