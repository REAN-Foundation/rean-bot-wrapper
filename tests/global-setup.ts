import { Application } from './application';

/////////////////////////////////////////////////////////////////////////////

export default async function globalSetup(): Promise<void> {
    console.log('[sequence] global-setup.ts: Playwright invoked globalSetup, calling Application.start()...');
    await Application.start();
    console.log('[sequence] global-setup.ts: Application.start() finished - test cases run next.');
}
