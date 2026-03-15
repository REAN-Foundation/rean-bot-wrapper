/**
 * Script: Export Dialogflow Intents to Database Seed (LLM Migration Mode)
 *
 * Pulls all intents and entities from a Dialogflow project and generates:
 * 1. Database seeder file for the intents table (100% LLM-enabled)
 * 2. Feature flags for 100% rollout
 * 3. Human-readable documentation of all intents
 *
 * All exported intents are configured for full LLM migration:
 * - llmEnabled: true
 * - llmProvider: 'openai'
 * - fallbackToDialogflow: false
 * - Feature flags enabled at 100% rollout
 *
 * Usage:
 *   node scripts/export-dialogflow-to-seed.js <client-name>
 *   node scripts/export-dialogflow-to-seed.js <client-name> --dry-run
 *   node scripts/export-dialogflow-to-seed.js <client-name> --skip-docs
 *   node scripts/export-dialogflow-to-seed.js <client-name> --skip-flags
 *
 * Options:
 *   --dry-run     Preview the export without creating files
 *   --skip-docs   Skip documentation generation
 *   --skip-flags  Skip feature flag generation
 *
 * Requirements:
 *   - Client configuration JSON file in project root: {client-name}.json
 *   - Configuration must contain:
 *     - DIALOGFLOW_BOT_GCP_PROJECT_CREDENTIALS (GCP service account JSON object OR path to JSON file)
 *     - DIALOGFLOW_PROJECT_ID
 *     - DATA_BASE_NAME, DB_USER_NAME, DB_PASSWORD, DB_HOST, DB_PORT (optional, for future use)
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const dialogflow = require('@google-cloud/dialogflow');

// =====================================================
// ERROR HANDLING
// =====================================================

const ErrorCategory = {
    CONFIG: 'configuration',
    DIALOGFLOW_API: 'dialogflow_api',
    DATA_TRANSFORM: 'data_transformation',
    FILE_IO: 'file_io'
};

class DialogflowExportError extends Error {
    constructor(message, category, details = null) {
        super(message);
        this.name = 'DialogflowExportError';
        this.category = category;
        this.details = details;
    }
}

function handleError(error) {
    console.error('\n❌ Export failed\n');

    if (error instanceof DialogflowExportError) {
        console.error(`Category: ${error.category}`);
        console.error(`Message: ${error.message}`);

        if (error.details) {
            console.error('Details:', JSON.stringify(error.details, null, 2));
        }

        switch (error.category) {
            case ErrorCategory.CONFIG:
                console.log('\nSuggestions:');
                console.log('- Verify the client configuration file exists');
                console.log('- Check that all required keys are present');
                console.log('- Ensure GCP credentials are provided (as object or file path)');
                console.log('- If using file path: verify the file exists');
                console.log('- If using embedded object: verify client_email and private_key are present');
                break;

            case ErrorCategory.DIALOGFLOW_API:
                console.log('\nSuggestions:');
                console.log('- Verify GCP service account has Dialogflow API access');
                console.log('- Check that the project ID is correct');
                console.log('- Ensure Dialogflow API is enabled in GCP');
                break;

            case ErrorCategory.DATA_TRANSFORM:
                console.log('\nSuggestions:');
                console.log('- Review the Dialogflow intent structure');
                console.log('- Check for unexpected data formats');
                break;

            case ErrorCategory.FILE_IO:
                console.log('\nSuggestions:');
                console.log('- Verify write permissions for output directories');
                console.log('- Check disk space availability');
                break;
        }
    } else {
        console.error('Unexpected error:', error.message);
        console.error(error.stack);
    }

    process.exit(1);
}

async function safeExecute(operation, errorCategory, context = '') {
    try {
        return await operation();
    } catch (error) {
        throw new DialogflowExportError(
            `Failed to ${context}: ${error.message}`,
            errorCategory,
            { originalError: error.message, stack: error.stack }
        );
    }
}

// =====================================================
// CLI ARGUMENT PARSING
// =====================================================

function parseArguments() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.error('Error: Client name is required');
        console.log('Usage: node scripts/export-dialogflow-to-seed.js <client-name> [options]');
        console.log('');
        console.log('Options:');
        console.log('  --dry-run            Preview the export without creating files');
        console.log('  --skip-docs          Skip documentation generation');
        console.log('  --skip-flags         Skip feature flag generation');
        console.log('  --include-disabled   Include disabled intents (marked as active=false)');
        console.log('  --only-disabled      Export only disabled intents');
        console.log('');
        console.log('Example:');
        console.log('  node scripts/export-dialogflow-to-seed.js lvpei');
        console.log('  node scripts/export-dialogflow-to-seed.js lvpei --dry-run');
        console.log('  node scripts/export-dialogflow-to-seed.js lvpei --include-disabled');
        console.log('');
        console.log('This will look for lvpei.json in the project root directory.');
        process.exit(1);
    }

    const clientName = args[0];

    const options = {
        skipDocs: args.includes('--skip-docs'),
        skipFlags: args.includes('--skip-flags'),
        dryRun: args.includes('--dry-run'),
        includeDisabled: args.includes('--include-disabled'),
        onlyDisabled: args.includes('--only-disabled')
    };

    return { clientName, options };
}

// =====================================================
// CONFIGURATION LOADING
// =====================================================

function loadClientConfig(clientName) {
    const configPath = path.join(process.cwd(), `${clientName}.json`);

    if (!fs.existsSync(configPath)) {
        throw new DialogflowExportError(
            `Client configuration file not found: ${configPath}`,
            ErrorCategory.CONFIG
        );
    }

    try {
        const configContent = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(configContent);
        return config;
    } catch (error) {
        throw new DialogflowExportError(
            `Failed to parse client configuration: ${error.message}`,
            ErrorCategory.CONFIG,
            { path: configPath }
        );
    }
}

function validateConfig(config) {
    const required = [
        'DIALOGFLOW_BOT_GCP_PROJECT_CREDENTIALS',
        'DIALOGFLOW_PROJECT_ID'
    ];

    const missing = required.filter(key => !config[key]);

    if (missing.length > 0) {
        throw new DialogflowExportError(
            `Missing required configuration keys: ${missing.join(', ')}`,
            ErrorCategory.CONFIG,
            { missingKeys: missing }
        );
    }

    // Validate GCP credentials - can be either a file path (string) or embedded object
    const gcpCreds = config.DIALOGFLOW_BOT_GCP_PROJECT_CREDENTIALS;

    if (typeof gcpCreds === 'string') {
        // File path - verify file exists
        if (!fs.existsSync(gcpCreds)) {
            throw new DialogflowExportError(
                `GCP credentials file not found: ${gcpCreds}`,
                ErrorCategory.CONFIG,
                { path: gcpCreds }
            );
        }
    } else if (typeof gcpCreds === 'object') {
        // Embedded credentials - verify required fields
        const requiredFields = ['client_email', 'private_key'];
        const missingFields = requiredFields.filter(field => !gcpCreds[field]);

        if (missingFields.length > 0) {
            throw new DialogflowExportError(
                `Embedded GCP credentials missing required fields: ${missingFields.join(', ')}`,
                ErrorCategory.CONFIG,
                { missingFields }
            );
        }
    } else {
        throw new DialogflowExportError(
            'DIALOGFLOW_BOT_GCP_PROJECT_CREDENTIALS must be either a file path (string) or credentials object',
            ErrorCategory.CONFIG
        );
    }

    return true;
}

// =====================================================
// DIALOGFLOW API INTEGRATION
// =====================================================

async function initializeDialogflowClient(config) {
    const gcpCredsConfig = config.DIALOGFLOW_BOT_GCP_PROJECT_CREDENTIALS;
    const projectId = config.DIALOGFLOW_PROJECT_ID;

    let gcpCredentials;

    // Handle both file path (string) and embedded credentials (object)
    if (typeof gcpCredsConfig === 'string') {
        // Load GCP credentials from file
        gcpCredentials = JSON.parse(fs.readFileSync(gcpCredsConfig, 'utf8'));
    } else {
        // Use embedded credentials directly
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
        intentView: 'INTENT_VIEW_FULL', // Critical: Get full intent data including training phrases
        languageCode: 'en'
    };

    const [intents] = await intentsClient.listIntents(request);
    return intents;
}

// =====================================================
// DATA EXTRACTION
// =====================================================

/**
 * Convert Dialogflow Protobuf Struct to plain JavaScript object
 * Handles the nested fields/structValue/listValue/stringValue structure
 */
function convertProtobufStructToJson(struct) {
    if (!struct) return null;

    // Handle structValue
    if (struct.structValue) {
        return convertProtobufStructToJson(struct.structValue);
    }

    // Handle fields object
    if (struct.fields) {
        const result = {};
        for (const [key, value] of Object.entries(struct.fields)) {
            result[key] = convertProtobufStructToJson(value);
        }
        return result;
    }

    // Handle listValue (arrays)
    if (struct.listValue && struct.listValue.values) {
        return struct.listValue.values.map(v => convertProtobufStructToJson(v));
    }

    // Handle primitive values
    if (struct.stringValue !== undefined) return struct.stringValue;
    if (struct.numberValue !== undefined) return struct.numberValue;
    if (struct.boolValue !== undefined) return struct.boolValue;
    if (struct.nullValue !== undefined) return null;

    // Return as-is if no special handling needed
    return struct;
}

function extractTrainingPhrases(intent) {
    if (!intent.trainingPhrases || intent.trainingPhrases.length === 0) {
        return [];
    }

    return intent.trainingPhrases.map(phrase => {
        // Concatenate all parts to form the complete phrase
        return phrase.parts.map(part => part.text).join('');
    });
}

function mapDialogflowTypeToJsonType(dialogflowType) {
    const typeMap = {
        '@sys.date': 'string',
        '@sys.time': 'string',
        '@sys.date-time': 'string',
        '@sys.number': 'number',
        '@sys.integer': 'integer',
        '@sys.number-integer': 'integer',
        '@sys.email': 'string',
        '@sys.phone-number': 'string',
        '@sys.url': 'string',
        '@sys.color': 'string',
        '@sys.geo-city': 'string',
        '@sys.geo-country': 'string',
        '@sys.any': 'string'
    };

    if (dialogflowType.startsWith('@sys.')) {
        return typeMap[dialogflowType] || 'string';
    }

    // Custom entity - return as array for multi-select
    return 'array';
}

function extractParameters(intent) {
    if (!intent.parameters || intent.parameters.length === 0) {
        return null;
    }

    const entitySchema = {};

    intent.parameters.forEach(param => {
        entitySchema[param.displayName] = {
            type: mapDialogflowTypeToJsonType(param.entityTypeDisplayName),
            required: param.mandatory || false,
            description: `Parameter from Dialogflow: ${param.entityTypeDisplayName}`,
            followUpQuestion: param.prompts && param.prompts.length > 0
                ? param.prompts[0]
                : `Please provide ${param.displayName}`
        };
    });

    return entitySchema;
}

function hasWebhook(intent) {
    return intent.webhookState === 'WEBHOOK_STATE_ENABLED';
}

function isIntentDisabled(intent) {
    // Only check if ML is disabled for this intent
    // Intents without training phrases are still valid (can be triggered by buttons, etc.)
    return intent.mlDisabled === true;
}

function extractStaticResponse(intent) {
    if (!intent.messages || intent.messages.length === 0) {
        return null;
    }

    let message = '';
    const buttons = [];
    const seenButtons = new Set(); // Avoid duplicates

    intent.messages.forEach(msg => {
        // Extract text responses
        if (msg.text && msg.text.text && msg.text.text.length > 0) {
            // Use the first text response as the message
            if (!message) {
                message = msg.text.text[0];
            }
        }

        // Extract from custom payload (primary source for buttons)
        if (msg.payload) {
            // Convert Protobuf Struct to plain JavaScript object
            const payload = convertProtobufStructToJson(msg.payload);

            // Extract message from payload if not already set
            if (!message && payload.message) {
                message = payload.message;
            }
            if (!message && payload.text) {
                message = payload.text;
            }

            // Extract buttons from payload
            // Format: { messagetype: "interactive-buttons", buttons: [{reply: {id, title}, type}] }
            if (payload.buttons && Array.isArray(payload.buttons)) {
                payload.buttons.forEach(btn => {
                    let buttonText, buttonValue, buttonType;

                    // Handle reply format: { reply: { id: "intentName", title: "Button Text" }, type: "reply" }
                    if (btn.reply && btn.reply.id && btn.reply.title) {
                        buttonText = btn.reply.title;
                        buttonValue = btn.reply.id;  // Intent name
                        buttonType = 'intent';       // ID represents intent name
                    }
                    // Fallback to other formats
                    else if (btn.text || btn.title) {
                        buttonText = btn.text || btn.title || btn.label;
                        buttonValue = btn.value || btn.payload || btn.url || buttonText;
                        buttonType = btn.url ? 'url' : 'text';
                    }

                    const buttonKey = buttonText ? buttonText.toLowerCase() : '';

                    if (buttonText && !seenButtons.has(buttonKey)) {
                        seenButtons.add(buttonKey);
                        buttons.push({
                            text: buttonText,
                            type: buttonType,
                            value: buttonValue
                        });
                    }
                });
            }
        }

        // Extract quick replies as buttons (standard Dialogflow format)
        if (msg.quickReplies && msg.quickReplies.quickReplies) {
            msg.quickReplies.quickReplies.forEach(reply => {
                const buttonKey = reply.toLowerCase();
                if (!seenButtons.has(buttonKey)) {
                    seenButtons.add(buttonKey);
                    buttons.push({
                        text: reply,
                        type: 'text',
                        value: reply
                    });
                }
            });
        }

        // Extract suggestion chips as buttons
        if (msg.suggestions && msg.suggestions.suggestions) {
            msg.suggestions.suggestions.forEach(suggestion => {
                const title = suggestion.title || suggestion;
                const buttonKey = title.toLowerCase();
                if (!seenButtons.has(buttonKey)) {
                    seenButtons.add(buttonKey);
                    buttons.push({
                        text: title,
                        type: 'text',
                        value: title
                    });
                }
            });
        }

        // Extract card buttons
        if (msg.card && msg.card.buttons) {
            msg.card.buttons.forEach(button => {
                const buttonText = button.text || button.postback || '';
                const buttonKey = buttonText.toLowerCase();
                if (buttonText && !seenButtons.has(buttonKey)) {
                    seenButtons.add(buttonKey);
                    buttons.push({
                        text: buttonText,
                        type: button.postback ? 'text' : 'url',
                        value: button.postback || button.uri || button.text
                    });
                }
            });
        }
    });

    if (!message && buttons.length === 0) {
        return null;
    }

    const config = {
        message: message || 'Response from Dialogflow',
        ...(buttons.length > 0 && { buttons })
    };

    return JSON.stringify(config);
}

// =====================================================
// DATA TRANSFORMATION
// =====================================================

function generateIntentName(intentCode) {
    // Convert "user.delete.confirm" to "User Delete Confirm"
    return intentCode
        .split('.')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function extractCategory(intentCode) {
    // Extract category from intent code (first part before dot)
    const parts = intentCode.split('.');
    return parts[0] || 'general';
}

function determineIntentType(dialogflowIntent) {
    if (dialogflowIntent.isFallback) return 'fallback';
    if (dialogflowIntent.displayName.startsWith('system.')) return 'system';
    return 'custom';
}

function generateIntentDescription(dialogflowIntent) {
    const hasParams = dialogflowIntent.parameters && dialogflowIntent.parameters.length > 0;
    const paramList = hasParams
        ? dialogflowIntent.parameters.map(p => p.displayName).join(', ')
        : 'none';

    return `Migrated from Dialogflow intent: ${dialogflowIntent.displayName}. ` +
        `Uses LLM for classification and entity extraction. ` +
        `Collects parameters: ${paramList}. ` +
        `Webhook enabled: ${hasWebhook(dialogflowIntent)}.`;
}

function transformIntentToDbSchema(dialogflowIntent, clientName) {
    const intentCode = dialogflowIntent.displayName;
    const intentName = generateIntentName(intentCode);
    const trainingPhrases = extractTrainingPhrases(dialogflowIntent);
    const entitySchema = extractParameters(dialogflowIntent);
    const hasWebhookEnabled = hasWebhook(dialogflowIntent);
    const isDisabled = isIntentDisabled(dialogflowIntent);

    return {
        id: uuidv4(),
        name: intentName,
        code: intentCode,
        type: 'llm_native',  // All migrated intents are LLM-native
        Metadata: JSON.stringify({
            category: extractCategory(intentCode),
            source: 'dialogflow_migration',
            clientName: clientName,
            originalDialogflowId: dialogflowIntent.name,
            migrationDate: new Date().toISOString(),
            isFallback: dialogflowIntent.isFallback || false,
            mlDisabled: dialogflowIntent.mlDisabled || false
        }),

        // LLM Configuration
        // Disabled intents in Dialogflow should also be disabled here
        llmEnabled: !isDisabled,
        llmProvider: 'openai',

        intentDescription: generateIntentDescription(dialogflowIntent),
        intentExamples: JSON.stringify(trainingPhrases),
        entitySchema: entitySchema ? JSON.stringify(entitySchema) : null,

        conversationConfig: entitySchema ? JSON.stringify({
            maxTurns: 5,
            timeoutMinutes: 15,
            followUpStrategy: 'default'
        }) : null,

        confidenceThreshold: 0.75,
        fallbackToDialogflow: false,  // No fallback - full LLM migration
        priority: dialogflowIntent.priority || 0,
        active: !isDisabled,  // Disabled intents marked as inactive

        // Response configuration
        responseType: hasWebhookEnabled ? 'listener' : 'static',
        staticResponse: extractStaticResponse(dialogflowIntent)
        // Note: createdAt and updatedAt will be added in the seeder file
    };
}

// =====================================================
// FEATURE FLAG GENERATION
// =====================================================

function generateFeatureFlags(intents, clientName) {
    const flags = [];

    // Master flag for LLM intent responses - 100% rollout
    flags.push({
        id: uuidv4(),
        flagName: `llmIntentResponseEnabled_${clientName}`,
        description: `Master flag: Enable LLM-based intent responses for ${clientName} (100% rollout)`,
        enabled: true,
        rolloutPercentage: 100,
        targetIntents: null,
        targetUsers: null,
        targetPlatforms: null,
        environments: JSON.stringify(['development', 'staging', 'production']),
        expiresAt: null
    });

    // Master flag for entity collection - 100% rollout
    const intentsWithEntities = intents.filter(i => i.entitySchema);
    if (intentsWithEntities.length > 0) {
        flags.push({
            id: uuidv4(),
            flagName: `llmEntityCollectionEnabled_${clientName}`,
            description: `Master flag: Enable LLM-based entity collection for ${clientName} (100% rollout)`,
            enabled: true,
            rolloutPercentage: 100,
            targetIntents: null,
            targetUsers: null,
            targetPlatforms: null,
            environments: JSON.stringify(['development', 'staging', 'production']),
            expiresAt: null
        });

        // Per-intent entity collection flags
        intentsWithEntities.forEach(intent => {
            flags.push({
                id: uuidv4(),
                flagName: `entityCollection_${intent.code.replace(/\./g, '_')}`,
                description: `Enable entity collection for ${intent.name}`,
                enabled: true,
                rolloutPercentage: 100,
                targetIntents: JSON.stringify([intent.code]),
                targetUsers: null,
                targetPlatforms: null,
                environments: JSON.stringify(['development', 'staging', 'production']),
                expiresAt: null
            });
        });
    }

    // Group intents by category for flow-based flags
    const categories = {};
    intents.forEach(intent => {
        const metadata = JSON.parse(intent.Metadata);
        const category = metadata.category || 'general';
        if (!categories[category]) {
            categories[category] = [];
        }
        categories[category].push(intent.code);
    });

    // Create per-category flow flags
    Object.entries(categories).forEach(([category, intentCodes]) => {
        flags.push({
            id: uuidv4(),
            flagName: `llmIntent_${clientName}_${category}_flow`,
            description: `Enable all ${category} flow intents for ${clientName} (100% rollout)`,
            enabled: true,
            rolloutPercentage: 100,
            targetIntents: JSON.stringify(intentCodes),
            targetUsers: null,
            targetPlatforms: null,
            environments: JSON.stringify(['development', 'staging', 'production']),
            expiresAt: null
        });
    });

    return flags;
}

// =====================================================
// SEEDER FILE GENERATION
// =====================================================

function formatTimestamp() {
    const now = new Date();
    return now.toISOString()
        .replace(/[-:]/g, '')
        .replace('T', '')
        .slice(0, 14); // YYYYMMDDHHmmss
}

function generateSeederFile(intents, clientName, outputPath, includeFeatureFlags = true) {
    const timestamp = formatTimestamp();
    const fileName = `${timestamp}-dialogflow-${clientName}-intents.js`;
    const filePath = path.join(outputPath, fileName);

    const intentCodes = intents.map(i => `'${i.code}'`).join(',\n            ');
    const featureFlags = includeFeatureFlags ? generateFeatureFlags(intents, clientName) : [];
    const flagNames = featureFlags.map(f => `'${f.flagName}'`).join(',\n            ');

    const featureFlagSection = includeFeatureFlags ? `
        // =====================================================
        // FEATURE FLAGS - 100% ROLLOUT FOR TESTING
        // =====================================================
        const flagNames = [
            ${flagNames}
        ];

        console.log('Checking for existing feature flags...');

        // Check if any feature flags with these names already exist
        const [existingFlags] = await queryInterface.sequelize.query(
            \`SELECT flagName FROM feature_flags WHERE flagName IN (\${flagNames.map(() => '?').join(',')})\`,
            { replacements: flagNames }
        );

        if (existingFlags.length > 0) {
            console.log(\`Found \${existingFlags.length} existing feature flags - deleting before re-import...\`);

            // Delete existing feature flags
            await queryInterface.bulkDelete('feature_flags', {
                flagName: {
                    [Sequelize.Op.in]: flagNames
                }
            }, {});

            console.log('Existing feature flags deleted successfully');
        }

        const featureFlagsData = ${JSON.stringify(featureFlags, null, 12)};

        // Add timestamps to each feature flag
        const featureFlags = featureFlagsData.map(flag => ({
            ...flag,
            createdAt: now,
            updatedAt: now
        }));

        // Insert feature flags
        await queryInterface.bulkInsert('feature_flags', featureFlags, {});
` : '';

    const featureFlagDownSection = includeFeatureFlags ? `
        // Delete feature flags
        const flagNames = [
            ${flagNames}
        ];
        await queryInterface.bulkDelete('feature_flags', {
            flagName: {
                [Sequelize.Op.in]: flagNames
            }
        }, {});
` : '';

    const seederContent = `/**
 * Seeder: Dialogflow Intent Migration - ${clientName}
 *
 * Generated on: ${new Date().toISOString()}
 * Source: Dialogflow project
 * Client: ${clientName}
 * Migration Mode: 100% LLM Enabled
 *
 * This seeder imports ${intents.length} intents from Dialogflow.
 * All intents are configured for LLM-based processing with:
 * - llmEnabled: true
 * - llmProvider: 'openai'
 * - fallbackToDialogflow: false
 * - Feature flags enabled at 100% rollout
 *
 * DUPLICATE HANDLING:
 * This seeder is safe to run multiple times. It will:
 * 1. Check for existing intents with the same codes
 * 2. Delete existing intents and their listeners before re-importing
 * 3. Delete existing feature flags with the same names before re-importing
 * 4. Insert fresh data from the latest Dialogflow export
 *
 * After running this seeder, you should:
 * 1. Review the imported intents
 * 2. Review static responses and button configurations
 *    - Verify button types are correct (intent/url/text)
 *    - Update button values to reference proper intent codes
 * 3. Set up intent listeners for webhook-enabled intents
 * 4. Test each intent thoroughly
 * 5. Monitor LLM classification accuracy
 */

const { v4: uuidv4 } = require('uuid');

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const now = new Date();

        // =====================================================
        // HANDLE DUPLICATES - DELETE EXISTING INTENTS
        // =====================================================
        const intentCodes = [
            ${intentCodes}
        ];

        console.log('Checking for existing intents...');

        // Check if any intents with these codes already exist
        const [existingIntents] = await queryInterface.sequelize.query(
            \`SELECT code FROM intents WHERE code IN (\${intentCodes.map(() => '?').join(',')})\`,
            { replacements: intentCodes }
        );

        if (existingIntents.length > 0) {
            console.log(\`Found \${existingIntents.length} existing intents - deleting before re-import...\`);

            // Delete intent_listeners first (foreign key constraint)
            await queryInterface.bulkDelete('intent_listeners', {
                listenerCode: {
                    [Sequelize.Op.in]: intentCodes
                }
            }, {});

            // Delete existing intents
            await queryInterface.bulkDelete('intents', {
                code: {
                    [Sequelize.Op.in]: intentCodes
                }
            }, {});

            console.log('Existing intents deleted successfully');
        }

        // =====================================================
        // INTENTS TABLE ENTRIES
        // =====================================================
        const intentsData = ${JSON.stringify(intents, null, 12)};

        // Add timestamps to each intent
        const intents = intentsData.map(intent => ({
            ...intent,
            createdAt: now,
            updatedAt: now
        }));

        // Insert intents
        console.log('Inserting ${intents.length} intents...');
        await queryInterface.bulkInsert('intents', intents, {});
${featureFlagSection}
        console.log('');
        console.log('✅ Dialogflow intents for ${clientName} seeded successfully');
        console.log('  - ${intents.length} intents imported');
        console.log('  - ${intents.filter(i => i.responseType === 'listener').length} webhook-enabled intents');
        console.log('  - ${intents.filter(i => i.entitySchema).length} intents with entity collection');${includeFeatureFlags ? `
        console.log('  - ${featureFlags.length} feature flags created (100% rollout)');` : ''}
    },

    down: async (queryInterface, Sequelize) => {
        // Extract all intent codes
        const intentCodes = [
            ${intentCodes}
        ];

        // Delete intents
        await queryInterface.bulkDelete('intents', {
            code: {
                [Sequelize.Op.in]: intentCodes
            }
        }, {});
${featureFlagDownSection}
        console.log('Dialogflow intents for ${clientName} removed');
    }
};
`;

    return { fileName, filePath, content: seederContent };
}

// =====================================================
// DOCUMENTATION GENERATION
// =====================================================

function ensureDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

function generateCategoryBreakdown(intents) {
    const categories = {};

    intents.forEach(intent => {
        const metadata = JSON.parse(intent.Metadata || '{}');
        const category = metadata.category || 'uncategorized';
        categories[category] = (categories[category] || 0) + 1;
    });

    return Object.entries(categories)
        .map(([category, count]) => `- **${category}**: ${count} intents`)
        .join('\n');
}

function generateIntentSummary(intents, clientName) {
    const content = `# Dialogflow Intent Export Summary - LLM Migration Mode

**Client:** ${clientName}
**Export Date:** ${new Date().toISOString()}
**Total Intents:** ${intents.length}
**Migration Mode:** 100% LLM Enabled

## Migration Configuration

- **LLM Provider:** OpenAI (gpt-4o-mini)
- **LLM Enabled:** All intents (100%)
- **Fallback to Dialogflow:** Disabled
- **Feature Flags:** Enabled at 100% rollout
- **Confidence Threshold:** 0.75 (default)
- **Duplicate Handling:** Safe to re-run - deletes existing before re-import

## Intent Categories

${generateCategoryBreakdown(intents)}

## Intent List

| Intent Code | Name | Type | Has Parameters | Webhook | Training Phrases |
|-------------|------|------|----------------|---------|------------------|
${intents.map(intent =>
        `| ${intent.code} | ${intent.name} | ${intent.type} | ${intent.entitySchema ? 'Yes' : 'No'} | ${intent.responseType === 'listener' ? 'Yes' : 'No'} | ${JSON.parse(intent.intentExamples || '[]').length} |`
    ).join('\n')}

## Implementation Notes

### Migration Status
- ✅ All intents have been imported to the database
- ✅ LLM classification enabled (100%)
- ✅ Feature flags configured for 100% rollout
- ⏳ Intent listeners need to be implemented for webhook-enabled intents
- ⏳ Test LLM classification accuracy
- ⏳ Monitor confidence scores and adjust thresholds

### Recommended Next Steps

1. **Review Intent Accuracy**
   - Verify all training phrases are appropriate
   - Check entity/parameter mappings
   - Ensure intent descriptions are clear for LLM classification

2. **Review Static Responses** ⚠️
   - Check all static response messages are appropriate
   - Verify button types are correct (intent/url/text)
   - Update button values to reference proper intent codes
   - Ensure button text is user-friendly
   - Remove or update any Dialogflow-specific references

3. **Implement Listeners**
   - Create listener classes for webhook intents
   - Register listeners in the LLM registry
   - Test listener functionality

4. **Test LLM Classification**
   - Test each intent with various user inputs
   - Monitor confidence scores
   - Adjust thresholds if needed
   - Validate entity extraction accuracy

5. **Production Readiness**
   - Unit test each intent
   - Integration test conversation flows
   - Load test LLM API calls
   - Set up monitoring and alerting
   - User acceptance testing

## Webhook-Enabled Intents

${intents.filter(i => i.responseType === 'listener').length > 0
        ? intents.filter(i => i.responseType === 'listener').map(i => `- **${i.code}**: ${i.name}`).join('\n')
        : '_No webhook-enabled intents_'}

## Intents with Parameters

${intents.filter(i => i.entitySchema).length > 0
        ? intents.filter(i => i.entitySchema).map(i => {
            const schema = JSON.parse(i.entitySchema);
            const params = Object.keys(schema).join(', ');
            return `- **${i.code}**: Collects ${params}`;
        }).join('\n')
        : '_No intents with parameters_'}
`;

    return content;
}

function generateEntityTable(entitySchema) {
    const headers = '| Parameter | Type | Required | Description |';
    const separator = '|-----------|------|----------|-------------|';

    const rows = Object.entries(entitySchema).map(([name, schema]) =>
        `| ${name} | ${schema.type} | ${schema.required ? 'Yes' : 'No'} | ${schema.description} |`
    );

    return [headers, separator, ...rows].join('\n');
}

function generateIntentDocument(intent) {
    const examples = JSON.parse(intent.intentExamples || '[]');
    const entitySchema = intent.entitySchema ? JSON.parse(intent.entitySchema) : null;
    const metadata = JSON.parse(intent.Metadata || '{}');

    const content = `# ${intent.name}

**Intent Code:** \`${intent.code}\`
**Type:** ${intent.type}
**Category:** ${metadata.category || 'N/A'}
**Priority:** ${intent.priority}

## Description

${intent.intentDescription}

## LLM Configuration (100% Migration)

- **LLM Enabled:** ✅ Yes (100% rollout)
- **LLM Provider:** ${intent.llmProvider} (gpt-4o-mini)
- **Confidence Threshold:** ${intent.confidenceThreshold}
- **Fallback to Dialogflow:** ❌ Disabled (full LLM migration)
- **Response Type:** ${intent.responseType}
- **Active:** ${intent.active ? '✅ Yes' : '❌ No'}

## Training Phrases

${examples.length > 0 ? examples.map(ex => `- "${ex}"`).join('\n') : '_No training phrases_'}

## Parameters / Entities

${entitySchema ? generateEntityTable(entitySchema) : '_No parameters_'}

${entitySchema ? `
### Entity Collection Strategy

This intent uses LLM-based entity collection to gather required parameters through natural conversation:
- Multi-turn conversation support (max ${JSON.parse(intent.conversationConfig || '{}').maxTurns || 5} turns)
- Follow-up questions for missing required parameters
- Natural language understanding for entity extraction
- Conversation timeout: ${JSON.parse(intent.conversationConfig || '{}').timeoutMinutes || 15} minutes
` : ''}

## Response Configuration

${intent.responseType === 'static' && intent.staticResponse
        ? `**Static Response:**\n\`\`\`json\n${intent.staticResponse}\n\`\`\`\n\n*Note: This intent returns a static response without executing business logic.*\n\n**Action Required:** Review and update button configurations:\n- Verify button \`type\` values are correct (intent/url/text)\n- Update button \`value\` to reference proper intent codes for type='intent'\n- Ensure message text is appropriate`
        : '**Dynamic Response:** Handled by intent listener\n\n*Note: This intent requires a listener implementation to execute business logic.*'}

## Migration Information

- **Source:** Dialogflow
- **Original Dialogflow ID:** ${metadata.originalDialogflowId || 'N/A'}
- **Migration Date:** ${metadata.migrationDate || 'N/A'}
- **Client:** ${metadata.clientName || 'N/A'}
- **Is Fallback Intent:** ${metadata.isFallback ? 'Yes' : 'No'}

## Implementation Status

- [x] Intent imported to database
- [x] LLM configuration enabled
- [ ] Listener implemented (if webhook-enabled)
- [ ] Testing completed
- [ ] LLM classification accuracy verified
- [ ] Production deployment approved

## Re-running the Seeder

⚠️ **Important**: If you re-run the seeder for this client:
- All intents with these codes will be **deleted** and **re-imported**
- All intent listeners will be **deleted** and must be re-registered
- All feature flags with these names will be **deleted** and **re-created**
- Any manual changes to these intents in the database will be **lost**

**Recommendation**: After initial import, manage intents through the database directly rather than re-running the seeder.

## Testing Checklist

- [ ] Test intent classification with various user inputs
- [ ] Verify confidence scores are above threshold (${intent.confidenceThreshold})
- [ ] Test entity extraction accuracy (if applicable)
- [ ] Validate response correctness
- [ ] Test edge cases and error handling
${intent.responseType === 'listener' ? '- [ ] Verify listener is registered and executes correctly' : ''}
- [ ] Load test with expected traffic volume

## Notes

_Add implementation notes, edge cases, or special handling requirements here._
`;

    return content;
}

function generateEntitySummary(intents) {
    const allParameters = new Map();

    intents.forEach(intent => {
        if (intent.entitySchema) {
            const schema = JSON.parse(intent.entitySchema);
            Object.entries(schema).forEach(([name, config]) => {
                if (!allParameters.has(name)) {
                    allParameters.set(name, {
                        name,
                        type: config.type,
                        usedIn: []
                    });
                }
                allParameters.get(name).usedIn.push(intent.code);
            });
        }
    });

    const content = `# Parameter / Entity Summary

**Total Unique Parameters:** ${allParameters.size}

## Parameter Reference

| Parameter Name | Type | Used In Intents | Intent Count |
|----------------|------|-----------------|--------------|
${Array.from(allParameters.values()).map(param =>
        `| ${param.name} | ${param.type} | ${param.usedIn.slice(0, 3).join(', ')}${param.usedIn.length > 3 ? '...' : ''} | ${param.usedIn.length} |`
    ).join('\n')}

## Detailed Parameter Usage

${Array.from(allParameters.values()).map(param => `
### ${param.name}

- **Type:** ${param.type}
- **Used in ${param.usedIn.length} intent(s):**
${param.usedIn.map(code => `  - \`${code}\``).join('\n')}
`).join('\n')}
`;

    return content;
}

function generateDocumentation(intents, clientName, docsBasePath) {
    const clientDocsPath = path.join(docsBasePath, clientName);

    // Create directory structure
    ensureDirectory(clientDocsPath);
    ensureDirectory(path.join(clientDocsPath, 'intents'));
    ensureDirectory(path.join(clientDocsPath, 'entities'));

    // Generate summary document
    const summaryContent = generateIntentSummary(intents, clientName);
    fs.writeFileSync(path.join(clientDocsPath, 'intent-summary.md'), summaryContent, 'utf8');

    // Generate individual intent documents
    intents.forEach(intent => {
        const intentContent = generateIntentDocument(intent);
        const fileName = `${intent.code}.md`;
        fs.writeFileSync(path.join(clientDocsPath, 'intents', fileName), intentContent, 'utf8');
    });

    // Generate entity/parameter summary
    const entityContent = generateEntitySummary(intents);
    fs.writeFileSync(path.join(clientDocsPath, 'entities', 'parameter-summary.md'), entityContent, 'utf8');

    return clientDocsPath;
}

// =====================================================
// MAIN SCRIPT
// =====================================================

async function main() {
    console.log('🚀 Dialogflow Intent Export Tool\n');

    try {
        // Step 1: Parse arguments
        console.log('📋 Step 1: Parsing arguments...');
        const { clientName, options } = parseArguments();
        console.log(`   Client: ${clientName}`);
        console.log(`   Migration Mode: 100% LLM Enabled`);
        if (options.dryRun) console.log('   Mode: DRY RUN (no files will be created)');
        if (options.skipDocs) console.log('   Skipping documentation generation');
        if (options.skipFlags) console.log('   Skipping feature flag generation');
        if (options.includeDisabled) console.log('   Including disabled intents (marked as active=false)');
        if (options.onlyDisabled) console.log('   Only exporting disabled intents');

        // Step 2: Load and validate configuration
        console.log('\n📁 Step 2: Loading configuration...');
        const config = await safeExecute(
            () => loadClientConfig(clientName),
            ErrorCategory.CONFIG,
            'load client configuration'
        );
        validateConfig(config);
        console.log('   ✓ Configuration loaded and validated');

        // Step 3: Initialize Dialogflow client
        console.log('\n🔌 Step 3: Connecting to Dialogflow...');
        const { intentsClient, projectId } = await safeExecute(
            () => initializeDialogflowClient(config),
            ErrorCategory.DIALOGFLOW_API,
            'initialize Dialogflow client'
        );
        console.log('   ✓ Connected to Dialogflow');

        // Step 4: Fetch intents
        console.log('\n📥 Step 4: Fetching intents from Dialogflow...');
        const dialogflowIntents = await safeExecute(
            () => fetchAllIntents(intentsClient, projectId),
            ErrorCategory.DIALOGFLOW_API,
            'fetch intents from Dialogflow'
        );
        console.log(`   ✓ Fetched ${dialogflowIntents.length} intents`);

        // Step 5: Transform data
        console.log('\n🔄 Step 5: Transforming intent data...');
        const allTransformedIntents = await safeExecute(
            () => Promise.all(dialogflowIntents.map(intent =>
                transformIntentToDbSchema(intent, clientName)
            )),
            ErrorCategory.DATA_TRANSFORM,
            'transform intent data'
        );

        // Filter based on options
        let transformedIntents;
        const disabledCount = allTransformedIntents.filter(i => !i.active).length;
        const enabledCount = allTransformedIntents.filter(i => i.active).length;

        if (options.onlyDisabled) {
            transformedIntents = allTransformedIntents.filter(i => !i.active);
            console.log(`   ✓ Filtered to ${transformedIntents.length} disabled intents only`);
        } else if (options.includeDisabled) {
            transformedIntents = allTransformedIntents;
            console.log(`   ✓ Transformed ${transformedIntents.length} intents (${enabledCount} enabled, ${disabledCount} disabled)`);
        } else {
            transformedIntents = allTransformedIntents.filter(i => i.active);
            console.log(`   ✓ Transformed ${transformedIntents.length} enabled intents (excluded ${disabledCount} disabled)`);
        }

        // Step 6: Generate seeder file
        if (!options.dryRun) {
            console.log('\n📝 Step 6: Generating seeder file...');
            const seedersPath = path.join(process.cwd(), 'src', 'database', 'seeders');
            const seederFile = await safeExecute(
                () => {
                    ensureDirectory(seedersPath);
                    const { fileName, filePath, content } = generateSeederFile(
                        transformedIntents,
                        clientName,
                        seedersPath,
                        !options.skipFlags  // includeFeatureFlags
                    );
                    fs.writeFileSync(filePath, content, 'utf8');
                    return { fileName, filePath };
                },
                ErrorCategory.FILE_IO,
                'generate seeder file'
            );
            console.log(`   ✓ Seeder file created: ${seederFile.fileName}`);
            console.log(`   Path: ${seederFile.filePath}`);
            if (!options.skipFlags) {
                console.log(`   ✓ Feature flags included (100% rollout)`);
            }
        } else {
            console.log('\n📝 Step 6: Skipping seeder file generation (dry run)');
        }

        // Step 7: Generate documentation
        if (!options.skipDocs && !options.dryRun) {
            console.log('\n📚 Step 7: Generating documentation...');
            const docsBasePath = path.join(process.cwd(), 'docs', 'dialogflow-exports');
            const docsPath = await safeExecute(
                () => generateDocumentation(transformedIntents, clientName, docsBasePath),
                ErrorCategory.FILE_IO,
                'generate documentation'
            );
            console.log(`   ✓ Documentation created: ${docsPath}`);
        } else {
            console.log('\n📚 Step 7: Skipping documentation generation');
        }

        // Step 8: Summary
        console.log('\n✅ Export completed successfully!\n');
        console.log('Summary:');
        console.log(`  - Intents exported: ${transformedIntents.length}`);
        console.log(`  - Intents with parameters: ${transformedIntents.filter(i => i.entitySchema).length}`);
        console.log(`  - Webhook-enabled intents: ${transformedIntents.filter(i => i.responseType === 'listener').length}`);
        console.log(`  - LLM configuration: 100% enabled (openai provider)`);
        console.log(`  - Fallback to Dialogflow: disabled`);
        console.log(`  - Duplicate handling: enabled (safe to re-run)`);
        console.log('');

        if (!options.dryRun) {
            console.log('Next steps:');
            console.log('  1. Review the generated seeder file');
            console.log('  2. ⚠️  IMPORTANT: Review static responses and button configurations');
            console.log('     - Update button types (intent/url/text)');
            console.log('     - Update button values to reference proper intent codes');
            if (!options.skipDocs) {
                console.log('  3. Review the documentation in docs/dialogflow-exports/');
            }
            console.log('  4. Run the seeder: npx sequelize-cli db:seed --seed <seeder-file>');
            console.log('     Note: Safe to re-run - will delete existing intents before re-import');
            console.log('  5. Implement intent listeners for webhook-enabled intents');
            if (!options.skipFlags) {
                console.log('  6. Verify feature flags are enabled (100% rollout)');
            }
            console.log('  7. Test the imported intents with LLM classification');
            console.log('  8. Monitor confidence scores and adjust thresholds as needed');
        }

    } catch (error) {
        handleError(error);
    }
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = {
    parseArguments,
    loadClientConfig,
    validateConfig,
    initializeDialogflowClient,
    fetchAllIntents,
    extractTrainingPhrases,
    extractParameters,
    transformIntentToDbSchema,
    generateSeederFile,
    generateDocumentation
};
