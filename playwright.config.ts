import 'dotenv/config';
import { defineConfig } from '@playwright/test';
import { ConfigurationManager } from './tests/config/configuration.manager';

///////////////////////////////////////////////////////////////////////////

ConfigurationManager.validate();

export default defineConfig({
    testDir: './tests',
    testMatch: '**/*.spec.ts',

    fullyParallel: false,
    // Run tests in files in parallel. Constraints: 1) llm service limitations
    workers: 1,
    retries: 0,

    timeout: 30000,

    reporter: [
        ['list'],
        ['html', { outputFolder: ConfigurationManager.HtmlReportTemporaryFolder(), open: 'never' }],
        ['./tests/services/report/report.reporter.ts'],
    ],

    globalSetup: require.resolve('./tests/global-setup'),
    globalTeardown: require.resolve('./tests/global-teardown'),

    use: {
        baseURL: ConfigurationManager.BaseUrl(),
    },
});
