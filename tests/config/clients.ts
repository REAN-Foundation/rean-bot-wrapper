import { ConfigurationManager } from './configuration.manager';

///////////////////////////////////////////////////////////////////////////

export type BotClient = {
    client: string;
};

export const resolveClient = (key: string): BotClient | undefined => {
    const client = ConfigurationManager.ClientName(key);
    return client ? { client } : undefined;
};

export const testDataFile = (key: string) => ConfigurationManager.TestDataFileName(key);
