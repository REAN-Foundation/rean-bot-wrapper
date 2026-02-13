#!/usr/bin/env node

/**
 * Database Migration Script
 *
 * This script fetches database credentials from AWS Secrets Manager and runs
 * migrations across all schemas.
 *
 * Usage:
 *   node scripts/run-migrations.js <environment>
 *
 * Environment Variables Required:
 *   - ROLE_ARN: AWS role ARN for cross-account access
 *   - region: AWS region for Secrets Manager
 *   - SECRET_NAME_LIST: Comma-separated list of secret names
 *
 * Example:
 *   SECRET_NAME_LIST=tenant1-db,tenant2-db,tenant3-db node scripts/run-migrations.js production
 */

const AWS = require('aws-sdk');
const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

// ANSI color codes for better readability
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

class MigrationRunner {
    constructor(environment, specificMigration = null) {
        this.environment = environment;
        this.specificMigration = specificMigration;
        this.results = [];
    }

    /**
     * Get cross-account AWS credentials using STS
     */
    async getCrossAccountCredentials() {
        return new Promise((resolve, reject) => {
            const sts = new AWS.STS();
            const timestamp = new Date().getTime();
            const params = {
                RoleArn: process.env.ROLE_ARN,
                RoleSessionName: `migration-script-${timestamp}`
            };
            console.log(params)

            this.log('Assuming AWS role...', 'cyan');

            sts.assumeRole(params, (err, data) => {
                if (err) {
                    this.log(`Failed to assume role: ${err.message}`, 'red');
                    reject(err);
                } else {
                    this.log('✓ Successfully assumed AWS role', 'green');
                    resolve({
                        accessKeyId: data.Credentials.AccessKeyId,
                        secretAccessKey: data.Credentials.SecretAccessKey,
                        sessionToken: data.Credentials.SessionToken,
                    });
                }
            });
        });
    }

    /**
     * Fetch all secrets from AWS Secrets Manager
     */
    async getSecrets() {
        const responseCredentials = await this.getCrossAccountCredentials();
        const region = process.env.region;
        const secretNameList = process.env.SECRET_NAME_LIST.split(',').map(s => s.trim());

        this.log(`\nFetching ${secretNameList.length} secrets from AWS Secrets Manager...`, 'cyan');

        const client = new AWS.SecretsManager({
            region: region,
            accessKeyId: responseCredentials.accessKeyId,
            secretAccessKey: responseCredentials.secretAccessKey,
            sessionToken: responseCredentials.sessionToken
        });

        const secretObjectList = [];

        for (const secretName of secretNameList) {
            try {
                this.log(`  Fetching secret: ${secretName}`, 'blue');
                const responseSecretValue = await client.getSecretValue({ SecretId: secretName }).promise();
                const secretStringToObj = JSON.parse(responseSecretValue.SecretString);
                secretObjectList.push(secretStringToObj);
                this.log(`  ✓ Fetched: ${secretName}`, 'green');
            } catch (error) {
                this.log(`  ✗ Failed to fetch ${secretName}: ${error.message}`, 'red');
                throw error;
            }
        }

        return secretObjectList;
    }

    /**
     * Parse database configuration from secrets
     */
    parseDbConfig(secret) {
        return {
            username: secret.DB_USER_NAME || secret.username,
            password: secret.DB_PASSWORD || secret.password,
            database: secret.DATA_BASE_NAME || secret.database,
            host: secret.DB_HOST || secret.host,
            dialect: 'mysql',
            port: secret.DB_PORT || secret.port || '3306'
        };
    }

    /**
     * Run migrations for a single database
     */
    async runMigrationsForSchema(dbConfig, index) {
        const schemaName = dbConfig.database;
        const result = {
            schema: schemaName,
            success: false,
            migrations: [],
            errors: []
        };

        try {
            this.log(`\n${'='.repeat(70)}`, 'cyan');
            this.log(`[${index + 1}] Running migrations for schema: ${schemaName}`, 'bright');
            this.log(`    Host: ${dbConfig.host}:${dbConfig.port}`, 'blue');
            this.log(`${'='.repeat(70)}`, 'cyan');

            // Create Sequelize instance
            const sequelize = new Sequelize(
                dbConfig.database,
                dbConfig.username,
                dbConfig.password,
                {
                    host: dbConfig.host,
                    port: dbConfig.port,
                    dialect: dbConfig.dialect,
                    logging: false // Disable query logging for cleaner output
                }
            );

            // Test connection
            await sequelize.authenticate();
            this.log('✓ Database connection successful', 'green');

            const queryInterface = sequelize.getQueryInterface();
            const migrationsPath = path.join(__dirname, '../src/database/migrations');

            // Ensure SequelizeMeta table exists
            await this.ensureMetaTable(queryInterface);

            // Get executed migrations
            const [executedMigrations] = await sequelize.query(
                'SELECT name FROM SequelizeMeta ORDER BY name'
            );
            const executedNames = executedMigrations.map(m => m.name);

            // Get all migration files
            const migrationFiles = fs.readdirSync(migrationsPath)
                .filter(f => f.endsWith('.js'))
                .sort();

            // Determine pending migrations
            let pendingMigrations = migrationFiles.filter(f => !executedNames.includes(f));

            // If specific migration is requested, filter to only that migration
            if (this.specificMigration) {
                const requestedFile = this.specificMigration.endsWith('.js')
                    ? this.specificMigration
                    : `${this.specificMigration}.js`;

                // Check if migration file exists
                if (!migrationFiles.includes(requestedFile)) {
                    throw new Error(`Migration file not found: ${requestedFile}`);
                }

                // Check if already executed
                if (executedNames.includes(requestedFile)) {
                    this.log(`\n⚠ Migration already executed: ${requestedFile}`, 'yellow');
                    this.log('  To re-run, first remove it from SequelizeMeta table', 'yellow');
                    result.success = true;
                    result.migrations = [{ name: requestedFile, status: 'already_executed' }];
                    await sequelize.close();
                    this.results.push(result);
                    return result;
                }

                // Filter to only the requested migration
                pendingMigrations = [requestedFile];
                this.log(`\n📌 Specific migration requested: ${requestedFile}`, 'cyan');
            }

            this.log(`\nMigration Status:`, 'cyan');
            this.log(`  Executed: ${executedNames.length}`, 'green');
            this.log(`  Pending: ${pendingMigrations.length}`, pendingMigrations.length > 0 ? 'yellow' : 'green');

            if (pendingMigrations.length === 0) {
                this.log('\n✓ No pending migrations - database is up to date', 'green');
                result.success = true;
                result.migrations = executedNames.map(name => ({ name, status: 'already_executed' }));
            } else {
                const migrationWord = this.specificMigration ? 'migration' : 'migration(s)';
                this.log(`\nExecuting ${pendingMigrations.length} pending ${migrationWord}...`, 'yellow');

                // Execute each pending migration
                for (const migrationFile of pendingMigrations) {
                    try {
                        this.log(`  Running: ${migrationFile}`, 'blue');

                        const migrationPath = path.join(migrationsPath, migrationFile);
                        const migration = require(migrationPath);

                        // Run the up migration
                        await migration.up(queryInterface, Sequelize);

                        // Record in SequelizeMeta
                        await sequelize.query(
                            'INSERT INTO SequelizeMeta (name) VALUES (?)',
                            { replacements: [migrationFile] }
                        );

                        this.log(`  ✓ Completed: ${migrationFile}`, 'green');

                        result.migrations.push({
                            name: migrationFile,
                            status: 'executed'
                        });

                    } catch (migError) {
                        this.log(`  ✗ Failed: ${migrationFile}`, 'red');
                        this.log(`    Error: ${migError.message}`, 'red');
                        throw new Error(`Migration ${migrationFile} failed: ${migError.message}`);
                    }
                }

                this.log(`\n✓ Successfully executed ${pendingMigrations.length} migration(s)`, 'green');
                result.success = true;
            }

            await sequelize.close();

        } catch (error) {
            this.log(`\n✗ Migration failed for ${schemaName}`, 'red');
            this.log(`  Error: ${error.message}`, 'red');
            result.errors.push(error.message);
            result.success = false;
        }

        this.results.push(result);
        return result;
    }

    /**
     * Ensure SequelizeMeta table exists
     */
    async ensureMetaTable(queryInterface) {
        try {
            await queryInterface.createTable('SequelizeMeta', {
                name: {
                    type: Sequelize.STRING,
                    allowNull: false,
                    unique: true,
                    primaryKey: true
                }
            });
            this.log('✓ Created SequelizeMeta table', 'green');
        } catch (error) {
            // Table already exists, ignore
            if (!error.message.includes('already exists')) {
                throw error;
            }
        }
    }

    /**
     * Run migrations for all schemas
     */
    async runAllMigrations() {
        try {
            // Fetch secrets
            const secrets = await this.getSecrets();

            this.log(`\n${'='.repeat(70)}`, 'bright');
            this.log(`Starting migrations for ${secrets.length} database(s)`, 'bright');
            this.log(`Environment: ${this.environment}`, 'bright');
            if (this.specificMigration) {
                this.log(`Target Migration: ${this.specificMigration}`, 'bright');
            }
            this.log(`${'='.repeat(70)}\n`, 'bright');

            // Run migrations for each schema
            for (let i = 0; i < secrets.length; i++) {
                const dbConfig = this.parseDbConfig(secrets[i]);
                await this.runMigrationsForSchema(dbConfig, i);
            }

            // Print summary
            this.printSummary();

            // Exit with appropriate code
            const allSucceeded = this.results.every(r => r.success);
            process.exit(allSucceeded ? 0 : 1);

        } catch (error) {
            this.log(`\n✗ Critical error: ${error.message}`, 'red');
            this.log(error.stack, 'red');
            process.exit(1);
        }
    }

    /**
     * Print migration summary
     */
    printSummary() {
        this.log(`\n\n${'='.repeat(70)}`, 'bright');
        this.log('MIGRATION SUMMARY', 'bright');
        this.log(`${'='.repeat(70)}`, 'bright');

        const successful = this.results.filter(r => r.success);
        const failed = this.results.filter(r => !r.success);

        this.log(`\nTotal Schemas: ${this.results.length}`, 'cyan');
        this.log(`Successful: ${successful.length}`, successful.length > 0 ? 'green' : 'yellow');
        this.log(`Failed: ${failed.length}`, failed.length > 0 ? 'red' : 'green');

        if (successful.length > 0) {
            this.log(`\n✓ Successful Schemas:`, 'green');
            successful.forEach(r => {
                const newMigrations = r.migrations.filter(m => m.status === 'executed').length;
                const status = newMigrations > 0
                    ? `${newMigrations} new migration(s) executed`
                    : 'already up to date';
                this.log(`  • ${r.schema} - ${status}`, 'green');
            });
        }

        if (failed.length > 0) {
            this.log(`\n✗ Failed Schemas:`, 'red');
            failed.forEach(r => {
                this.log(`  • ${r.schema}`, 'red');
                r.errors.forEach(err => {
                    this.log(`    - ${err}`, 'red');
                });
            });
        }

        this.log(`\n${'='.repeat(70)}\n`, 'bright');
    }

    /**
     * Utility function for colored logging
     */
    log(message, color = 'reset') {
        console.log(`${colors[color]}${message}${colors.reset}`);
    }
}

// Main execution
(async () => {
    // Validate arguments
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.error(`${colors.red}Error: Environment parameter is required${colors.reset}`);
        console.log(`\nUsage: node scripts/run-migrations.js <environment> [migration-file]`);
        console.log(`\nExamples:`);
        console.log(`  # Run all pending migrations`);
        console.log(`  SECRET_NAME_LIST=tenant1,tenant2 node scripts/run-migrations.js production`);
        console.log(`\n  # Run specific migration only`);
        console.log(`  SECRET_NAME_LIST=tenant1,tenant2 node scripts/run-migrations.js production 20260206120000-add-node-required-flag.js`);
        console.log(`\n  # Can omit .js extension`);
        console.log(`  SECRET_NAME_LIST=tenant1,tenant2 node scripts/run-migrations.js production 20260206120000-add-node-required-flag`);
        process.exit(1);
    }

    const environment = args[0];
    const specificMigration = args[1] || null;

    // Validate required environment variables
    const requiredEnvVars = ['ROLE_ARN', 'region', 'SECRET_NAME_LIST'];
    const missingVars = requiredEnvVars.filter(v => !process.env[v]);

    if (missingVars.length > 0) {
        console.error(`${colors.red}Error: Missing required environment variables:${colors.reset}`);
        missingVars.forEach(v => console.error(`  - ${v}`));
        console.log(`\nExample:`);
        console.log(`  ROLE_ARN=arn:aws:iam::123456789:role/MyRole \\`);
        console.log(`  region=us-east-1 \\`);
        console.log(`  SECRET_NAME_LIST=tenant1-db,tenant2-db \\`);
        console.log(`  node scripts/run-migrations.js production`);
        process.exit(1);
    }

    // Run migrations
    const runner = new MigrationRunner(environment, specificMigration);

    if (specificMigration) {
        console.log(`${colors.cyan}Running specific migration: ${specificMigration}${colors.reset}\n`);
    }

    await runner.runAllMigrations();
})();
