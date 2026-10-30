import { Application } from './application';

/////////////////////////////////////////////////////////////////////////////

export default async function globalTeardown(): Promise<void> {
    console.log('[sequence] global-teardown.ts: Playwright invoked globalTeardown, calling Application.stop()...');
    await Application.stop();
    console.log('[sequence] global-teardown.ts: Application.stop() finished.');
}
