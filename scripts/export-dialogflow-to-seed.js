/**
 * Script: Export Dialogflow Intents to Database Seed
 *
 * Pulls all intents and entities from a Dialogflow project and generates:
 * 1. Database seeder file for the intents table
 * 2. Human-readable documentation of all intents
 *
 * Usage:
 *   node scripts/export-dialogflow-to-seed.js <client-name>
 *   node scripts/export-dialogflow-to-seed.js <client-name> --dry-run
 *   node scripts/export-dialogflow-to-seed.js <client-name> --skip-docs
 *
 * Requirements:
 *   - Client configuration JSON file in project root: {client-name}.json
 *   - Configuration must contain:
 *     - DIALOGFLOW_BOT_GCP_PROJECT_CREDENTIALS (path to service account JSON)
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
                console.log('- Ensure GCP credentials path is valid');
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
        console.log('Usage: node scripts/export-dialogflow-to-seed.js <client-name>');
        console.log('');
        console.log('Example:');
        console.log('  node scripts/export-dialogflow-to-seed.js lvpei');
        console.log('');
        console.log('This will look for lvpei.json in the project root directory.');
        process.exit(1);
    }

    const clientName = args[0];

    const options = {
        skipDocs: args.includes('--skip-docs'),
        dryRun: args.includes('--dry-run')
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

    // Validate GCP credentials file exists
    const gcpCredsPath = config.DIALOGFLOW_BOT_GCP_PROJECT_CREDENTIALS;
    if (!fs.existsSync(gcpCredsPath)) {
        throw new DialogflowExportError(
            `GCP credentials file not found: ${gcpCredsPath}`,
            ErrorCategory.CONFIG,
            { path: gcpCredsPath }
        );
    }

    return true;
}

// =====================================================
// DIALOGFLOW API INTEGRATION
// =====================================================

async function initializeDialogflowClient(config) {
    const gcpCredsPath = config.DIALOGFLOW_BOT_GCP_PROJECT_CREDENTIALS;
    const projectId = config.DIALOGFLOW_PROJECT_ID;

    // Load GCP credentials from file
    const gcpCredentials = JSON.parse(fs.readFileSync(gcpCredsPath, 'utf8'));

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

function extractStaticResponse(intent) {
    if (!intent.messages || intent.messages.length === 0) {
        return null;
    }

    const responses = [];
    intent.messages.forEach(message => {
        if (message.text && message.text.text) {
            responses.push(...message.text.text);
        }
    });

    return responses.length > 0 ? JSON.stringify({ responses }) : null;
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

    return `Dialogflow intent: ${dialogflowIntent.displayName}. ` +
        `Collects parameters: ${paramList}. ` +
        `Webhook enabled: ${hasWebhook(dialogflowIntent)}.`;
}

function transformIntentToDbSchema(dialogflowIntent, clientName) {
    const intentCode = dialogflowIntent.displayName;
    const intentName = generateIntentName(intentCode);
    const trainingPhrases = extractTrainingPhrases(dialogflowIntent);
    const entitySchema = extractParameters(dialogflowIntent);
    const intentType = determineIntentType(dialogflowIntent);

    return {
        id: uuidv4(),
        name: intentName,
        code: intentCode,
        type: intentType,
        Metadata: JSON.stringify({
            category: extractCategory(intentCode),
            source: 'dialogflow_migration',
            clientName: clientName,
            originalDialogflowId: dialogflowIntent.name,
            migrationDate: new Date().toISOString()
        }),

        // LLM Configuration (initially disabled)
        llmEnabled: false,
        llmProvider: 'dialogflow',

        intentDescription: generateIntentDescription(dialogflowIntent),
        intentExamples: JSON.stringify(trainingPhrases),
        entitySchema: entitySchema ? JSON.stringify(entitySchema) : null,

        conversationConfig: JSON.stringify({
            maxTurns: 5,
            timeoutMinutes: 15,
            followUpStrategy: 'default'
        }),

        confidenceThreshold: 0.75,
        fallbackToDialogflow: true,
        priority: dialogflowIntent.priority || 0,
        active: true,

        // Response configuration
        responseType: hasWebhook(dialogflowIntent) ? 'listener' : 'static',
        staticResponse: extractStaticResponse(dialogflowIntent),

        createdAt: new Date(),
        updatedAt: new Date()
    };
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

function generateSeederFile(intents, clientName, outputPath) {
    const timestamp = formatTimestamp();
    const fileName = `${timestamp}-dialogflow-${clientName}-intents.js`;
    const filePath = path.join(outputPath, fileName);

    const intentCodes = intents.map(i => `'${i.code}'`).join(',\n            ');

    const seederContent = `/**
 * Seeder: Dialogflow Intent Migration - ${clientName}
 *
 * Generated on: ${new Date().toISOString()}
 * Source: Dialogflow project
 * Client: ${clientName}
 *
 * This seeder imports ${intents.length} intents from Dialogflow.
 * After running this seeder, you should:
 * 1. Review the imported intents
 * 2. Set up intent listeners for webhook-enabled intents
 * 3. Gradually enable LLM for specific intents
 * 4. Test each intent thoroughly
 */

const { v4: uuidv4 } = require('uuid');

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const now = new Date();

        // =====================================================
        // INTENTS TABLE ENTRIES
        // =====================================================
        const intents = ${JSON.stringify(intents, null, 12)};

        // Insert intents
        await queryInterface.bulkInsert('intents', intents, {});

        console.log('Dialogflow intents for ${clientName} seeded successfully');
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
    const content = `# Dialogflow Intent Export Summary

**Client:** ${clientName}
**Export Date:** ${new Date().toISOString()}
**Total Intents:** ${intents.length}

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
- ⏳ Intent listeners need to be implemented for webhook-enabled intents
- ⏳ LLM integration should be enabled gradually after testing
- ⏳ Review and update intent descriptions for clarity

### Recommended Next Steps

1. **Review Intent Accuracy**
   - Verify all training phrases are appropriate
   - Check entity/parameter mappings

2. **Implement Listeners**
   - Create listener classes for webhook intents
   - Test listener functionality

3. **Enable LLM Gradually**
   - Start with simple intents
   - Monitor confidence scores
   - Adjust thresholds as needed

4. **Testing Plan**
   - Unit test each intent
   - Integration test conversation flows
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

## Configuration

- **LLM Enabled:** ${intent.llmEnabled ? 'Yes' : 'No'}
- **LLM Provider:** ${intent.llmProvider}
- **Confidence Threshold:** ${intent.confidenceThreshold}
- **Fallback to Dialogflow:** ${intent.fallbackToDialogflow ? 'Yes' : 'No'}
- **Response Type:** ${intent.responseType}

## Training Phrases

${examples.length > 0 ? examples.map(ex => `- "${ex}"`).join('\n') : '_No training phrases_'}

## Parameters / Entities

${entitySchema ? generateEntityTable(entitySchema) : '_No parameters_'}

## Response Configuration

${intent.responseType === 'static' && intent.staticResponse
        ? `**Static Response:**\n\`\`\`json\n${intent.staticResponse}\n\`\`\``
        : '**Dynamic Response:** Handled by intent listener'}

## Migration Information

- **Source:** Dialogflow
- **Original Dialogflow ID:** ${metadata.originalDialogflowId || 'N/A'}
- **Migration Date:** ${metadata.migrationDate || 'N/A'}
- **Client:** ${metadata.clientName || 'N/A'}

## Implementation Status

- [ ] Intent imported to database
- [ ] Listener implemented (if webhook-enabled)
- [ ] Testing completed
- [ ] LLM integration tested
- [ ] Production deployment approved

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
        if (options.dryRun) console.log('   Mode: DRY RUN (no files will be created)');
        if (options.skipDocs) console.log('   Skipping documentation generation');

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
        const transformedIntents = await safeExecute(
            () => Promise.all(dialogflowIntents.map(intent =>
                transformIntentToDbSchema(intent, clientName)
            )),
            ErrorCategory.DATA_TRANSFORM,
            'transform intent data'
        );
        console.log(`   ✓ Transformed ${transformedIntents.length} intents`);

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
                        seedersPath
                    );
                    fs.writeFileSync(filePath, content, 'utf8');
                    return { fileName, filePath };
                },
                ErrorCategory.FILE_IO,
                'generate seeder file'
            );
            console.log(`   ✓ Seeder file created: ${seederFile.fileName}`);
            console.log(`   Path: ${seederFile.filePath}`);
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
        console.log('');

        if (!options.dryRun) {
            console.log('Next steps:');
            console.log('  1. Review the generated seeder file');
            if (!options.skipDocs) {
                console.log('  2. Review the documentation in docs/dialogflow-exports/');
            }
            console.log('  3. Run the seeder: npx sequelize-cli db:seed --seed <seeder-file>');
            console.log('  4. Implement intent listeners for webhook-enabled intents');
            console.log('  5. Test the imported intents');
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
