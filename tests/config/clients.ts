import { ConfigurationManager } from './configuration.manager';

///////////////////////////////////////////////////////////////////////////

export type BotClient = {
    client    : string;
    platformId: string;
};

export const resolveClient = (key: string): BotClient | undefined => {
    const client = ConfigurationManager.ClientName(key);
    return client ? { client, platformId: ConfigurationManager.ClientPlatformId(key) } : undefined;
};

export const testDataFile = (key: string) => ConfigurationManager.TestDataFileName(key);
