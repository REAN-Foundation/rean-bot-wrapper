import 'dotenv/config';
import { defineConfig } from '@playwright/test';
import { ConfigurationManager } from './tests/config/configuration.manager';

///////////////////////////////////////////////////////////////////////////

ConfigurationManager.validate();

export default defineConfig({
    testDir: './tests',
    testMatch: '**/*.spec.ts',

    fullyParallel: true,
    workers: Number(process.env.TEST_WORKERS ?? 4),
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
