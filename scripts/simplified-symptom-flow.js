/**
 * Simplified Symptom Flow - Complete Deployment & Rollback Script
 * Date: 2026-03-16
 *
 * Usage:
 *   node scripts/simplified-symptom-flow.js deploy    # Deploy the simplified flow
 *   node scripts/simplified-symptom-flow.js rollback  # Rollback to old Dialogflow flow
 */

const { Sequelize } = require('sequelize');
const config = require('../src/data/database/sequelize/database.config.js');
const { execSync } = require('child_process');

const sequelize = new Sequelize(config.development);
const action = process.argv[2];

if (!action || !['deploy', 'rollback'].includes(action)) {
    console.error('\n❌ Invalid usage!');
    console.log('\nUsage:');
    console.log('  node scripts/simplified-symptom-flow.js deploy    # Deploy the simplified flow');
    console.log('  node scripts/simplified-symptom-flow.js rollback  # Rollback to old Dialogflow flow\n');
    process.exit(1);
}

// =====================================================
// DEPLOY FUNCTION
// =====================================================
async function deploy() {
    console.log('\n==========================================');
    console.log('SIMPLIFIED SYMPTOM FLOW - DEPLOYMENT');
    console.log('==========================================\n');

    try {
        // STEP 1: Test Database Connection
        console.log('Step 1: Testing database connection...');
        await sequelize.authenticate();
        console.log('✅ Database connection successful\n');

        // STEP 2: Delete ALL Simplified Flow Intents (cleanup duplicates)
        console.log('Step 2: Cleaning up all simplified flow intents...');
        await sequelize.query(`
            DELETE FROM intents
            WHERE code IN (
                'reportSymptoms',
                'symptomAnalysis',
                'provideImageYes',
                'provideImageNo',
                'medicationYes',
                'medicationNo'
            )
        `);
        console.log('✅ All simplified flow intents removed\n');

        // STEP 3: Create New Intents One by One
        console.log('Step 3: Creating new intents...\n');

        const intentsToCreate = [
            {
                code: 'reportSymptoms',
                name: 'Report Symptoms',
                responseType: 'listener',
                llmEnabled: 1,
                active: 1,
                entitySchema: null
            },
            {
                code: 'symptomAnalysis',
                name: 'Symptom Analysis',
                responseType: 'listener',
                llmEnabled: 1,
                active: 1,
                entitySchema: {
                    symptoms: {
                        type: 'array',
                        required: true,
                        description: 'User reported symptoms',
                        followUpQuestion: 'Please describe the symptoms you are experiencing.'
                    }
                }
            },
            {
                code: 'provideImageYes',
                name: 'Provide Image Yes',
                responseType: 'listener',
                llmEnabled: 1,
                active: 1,
                entitySchema: null
            },
            {
                code: 'provideImageNo',
                name: 'Provide Image No',
                responseType: 'listener',
                llmEnabled: 1,
                active: 1,
                entitySchema: null
            },
            {
                code: 'medicationYes',
                name: 'Medication Yes',
                responseType: 'listener',
                llmEnabled: 1,
                active: 1,
                entitySchema: null
            },
            {
                code: 'medicationNo',
                name: 'Medication No',
                responseType: 'listener',
                llmEnabled: 1,
                active: 1,
                entitySchema: null
            }
        ];

        for (const intent of intentsToCreate) {
            const entitySchemaJson = intent.entitySchema ? JSON.stringify(intent.entitySchema) : null;

            await sequelize.query(`
                INSERT INTO intents (id, code, name, responseType, llmEnabled, active, entitySchema, createdAt, updatedAt)
                VALUES (UUID(), ?, ?, ?, ?, ?, ?, NOW(), NOW())
            `, {
                replacements: [
                    intent.code,
                    intent.name,
                    intent.responseType,
                    intent.llmEnabled,
                    intent.active,
                    entitySchemaJson
                ]
            });

            console.log(`  ✓ Created: ${intent.code}`);
        }

        console.log('\n✅ All 6 new intents created\n');

        // STEP 4: Update eyeImage Intent
        console.log('Step 4: Updating eyeImage intent...');

        const eyeImageSchema = JSON.stringify({
            imageUrl: {
                type: 'array',
                required: true,
                description: 'Eye image URL',
                followUpQuestion: 'Please send a clear photo of your operated eye.'
            },
            medicalRecordNumber: {
                type: 'array',
                required: false,
                description: 'Medical record number (optional)'
            }
        });

        await sequelize.query(`
            UPDATE intents
            SET
                responseType = 'listener',
                llmEnabled = 1,
                active = 1,
                entitySchema = ?,
                updatedAt = NOW()
            WHERE code = 'eyeImage'
        `, {
            replacements: [eyeImageSchema]
        });

        console.log('✅ eyeImage intent updated\n');

        // STEP 5: Update Default Welcome Intent
        console.log('Step 5: Updating Default Welcome Intent...');

        const welcomeResponse = JSON.stringify({
            message: 'Welcome! How can I help you today?',
            buttons: [
                { text: 'Ask Questions', type: 'intent', value: 'fallback' },
                { text: 'Report Symptoms', type: 'intent', value: 'reportSymptoms' },
                { text: 'Find Nearest Location', type: 'intent', value: 'findNearestLocation' }
            ]
        });

        await sequelize.query(`
            UPDATE intents
            SET
                staticResponse = ?,
                responseType = 'static',
                llmEnabled = 1,
                active = 1,
                updatedAt = NOW()
            WHERE code = 'Default Welcome Intent'
        `, {
            replacements: [welcomeResponse]
        });

        console.log('✅ Default Welcome Intent updated\n');

        // STEP 6: Disable Old Dialogflow Intents
        console.log('Step 6: Disabling old Dialogflow intents...');

        await sequelize.query(`
            UPDATE intents
            SET active = 0, updatedAt = NOW()
            WHERE code IN (
                'conditionIdentification',
                'MoreSymptoms',
                'KerotoplastyFollowUp',
                'responseYes',
                'responseNo'
            )
        `);

        console.log('✅ Old intents disabled\n');

        // STEP 7: Delete Old Listeners
        console.log('Step 7: Removing old intent_listeners...');

        await sequelize.query(`
            DELETE FROM intent_listeners
            WHERE listenerCode IN (
                'conditionIdentification',
                'MoreSymptoms',
                'KerotoplastyFollowUp',
                'responseYes',
                'responseNo'
            )
        `);

        console.log('✅ Old listeners removed\n');

        // STEP 8: Verify Intents
        console.log('Step 8: Verifying intents...\n');

        const [intents] = await sequelize.query(`
            SELECT code, name, responseType, llmEnabled, active
            FROM intents
            WHERE code IN (
                'reportSymptoms',
                'symptomAnalysis',
                'provideImageYes',
                'provideImageNo',
                'eyeImage',
                'medicationYes',
                'medicationNo'
            )
            ORDER BY code
        `);

        console.log('Intents in Database:');
        intents.forEach(i => {
            console.log(`  - ${i.code}: ${i.name} (Type: ${i.responseType}, Active: ${i.active})`);
        });

        if (intents.length !== 7) {
            throw new Error(`Expected 7 intents, found ${intents.length}`);
        }

        console.log('\n✅ All 7 intents verified\n');

        // STEP 9: Run Seeder
        console.log('Step 9: Running intent_listeners seeder...\n');

        execSync('npx sequelize-cli db:seed --seed 20260316120000-simplified-symptom-listeners.js', {
            encoding: 'utf8',
            stdio: 'inherit'
        });

        // STEP 10: Verify Listeners
        console.log('\nStep 10: Verifying listeners...\n');

        const [listeners] = await sequelize.query(`
            SELECT listenerCode, handlerPath, enabled
            FROM intent_listeners
            WHERE listenerCode IN (
                'reportSymptoms',
                'symptomAnalysis',
                'provideImageYes',
                'provideImageNo',
                'eyeImage',
                'medicationYes',
                'medicationNo'
            )
            ORDER BY listenerCode
        `);

        console.log('Listeners Created:');
        listeners.forEach(l => {
            const className = l.handlerPath.split(':')[1];
            console.log(`  - ${l.listenerCode} -> ${className} (Enabled: ${l.enabled})`);
        });

        if (listeners.length !== 7) {
            throw new Error(`Expected 7 listeners, found ${listeners.length}`);
        }

        console.log('\n✅ All 7 listeners verified\n');

        // STEP 11: Summary
        console.log('==========================================');
        console.log('DEPLOYMENT SUCCESSFUL!');
        console.log('==========================================\n');
        console.log('✅ Database cleaned up');
        console.log('✅ 7 new intents created');
        console.log('✅ Old intents disabled');
        console.log('✅ 7 listeners created');
        console.log('\n==========================================');
        console.log('NEXT STEPS');
        console.log('==========================================\n');
        console.log('1. Build the application:');
        console.log('   npm run build\n');
        console.log('2. Restart the application:');
        console.log('   npm run start\n');
        console.log('3. Test the flow by sending "Hello"\n');
        console.log('==========================================\n');

    } catch (error) {
        console.error('\n❌ Deployment failed:', error.message);
        console.error('\nStack trace:', error.stack);
        process.exit(1);
    }
}

// =====================================================
// ROLLBACK FUNCTION
// =====================================================
async function rollback() {
    console.log('\n==========================================');
    console.log('SIMPLIFIED SYMPTOM FLOW - ROLLBACK');
    console.log('==========================================\n');

    try {
        // STEP 1: Test Database Connection
        console.log('Step 1: Testing database connection...');
        await sequelize.authenticate();
        console.log('✅ Database connection successful\n');

        // STEP 2: Re-enable Old Dialogflow Intents
        console.log('Step 2: Re-enabling old Dialogflow intents...');

        await sequelize.query(`
            UPDATE intents
            SET active = 1, updatedAt = NOW()
            WHERE code IN (
                'conditionIdentification',
                'MoreSymptoms',
                'KerotoplastyFollowUp',
                'responseYes',
                'responseNo'
            )
        `);

        console.log('✅ Old intents re-enabled\n');

        // STEP 3: Disable New Simplified Intents
        console.log('Step 3: Disabling new simplified intents...');

        await sequelize.query(`
            UPDATE intents
            SET active = 0, updatedAt = NOW()
            WHERE code IN (
                'reportSymptoms',
                'symptomAnalysis',
                'provideImageYes',
                'provideImageNo',
                'medicationYes',
                'medicationNo'
            )
        `);

        console.log('✅ New intents disabled\n');

        // STEP 4: Remove New intent_listeners
        console.log('Step 4: Removing new intent_listeners...');

        await sequelize.query(`
            DELETE FROM intent_listeners
            WHERE listenerCode IN (
                'reportSymptoms',
                'symptomAnalysis',
                'provideImageYes',
                'provideImageNo',
                'eyeImage',
                'medicationYes',
                'medicationNo'
            )
        `);

        console.log('✅ New listeners removed\n');

        // STEP 5: Verify Old Intents
        console.log('Step 5: Verifying old intents...\n');

        const [oldIntents] = await sequelize.query(`
            SELECT code, name, active
            FROM intents
            WHERE code IN (
                'conditionIdentification',
                'MoreSymptoms',
                'KerotoplastyFollowUp',
                'responseYes',
                'responseNo'
            )
            ORDER BY code
        `);

        console.log('Old Intents Status:');
        oldIntents.forEach(i => {
            console.log(`  - ${i.code}: Active = ${i.active} ${i.active === 1 ? '✅' : '⚠️'}`);
        });

        // STEP 6: Verify New Intents Disabled
        const [newIntents] = await sequelize.query(`
            SELECT code, name, active
            FROM intents
            WHERE code IN (
                'reportSymptoms',
                'symptomAnalysis',
                'provideImageYes',
                'provideImageNo',
                'medicationYes',
                'medicationNo'
            )
            ORDER BY code
        `);

        console.log('\nNew Intents Status:');
        newIntents.forEach(i => {
            console.log(`  - ${i.code}: Active = ${i.active} ${i.active === 0 ? '✅' : '⚠️'}`);
        });

        // STEP 7: Restore Old Dialogflow Listeners
        console.log('\nStep 6: Restoring old Dialogflow listeners...\n');

        execSync('npx sequelize-cli db:seed --seed 20260315093000-add-dialogflow-symptom-listeners.js', {
            encoding: 'utf8',
            stdio: 'inherit'
        });

        console.log('\n✅ Old listeners restored\n');

        // STEP 8: Summary
        console.log('==========================================');
        console.log('ROLLBACK SUCCESSFUL!');
        console.log('==========================================\n');
        console.log('✅ Old Dialogflow intents re-enabled');
        console.log('✅ New simplified intents disabled');
        console.log('✅ New listeners removed');
        console.log('✅ Old listeners restored');
        console.log('\n==========================================');
        console.log('NEXT STEPS');
        console.log('==========================================\n');
        console.log('1. Build the application:');
        console.log('   npm run build\n');
        console.log('2. Restart the application:');
        console.log('   npm run start\n');
        console.log('3. Verify old flow works\n');
        console.log('==========================================\n');

    } catch (error) {
        console.error('\n❌ Rollback failed:', error.message);
        console.error('\nStack trace:', error.stack);
        process.exit(1);
    }
}

// =====================================================
// MAIN EXECUTION
// =====================================================
async function main() {
    try {
        if (action === 'deploy') {
            await deploy();
        } else if (action === 'rollback') {
            await rollback();
        }
    } finally {
        await sequelize.close();
    }
}

main();
