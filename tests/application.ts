import { ConfigurationManager } from './config/configuration.manager';
import { StorageService } from './modules/storage/storage.service';

////////////////////////////////////////////////////////////////////////////

export class Application {

    public static start = async (): Promise<void> => {
        console.log('[sequence] Application.start(): calling ConfigurationManager.loadConfigurations()...');
        ConfigurationManager.loadConfigurations();

        const dataSources = ConfigurationManager.TestDataSources();
        console.log(`[sequence] Application.start(): ${dataSources.length} test data source(s) to download for TEST_ENV '${ConfigurationManager.TestEnv()}'.`);

        await StorageService.downloadAll();
        console.log('[sequence] Application.start(): all test data downloaded.');
    };

    public static stop = async (): Promise<void> => {
        console.log('[sequence] Application.stop(): called.');
    };

}
