# Dialogflow Replacement - Database Migration Plan

**Branch**: `feature/replace-dialogflow`
**Date**: 2026-02-18
**Status**: Ready for Execution
**Related Document**: [Intent Migration Plan](./2026-02-03-intent-migration-plan.md)

---

## Overview

This document outlines the database migration strategy for the Dialogflow replacement project. The migrations add LLM-based intent classification, entity collection, and feature flagging capabilities to the system.

---

## Migration Files

The following migration files need to be applied:

| Order | File | Description | Tables Affected |
|-------|------|-------------|-----------------|
| 1 | `20260106000000-create-intent-listeners.js` | Creates intent_listeners table | intent_listeners (NEW) |
| 2 | `20260106000001-extend-intents-for-llm.js` | Adds LLM configuration columns to intents | intents |
| 3 | `20260106000002-extend-intent-listeners.js` | Extends intent_listeners with handler config | intent_listeners |
| 4 | `20260106000003-create-feature-flags.js` | Creates feature_flags table | feature_flags (NEW) |
| 5 | `20260106000004-create-llm-provider-config.js` | Creates llm_provider_config table | llm_provider_config (NEW) |
| 6 | `20260106000005-create-intent-classification-logs.js` | Creates intent_classification_logs table | intent_classification_logs (NEW) |
| 7 | `20260106000006-create-entity-collection-sessions.js` | Creates entity_collection_sessions table | entity_collection_sessions (NEW) |
| 8 | `20260205000001-add-intent-response-config.js` | Adds response type columns to intents | intents |
| 9 | `20260205000002-fix-intents-id-to-uuid.js` | Converts intents.id from INT to UUID | intents, intent_listeners, intent_classification_logs, entity_collection_sessions |

---

## Database Schema Changes Summary

### New Tables Created

#### 1. intent_listeners
Stores registered handlers for each intent.

**Columns:**
- `id` (INT, PK, AUTO_INCREMENT)
- `intentId` (VARCHAR(36), FK to intents.id)
- `listenerCode` (VARCHAR(128))
- `sequence` (INT)
- `handlerType` (ENUM: 'function', 'class', 'service')
- `handlerPath` (VARCHAR(255))
- `handlerConfig` (JSON)
- `enabled` (BOOLEAN)
- `executionMode` (ENUM: 'sequential', 'parallel')
- `createdAt` (DATE)
- `updatedAt` (DATE)

#### 2. feature_flags
Controls feature rollout and A/B testing.

**Columns:**
- `id` (UUID, PK)
- `flagName` (VARCHAR(128), UNIQUE)
- `description` (TEXT)
- `enabled` (BOOLEAN)
- `rolloutPercentage` (INT)
- `targetIntents` (JSON)
- `targetUsers` (JSON)
- `targetPlatforms` (JSON)
- `environments` (JSON)
- `expiresAt` (DATE)
- `createdAt` (DATE)
- `updatedAt` (DATE)

#### 3. llm_provider_config
Configuration for different LLM providers.

**Columns:**
- `id` (UUID, PK)
- `providerName` (VARCHAR(100))
- `modelName` (VARCHAR(100))
- `apiConfig` (JSON)
- `supportsIntentClassification` (BOOLEAN)
- `supportsEntityExtraction` (BOOLEAN)
- `supportsMultilingual` (BOOLEAN)
- `maxTokens` (INT)
- `temperature` (FLOAT)
- `timeoutMs` (INT)
- `costPer1kTokens` (FLOAT)
- `enabled` (BOOLEAN)
- `priority` (INT)
- `createdAt` (DATE)
- `updatedAt` (DATE)

#### 4. intent_classification_logs
Logs all intent classification attempts for analytics.

**Columns:**
- `id` (UUID, PK)
- `intentId` (VARCHAR(36), FK to intents.id)
- `userPlatformId` (VARCHAR(255))
- `userMessage` (TEXT)
- `detectedLanguage` (VARCHAR(10))
- `llmProvider` (VARCHAR(50))
- `llmModel` (VARCHAR(100))
- `classifiedIntent` (VARCHAR(128))
- `confidenceScore` (FLOAT)
- `classificationMethod` (ENUM: 'llm', 'dialogflow', 'button')
- `fallbackTriggered` (BOOLEAN)
- `dialogflowResult` (JSON)
- `processingTimeMs` (INT)
- `tokenUsage` (JSON)
- `createdAt` (DATE)
- `updatedAt` (DATE)

**Indexes:**
- idx_classification_logs_user_platform_id
- idx_classification_logs_intent_id
- idx_classification_logs_method
- idx_classification_logs_created_at

#### 5. entity_collection_sessions
Tracks multi-turn entity collection sessions.

**Columns:**
- `id` (UUID, PK)
- `intentId` (VARCHAR(36), FK to intents.id)
- `userPlatformId` (VARCHAR(255))
- `sessionId` (VARCHAR(255))
- `intentCode` (VARCHAR(255))
- `status` (ENUM: 'initialized', 'collecting', 'validating', 'completed', 'abandoned', 'timeout', 'error')
- `currentTurn` (INT)
- `maxTurns` (INT)
- `requiredEntities` (JSON)
- `collectedEntities` (JSON)
- `conversationHistory` (JSON)
- `startedAt` (DATE)
- `lastActivityAt` (DATE)
- `timeoutAt` (DATE)
- `createdAt` (DATE)
- `updatedAt` (DATE)

**Indexes:**
- idx_entity_sessions_user_platform_id
- idx_entity_sessions_session_id
- idx_entity_sessions_status

### Modified Tables

#### intents
**New Columns Added:**

**LLM Configuration (Migration 20260106000001):**
- `llmEnabled` (BOOLEAN, default: false)
- `llmProvider` (ENUM: 'dialogflow', 'openai', 'claude', default: 'dialogflow')
- `intentDescription` (TEXT)
- `intentExamples` (JSON)
- `entitySchema` (JSON)
- `conversationConfig` (JSON)
- `confidenceThreshold` (FLOAT, default: 0.75)
- `fallbackToDialogflow` (BOOLEAN, default: true)
- `priority` (INT, default: 0)
- `active` (BOOLEAN, default: true)

**Response Configuration (Migration 20260205000001):**
- `responseType` (ENUM: 'static', 'listener', 'hybrid', default: 'listener')
- `staticResponse` (JSON)

**ID Type Change (Migration 20260205000002):**
- `id` changed from INT to VARCHAR(36) for UUID support

---

## Migration Script

We will use the existing `scripts/run-migrations.js` from the assessment-handling-first-time branch as the base for running these migrations.

### Prerequisites

1. **Copy Migration Script**: First, copy the migration script from the assessment branch
   ```bash
   git show assessment-handling-first-time:scripts/run-migrations.js > scripts/run-migrations.js
   git show assessment-handling-first-time:scripts/README.md > scripts/README.md
   ```

2. **AWS Access**: Ensure you have AWS credentials configured
3. **Environment Variables**: Set up required environment variables
4. **Backup**: Create database backups before running migrations

---

## Execution Plan

### Phase 1: Pre-Migration Verification

#### Step 1.1: Verify Current Database State

Run the existing verification script:

```bash
node scripts/check-and-run-migrations.js
```

**Expected Output:**
- List of existing tables
- Current intents table columns
- Status of intent_listeners table (should not exist yet)

#### Step 1.2: Backup Databases

**For Development:**
```bash
# Backup local database
mysqldump -u [username] -p [database_name] > backup_dev_$(date +%Y%m%d_%H%M%S).sql
```

**For UAT/Production:**
Use AWS RDS automated snapshots or manual snapshot:
```bash
aws rds create-db-snapshot \
  --db-instance-identifier [instance-id] \
  --db-snapshot-identifier dialogflow-replacement-pre-migration-$(date +%Y%m%d)
```

#### Step 1.3: Verify Migration Files

Check that all migration files exist and are valid:

```bash
# List migration files
ls -la src/database/migrations/202601* src/database/migrations/202602*

# Verify syntax (optional)
node -c src/database/migrations/20260106000000-create-intent-listeners.js
node -c src/database/migrations/20260106000001-extend-intents-for-llm.js
node -c src/database/migrations/20260106000002-extend-intent-listeners.js
node -c src/database/migrations/20260106000003-create-feature-flags.js
node -c src/database/migrations/20260106000004-create-llm-provider-config.js
node -c src/database/migrations/20260106000005-create-intent-classification-logs.js
node -c src/database/migrations/20260106000006-create-entity-collection-sessions.js
node -c src/database/migrations/20260205000001-add-intent-response-config.js
node -c src/database/migrations/20260205000002-fix-intents-id-to-uuid.js
```

---

### Phase 2: Development Environment Migration

#### Step 2.1: Run Migrations Locally

**Using sequelize-cli (single database):**
```bash
npx sequelize-cli db:migrate
```

**Using run-migrations.js (multiple schemas):**
```bash
# Set environment variables
export ROLE_ARN=arn:aws:iam::123456789012:role/DevMigrationRole
export region=us-east-1
export SECRET_NAME_LIST=dev-tenant1-db,dev-tenant2-db

# Run all migrations
node scripts/run-migrations.js development
```

#### Step 2.2: Verify Development Migration

Create a verification script:

```bash
# Create verification script
cat > scripts/verify-dialogflow-migrations.js << 'EOF'
const { Sequelize } = require('sequelize');
const config = require('../src/data/database/sequelize/database.config.js');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
        host: dbConfig.host,
        dialect: dbConfig.dialect,
        port: dbConfig.port,
        logging: console.log
    }
);

async function verifyMigrations() {
    try {
        console.log('🔍 Verifying Dialogflow Replacement Migrations...\n');

        // Check new tables exist
        const tables = await sequelize.query("SHOW TABLES", { type: Sequelize.QueryTypes.SELECT });
        const tableNames = tables.map(t => Object.values(t)[0]);

        const requiredTables = [
            'intent_listeners',
            'feature_flags',
            'llm_provider_config',
            'intent_classification_logs',
            'entity_collection_sessions'
        ];

        console.log('✅ Checking for new tables:');
        for (const table of requiredTables) {
            const exists = tableNames.includes(table);
            console.log(`  ${exists ? '✓' : '✗'} ${table}: ${exists ? 'EXISTS' : 'MISSING'}`);
            if (!exists) throw new Error(`Table ${table} not found`);
        }

        // Check intents table columns
        console.log('\n✅ Checking intents table columns:');
        const [intentColumns] = await sequelize.query("DESCRIBE intents");
        const intentColumnNames = intentColumns.map(c => c.Field);

        const requiredIntentColumns = [
            'llmEnabled',
            'llmProvider',
            'intentDescription',
            'intentExamples',
            'entitySchema',
            'conversationConfig',
            'confidenceThreshold',
            'fallbackToDialogflow',
            'priority',
            'active',
            'responseType',
            'staticResponse'
        ];

        for (const col of requiredIntentColumns) {
            const exists = intentColumnNames.includes(col);
            console.log(`  ${exists ? '✓' : '✗'} ${col}: ${exists ? 'EXISTS' : 'MISSING'}`);
            if (!exists) throw new Error(`Column intents.${col} not found`);
        }

        // Check intents.id type
        const idColumn = intentColumns.find(c => c.Field === 'id');
        console.log(`\n✅ Checking intents.id type:`);
        console.log(`  Type: ${idColumn.Type}`);
        if (!idColumn.Type.includes('varchar') && !idColumn.Type.includes('char')) {
            console.log(`  ⚠️  WARNING: intents.id should be VARCHAR(36) for UUID, found: ${idColumn.Type}`);
        } else {
            console.log(`  ✓ intents.id is VARCHAR (UUID-compatible)`);
        }

        // Check intent_listeners columns
        console.log('\n✅ Checking intent_listeners table:');
        const [listenerColumns] = await sequelize.query("DESCRIBE intent_listeners");
        const listenerColumnNames = listenerColumns.map(c => c.Field);

        const requiredListenerColumns = [
            'id',
            'intentId',
            'listenerCode',
            'sequence',
            'handlerType',
            'handlerPath',
            'handlerConfig',
            'enabled',
            'executionMode'
        ];

        for (const col of requiredListenerColumns) {
            const exists = listenerColumnNames.includes(col);
            console.log(`  ${exists ? '✓' : '✗'} ${col}: ${exists ? 'EXISTS' : 'MISSING'}`);
            if (!exists) throw new Error(`Column intent_listeners.${col} not found`);
        }

        // Check indexes
        console.log('\n✅ Checking indexes:');
        const [classificationIndexes] = await sequelize.query(
            "SHOW INDEXES FROM intent_classification_logs"
        );
        const indexNames = classificationIndexes.map(i => i.Key_name);
        console.log(`  Found ${indexNames.length} indexes on intent_classification_logs`);

        const [entityIndexes] = await sequelize.query(
            "SHOW INDEXES FROM entity_collection_sessions"
        );
        const entityIndexNames = entityIndexes.map(i => i.Key_name);
        console.log(`  Found ${entityIndexNames.length} indexes on entity_collection_sessions`);

        console.log('\n✅ All migrations verified successfully!\n');

        await sequelize.close();
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Verification failed:', error.message);
        await sequelize.close();
        process.exit(1);
    }
}

verifyMigrations();
EOF

# Run verification
node scripts/verify-dialogflow-migrations.js
```

#### Step 2.3: Test Application Startup

```bash
# Start the application
npm start

# Check logs for errors
# Verify Sequelize models sync correctly
```

---

### Phase 3: UAT Environment Migration

#### Step 3.1: Run UAT Migrations

```bash
# Set UAT environment variables
export ROLE_ARN=arn:aws:iam::123456789012:role/UATMigrationRole
export region=us-east-1
export SECRET_NAME_LIST=uat-tenant1-db,uat-tenant2-db,uat-tenant3-db

# Run migrations
NODE_ENV=uat node scripts/run-migrations.js uat
```

#### Step 3.2: Verify UAT Migration

```bash
# Run verification script
NODE_ENV=uat node scripts/verify-dialogflow-migrations.js
```

#### Step 3.3: Deploy UAT Application

```bash
# Deploy updated application code
# Verify application starts successfully
# Run smoke tests
```

---

### Phase 4: Production Environment Migration

#### Step 4.1: Production Pre-Flight Checklist

- [ ] UAT migrations completed successfully
- [ ] UAT application verified working
- [ ] Production database backups created
- [ ] Rollback plan documented
- [ ] Maintenance window scheduled
- [ ] Stakeholders notified
- [ ] Monitoring alerts configured

#### Step 4.2: Run Production Migrations

```bash
# Set production environment variables
export ROLE_ARN=arn:aws:iam::123456789012:role/ProdMigrationRole
export region=us-east-1
export SECRET_NAME_LIST=prod-tenant1-db,prod-tenant2-db,prod-tenant3-db

# Run migrations
NODE_ENV=production node scripts/run-migrations.js production
```

#### Step 4.3: Verify Production Migration

```bash
# Run verification script
NODE_ENV=production node scripts/verify-dialogflow-migrations.js
```

#### Step 4.4: Deploy Production Application

```bash
# Deploy updated application code
# Verify application starts successfully
# Monitor error logs
# Run production smoke tests
```

---

## Running Specific Migrations

If you need to run a specific migration file (e.g., after a failed migration or for testing):

```bash
# Run single migration
ROLE_ARN=$ROLE_ARN \
region=$region \
SECRET_NAME_LIST=$SECRET_NAME_LIST \
node scripts/run-migrations.js production 20260106000000-create-intent-listeners

# Or with full filename
node scripts/run-migrations.js production 20260106000000-create-intent-listeners.js
```

---

## Rollback Plan

### Automated Rollback (if migration fails)

If a migration fails during execution, Sequelize transactions should automatically roll back the changes for that specific migration. However, if multiple migrations have succeeded before a failure:

1. **Identify Failed Migration**: Note which migration failed from the error output
2. **Review Database State**: Check which migrations were applied
   ```sql
   SELECT * FROM SequelizeMeta ORDER BY name;
   ```
3. **Manual Rollback**: Run down migrations in reverse order

### Manual Rollback Steps

For each applied migration (in reverse order):

```bash
# Example for rolling back a single migration
node -e "
const migration = require('./src/database/migrations/20260205000002-fix-intents-id-to-uuid.js');
const { Sequelize } = require('sequelize');
const config = require('./src/data/database/sequelize/database.config.js');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    port: dbConfig.port
});

async function rollback() {
    try {
        const queryInterface = sequelize.getQueryInterface();
        await migration.down(queryInterface, Sequelize);
        await sequelize.query(\"DELETE FROM SequelizeMeta WHERE name = '20260205000002-fix-intents-id-to-uuid.js'\");
        console.log('✓ Rollback successful');
        await sequelize.close();
    } catch (error) {
        console.error('✗ Rollback failed:', error.message);
        await sequelize.close();
        process.exit(1);
    }
}

rollback();
"
```

### Complete Database Restore

If rollback fails or data corruption occurs:

```bash
# Restore from backup
mysql -u [username] -p [database_name] < backup_dev_YYYYMMDD_HHMMSS.sql

# Or restore RDS snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier [new-instance-id] \
  --db-snapshot-identifier dialogflow-replacement-pre-migration-YYYYMMDD
```

---

## Post-Migration Tasks

### Step 1: Run Seeders

After migrations are complete, run seeders to populate initial data:

```bash
# Run all seeders
npx sequelize-cli db:seed:all

# Or run specific seeders
npx sequelize-cli db:seed --seed 20260205000002-llm-intent-entries.js
npx sequelize-cli db:seed --seed 20260205000003-llm-intent-feature-flags.js
```

### Step 2: Verify Data

```bash
# Create verification script for seeded data
node scripts/verify-seed-data.js
```

### Step 3: Enable Feature Flags

Initially, all feature flags should be disabled. Gradually enable them:

```sql
-- Enable LLM intent response system
UPDATE feature_flags SET enabled = true WHERE flagName = 'llmIntentResponseEnabled';

-- Enable specific intent flows (one at a time)
UPDATE feature_flags SET enabled = true WHERE flagName = 'llmIntent_user_delete_flow';
UPDATE feature_flags SET enabled = true WHERE flagName = 'llmIntent_keratoplasty_flow';
```

---

## Monitoring and Validation

### Metrics to Monitor

1. **Migration Success Rate**
   - Track number of successful vs failed schema migrations
   - Monitor execution time per schema

2. **Application Health**
   - Database connection pool status
   - Query performance
   - Error rates after deployment

3. **Feature Flag Status**
   - Track which flags are enabled
   - Monitor rollout percentages

### Validation Queries

```sql
-- Count records in new tables
SELECT 'intent_listeners' as table_name, COUNT(*) as count FROM intent_listeners
UNION ALL
SELECT 'feature_flags', COUNT(*) FROM feature_flags
UNION ALL
SELECT 'llm_provider_config', COUNT(*) FROM llm_provider_config
UNION ALL
SELECT 'intent_classification_logs', COUNT(*) FROM intent_classification_logs
UNION ALL
SELECT 'entity_collection_sessions', COUNT(*) FROM entity_collection_sessions;

-- Check intents table modifications
SELECT COUNT(*) as llm_enabled_intents FROM intents WHERE llmEnabled = true;

-- Verify UUID conversion
SELECT id, code, name FROM intents LIMIT 5;
```

---

## Troubleshooting

### Common Issues

#### Issue 1: "SequelizeMeta table doesn't exist"
**Solution:** The migration script automatically creates this table. If it fails, manually create it:
```sql
CREATE TABLE IF NOT EXISTS SequelizeMeta (
    name VARCHAR(255) NOT NULL PRIMARY KEY
);
```

#### Issue 2: "Foreign key constraint fails"
**Solution:** This may occur during UUID migration. Ensure the UUID migration (20260205000002) runs last and handles FK constraints properly.

#### Issue 3: "Column already exists"
**Solution:** A previous migration may have partially succeeded. Check `SequelizeMeta` table and remove the failed migration entry, then re-run.

#### Issue 4: "Enum type mismatch"
**Solution:** If modifying existing enum columns, you may need to alter the column type:
```sql
ALTER TABLE intents MODIFY COLUMN llmProvider ENUM('dialogflow', 'openai', 'claude');
```

---

## Success Criteria

Migration is considered successful when:

- [ ] All 9 migration files have been applied to all database schemas
- [ ] Verification script passes for all environments
- [ ] Application starts without database-related errors
- [ ] All new tables are created with correct schema
- [ ] intents table has all new columns
- [ ] intents.id is successfully converted to UUID
- [ ] Foreign key relationships are intact
- [ ] Indexes are created on classification and entity tables
- [ ] Seeders run successfully
- [ ] Initial smoke tests pass

---

## Timeline Estimate

| Phase | Environment | Estimated Duration |
|-------|-------------|-------------------|
| Pre-Migration Verification | All | 30 minutes |
| Development Migration | Dev | 15 minutes |
| Development Verification | Dev | 15 minutes |
| UAT Migration | UAT | 30 minutes |
| UAT Verification | UAT | 30 minutes |
| Production Migration | Prod | 45 minutes |
| Production Verification | Prod | 30 minutes |
| Post-Migration Tasks | All | 1 hour |
| **Total** | | **~4 hours** |

*Note: Timeline excludes backup/restore time and assumes no issues occur*

---

## Contacts and Escalation

**Migration Lead**: [Name]
**Database Administrator**: [Name]
**DevOps Lead**: [Name]
**Product Owner**: [Name]

**Escalation Path**:
1. Migration Lead
2. Database Administrator
3. DevOps Lead
4. CTO

---

## Approval

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Migration Lead | | | |
| Database Administrator | | | |
| DevOps Lead | | | |
| Product Owner | | | |

---

**Document Version**: 1.0
**Last Updated**: 2026-02-18
**Next Review**: After Production Deployment
