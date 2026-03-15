/**
 * Script: Cleanup Disabled Intents
 *
 * Removes intents from the database that are marked as disabled in Dialogflow.
 * This script compares the current database intents with Dialogflow's active intents
 * and removes any that are disabled in Dialogflow but still present in the database.
 *
 * Usage:
 *   node scripts/cleanup-disabled-intents.js <client-name>
 *   node scripts/cleanup-disabled-intents.js <client-name> --dry-run
 *
 * Options:
 *   --dry-run    Preview what would be deleted without actually deleting
 *
 * Requirements:
 *   - Client configuration JSON file in project root: {client-name}.json
 *   - Database connection configured in environment
 */

const fs = require('fs');
const path = require('path');
const dialogflow = require('@google-cloud/dialogflow');
const { Sequelize } = require('sequelize');

// =====================================================
// CONFIGURATION
// =====================================================

function parseArguments() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.error('Error: Client name is required');
        console.log('Usage: node scripts/cleanup-disabled-intents.js <client-name> [--dry-run]');
        console.log('');
        console.log('Example:');
        console.log('  node scripts/cleanup-disabled-intents.js lvpei');
        console.log('  node scripts/cleanup-disabled-intents.js lvpei --dry-run');
        process.exit(1);
    }

    const clientName = args[0];
    const dryRun = args.includes('--dry-run');

    return { clientName, dryRun };
}

function loadClientConfig(clientName) {
    const configPath = path.join(process.cwd(), `${clientName}.json`);

    if (!fs.existsSync(configPath)) {
        throw new Error(`Client configuration file not found: ${configPath}`);
    }

    const configContent = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(configContent);
}

// =====================================================
// DIALOGFLOW API
// =====================================================

async function initializeDialogflowClient(config) {
    const gcpCredsConfig = config.DIALOGFLOW_BOT_GCP_PROJECT_CREDENTIALS;
    const projectId = config.DIALOGFLOW_PROJECT_ID;

    let gcpCredentials;

    if (typeof gcpCredsConfig === 'string') {
        gcpCredentials = JSON.parse(fs.readFileSync(gcpCredsConfig, 'utf8'));
    } else {
        gcpCredentials = gcpCredsConfig;
    }

    const { IntentsClient } = dialogflow.v2;

    const intentsClient = new IntentsClient({
        credentials: {
            client_email: gcpCredentials.client_email,
            private_key: gcpCredentials.private_key
        },
        projectId: projectId
    });

    return { intentsClient, projectId };
}

async function fetchAllIntents(intentsClient, projectId) {
    const projectAgentPath = intentsClient.projectAgentPath(projectId);

    const request = {
        parent: projectAgentPath,
        intentView: 'INTENT_VIEW_FULL',
        languageCode: 'en'
    };

    const [intents] = await intentsClient.listIntents(request);
    return intents;
}

// =====================================================
// DATABASE
// =====================================================

function initializeDatabase(config) {
    const sequelize = new Sequelize(
        config.DATA_BASE_NAME,
        config.DB_USER_NAME,
        config.DB_PASSWORD,
        {
            host: config.DB_HOST,
            port: config.DB_PORT || 3306,
            dialect: 'mysql',
            logging: false
        }
    );

    return sequelize;
}

async function getActiveIntentsFromDb(sequelize, clientName) {
    const [results] = await sequelize.query(`
        SELECT
            code,
            name,
            active,
            Metadata
        FROM intents
        WHERE JSON_EXTRACT(Metadata, '$.clientName') = :clientName
           OR JSON_EXTRACT(Metadata, '$.source') = 'dialogflow_migration'
    `, {
        replacements: { clientName },
        type: Sequelize.QueryTypes.SELECT
    });

    return results;
}

async function deleteDisabledIntents(sequelize, intentCodes, dryRun = false) {
    if (intentCodes.length === 0) {
        return { deleted: 0 };
    }

    const placeholders = intentCodes.map(() => '?').join(',');

    if (dryRun) {
        console.log('\n[DRY RUN] Would delete the following intents:');
        intentCodes.forEach(code => console.log(`  - ${code}`));
        return { deleted: intentCodes.length };
    }

    // Delete intent_listeners first (foreign key constraint)
    await sequelize.query(`
        DELETE FROM intent_listeners
        WHERE listenerCode IN (${placeholders})
    `, {
        replacements: intentCodes
    });

    // Delete intents
    const [result] = await sequelize.query(`
        DELETE FROM intents
        WHERE code IN (${placeholders})
    `, {
        replacements: intentCodes
    });

    return { deleted: intentCodes.length };
}

// =====================================================
// MAIN LOGIC
// =====================================================

async function main() {
    console.log('🧹 Cleanup Disabled Intents Tool\n');

    try {
        // Step 1: Parse arguments
        const { clientName, dryRun } = parseArguments();
        console.log(`Client: ${clientName}`);
        if (dryRun) console.log('Mode: DRY RUN (no data will be deleted)\n');

        // Step 2: Load configuration
        console.log('📁 Loading configuration...');
        const config = loadClientConfig(clientName);
        console.log('   ✓ Configuration loaded\n');

        // Step 3: Connect to Dialogflow
        console.log('🔌 Connecting to Dialogflow...');
        const { intentsClient, projectId } = await initializeDialogflowClient(config);
        console.log('   ✓ Connected to Dialogflow\n');

        // Step 4: Fetch all Dialogflow intents
        console.log('📥 Fetching Dialogflow intents...');
        const dialogflowIntents = await fetchAllIntents(intentsClient, projectId);
        console.log(`   ✓ Fetched ${dialogflowIntents.length} intents from Dialogflow\n`);

        // Step 5: Identify enabled/disabled intents in Dialogflow
        const enabledInDialogflow = new Set();
        const disabledInDialogflow = [];

        dialogflowIntents.forEach(intent => {
            const intentCode = intent.displayName;
            if (intent.mlDisabled === true) {
                disabledInDialogflow.push(intentCode);
            } else {
                enabledInDialogflow.add(intentCode);
            }
        });

        console.log(`   Enabled in Dialogflow: ${enabledInDialogflow.size}`);
        console.log(`   Disabled in Dialogflow: ${disabledInDialogflow.length}\n`);

        // Step 6: Connect to database
        console.log('💾 Connecting to database...');
        const sequelize = initializeDatabase(config);
        await sequelize.authenticate();
        console.log('   ✓ Connected to database\n');

        // Step 7: Get intents from database
        console.log('📊 Fetching intents from database...');
        const dbIntents = await getActiveIntentsFromDb(sequelize, clientName);
        console.log(`   ✓ Found ${dbIntents.length} intents in database\n`);

        // Step 8: Identify intents to delete
        const intentsToDelete = [];
        dbIntents.forEach(dbIntent => {
            // Check if intent exists in Dialogflow and is disabled
            const existsInDialogflow = enabledInDialogflow.has(dbIntent.code) ||
                                      disabledInDialogflow.includes(dbIntent.code);

            if (existsInDialogflow && disabledInDialogflow.includes(dbIntent.code)) {
                intentsToDelete.push(dbIntent.code);
            }
        });

        console.log('🔍 Analysis Results:');
        console.log(`   Intents to delete: ${intentsToDelete.length}\n`);

        if (intentsToDelete.length > 0) {
            console.log('Intents marked for deletion:');
            intentsToDelete.forEach(code => {
                const dbIntent = dbIntents.find(i => i.code === code);
                console.log(`  - ${code} (${dbIntent.name})`);
            });
            console.log('');
        }

        // Step 9: Delete disabled intents
        if (intentsToDelete.length > 0) {
            if (dryRun) {
                console.log('✅ Dry run completed - no data was deleted\n');
            } else {
                console.log('🗑️  Deleting disabled intents...');
                const result = await deleteDisabledIntents(sequelize, intentsToDelete, dryRun);
                console.log(`   ✓ Deleted ${result.deleted} intents\n`);
                console.log('✅ Cleanup completed successfully!\n');
            }
        } else {
            console.log('✅ No disabled intents found - database is clean!\n');
        }

        // Close database connection
        await sequelize.close();

    } catch (error) {
        console.error('\n❌ Cleanup failed\n');
        console.error('Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = {
    loadClientConfig,
    initializeDialogflowClient,
    fetchAllIntents,
    initializeDatabase,
    getActiveIntentsFromDb,
    deleteDisabledIntents
};
