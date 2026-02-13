# Production Migration Plan - Assessment Node-Level Required Flag

**Migration Date:** [TO BE FILLED]
**Migration File:** `20260206120000-add-node-required-flag.js`
**Environment:** Production
**Estimated Downtime:** None (backward compatible)

## 📋 Overview

This migration adds two new columns to the `assessment_session_logs` table:
- `is_node_required` (BOOLEAN) - Indicates if a specific assessment node is required
- `retry_count` (INTEGER) - Tracks the number of validation failures for a node

**Impact:** Low risk, backward compatible. Existing code will continue to work.

---

## ⚠️ Pre-Migration Checklist

### 1. Verify Environment

```bash
# Confirm you're targeting production
echo $ENV  # Should output: production

# Verify AWS credentials are configured
aws sts get-caller-identity

# Test AWS role assumption
aws sts assume-role --role-arn $ROLE_ARN --role-session-name test-session
```

### 2. Prepare Environment Variables

```bash
# Set required environment variables
export ROLE_ARN="arn:aws:iam::<account-id>:role/<production-role>"
export region="us-east-1"  # or your production region
export SECRET_NAME_LIST="prod-tenant1-db,prod-tenant2-db,prod-tenant3-db"

# Verify they are set
echo "ROLE_ARN: $ROLE_ARN"
echo "region: $region"
echo "SECRET_NAME_LIST: $SECRET_NAME_LIST"
```

### 3. Database Backup

**CRITICAL: Take database backups before proceeding**

```bash
# For each production database, create a backup
# Example using mysqldump (adjust for your setup):

# Tenant 1
mysqldump -h prod-db1.example.com -u admin -p \
  --single-transaction \
  --quick \
  --lock-tables=false \
  tenant1_production > backup_tenant1_$(date +%Y%m%d_%H%M%S).sql

# Tenant 2
mysqldump -h prod-db2.example.com -u admin -p \
  --single-transaction \
  --quick \
  --lock-tables=false \
  tenant2_production > backup_tenant2_$(date +%Y%m%d_%H%M%S).sql

# Verify backup files exist and have content
ls -lh backup_*.sql
```

**Alternative: Use AWS RDS Snapshots**
```bash
# Create RDS snapshot
aws rds create-db-snapshot \
  --db-instance-identifier prod-db-instance \
  --db-snapshot-identifier prod-migration-backup-$(date +%Y%m%d-%H%M%S)

# Wait for snapshot to complete
aws rds wait db-snapshot-completed \
  --db-snapshot-identifier prod-migration-backup-$(date +%Y%m%d-%H%M%S)
```

### 4. Test in Staging First

**MANDATORY: Run the migration in staging/UAT environment first**

```bash
# Test with staging secrets
export ROLE_ARN="$STAGING_ROLE_ARN"
export region="us-east-1"
export SECRET_NAME_LIST="staging-tenant1-db,staging-tenant2-db"

# Run the specific migration in staging
node scripts/run-migrations.js staging 20260206120000-add-node-required-flag

# Verify it succeeded
# Check the output for all green checkmarks
```

### 5. Verify Migration File

```bash
# Ensure the migration file exists
ls -la src/database/migrations/20260206120000-add-node-required-flag.js

# Review the migration content
cat src/database/migrations/20260206120000-add-node-required-flag.js
```

---

## 🚀 Migration Execution Steps

### Step 1: Verify Current State

**Check current migration status (read-only check):**

```bash
# Connect to one production database and check current migrations
mysql -h prod-db1.example.com -u admin -p -D tenant1_production

# Run in MySQL console:
SELECT COUNT(*) as executed_migrations FROM SequelizeMeta;
SELECT name FROM SequelizeMeta ORDER BY name DESC LIMIT 5;

# Verify the migration hasn't been run yet:
SELECT * FROM SequelizeMeta WHERE name = '20260206120000-add-node-required-flag.js';
# Should return 0 rows

# Check if columns already exist (shouldn't):
DESCRIBE assessment_session_logs;
# Should NOT show is_node_required or retry_count columns

# Exit MySQL
exit;
```

### Step 2: Prepare Migration Command

```bash
# Navigate to project directory
cd /path/to/rean-bot-wrapper

# Ensure you're on the correct branch with migration file
git branch  # Should show the branch with migration
git status  # Verify working tree is clean

# Set production environment variables
export ROLE_ARN="arn:aws:iam::<account-id>:role/<production-role>"
export region="us-east-1"
export SECRET_NAME_LIST="prod-tenant1-db,prod-tenant2-db,prod-tenant3-db"
```

### Step 3: Dry Run (Optional but Recommended)

**Manually verify the migration SQL on one database:**

```bash
# Connect to one production database
mysql -h prod-db1.example.com -u admin -p -D tenant1_production

# Run the migration SQL manually to test (in a transaction):
START TRANSACTION;

-- Add is_node_required column
ALTER TABLE assessment_session_logs
ADD COLUMN is_node_required BOOLEAN NOT NULL DEFAULT false
COMMENT 'Flag indicating if this specific assessment node/question is required';

-- Add retry_count column
ALTER TABLE assessment_session_logs
ADD COLUMN retry_count INTEGER NOT NULL DEFAULT 0
COMMENT 'Number of times user provided invalid response for this node';

-- Verify columns were added
DESCRIBE assessment_session_logs;

-- ROLLBACK - don't commit yet!
ROLLBACK;

# Exit MySQL
exit;
```

### Step 4: Execute Migration

**Run the migration script:**

```bash
# Execute the specific migration across all production databases
node scripts/run-migrations.js production 20260206120000-add-node-required-flag.js
```

**Expected Output:**
```
Running specific migration: 20260206120000-add-node-required-flag.js

Assuming AWS role...
✓ Successfully assumed AWS role

Fetching 3 secrets from AWS Secrets Manager...
  ✓ Fetched: prod-tenant1-db
  ✓ Fetched: prod-tenant2-db
  ✓ Fetched: prod-tenant3-db

======================================================================
Starting migrations for 3 database(s)
Environment: production
Target Migration: 20260206120000-add-node-required-flag.js
======================================================================

[1] Running migrations for schema: tenant1_production
✓ Database connection successful
📌 Specific migration requested: 20260206120000-add-node-required-flag.js

Migration Status:
  Executed: 15
  Pending: 1

Executing 1 pending migration...
  Running: 20260206120000-add-node-required-flag.js
  ✓ Completed: 20260206120000-add-node-required-flag.js

✓ Successfully executed 1 migration

[2] Running migrations for schema: tenant2_production
✓ Database connection successful
...

======================================================================
MIGRATION SUMMARY
======================================================================

Total Schemas: 3
Successful: 3
Failed: 0

✓ Successful Schemas:
  • tenant1_production - 1 new migration(s) executed
  • tenant2_production - 1 new migration(s) executed
  • tenant3_production - 1 new migration(s) executed

======================================================================
```

**If you see any failures, STOP and proceed to Rollback section.**

### Step 5: Verify Migration Success

**Check each database:**

```bash
# For each production database
mysql -h prod-db1.example.com -u admin -p -D tenant1_production

# Verify migration was recorded
SELECT * FROM SequelizeMeta WHERE name = '20260206120000-add-node-required-flag.js';
# Should return 1 row

# Verify columns were added
DESCRIBE assessment_session_logs;
# Should show:
# - is_node_required (tinyint(1), NO, 0)
# - retry_count (int, NO, 0)

# Check existing data has default values
SELECT is_node_required, retry_count, COUNT(*) as count
FROM assessment_session_logs
GROUP BY is_node_required, retry_count;
# Should show: is_node_required=0, retry_count=0 for all existing rows

# Exit
exit;
```

**Repeat for all production databases.**

### Step 6: Smoke Test

**Test the application:**

```bash
# 1. Verify application starts successfully
# 2. Check logs for any errors related to assessment_session_logs
# 3. Test assessment flow:
#    - Start an assessment
#    - Submit a response
#    - Verify no errors in application logs

# Check application logs
tail -f /var/log/app/production.log | grep -i "assessment\|error"
```

---

## 🔙 Rollback Plan

### If Migration Fails

**Scenario 1: Migration failed on some schemas**

```bash
# The script will show which schemas failed
# For failed schemas only:

mysql -h failed-db.example.com -u admin -p -D failed_schema

# Check if columns were partially created
DESCRIBE assessment_session_logs;

# If columns exist, remove them:
ALTER TABLE assessment_session_logs DROP COLUMN is_node_required;
ALTER TABLE assessment_session_logs DROP COLUMN retry_count;

# Remove from SequelizeMeta if it was recorded
DELETE FROM SequelizeMeta WHERE name = '20260206120000-add-node-required-flag.js';

# Re-run the migration for this schema
export SECRET_NAME_LIST="failed-tenant-db"
node scripts/run-migrations.js production 20260206120000-add-node-required-flag.js
```

**Scenario 2: Need to rollback all schemas**

```bash
# For each production database
mysql -h prod-db.example.com -u admin -p -D tenant_production

# Run the down migration
START TRANSACTION;

-- Remove columns
ALTER TABLE assessment_session_logs DROP COLUMN retry_count;
ALTER TABLE assessment_session_logs DROP COLUMN is_node_required;

-- Remove from migration tracking
DELETE FROM SequelizeMeta WHERE name = '20260206120000-add-node-required-flag.js';

-- Verify
DESCRIBE assessment_session_logs;
SELECT * FROM SequelizeMeta WHERE name = '20260206120000-add-node-required-flag.js';

-- If everything looks good, commit
COMMIT;

exit;
```

**Scenario 3: Complete database restore from backup**

```bash
# Only if critical failure - restores entire database
# This will lose any data created after backup

# From SQL backup:
mysql -h prod-db.example.com -u admin -p -D tenant_production < backup_tenant1_20260206_120000.sql

# From RDS snapshot:
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier prod-db-instance-restored \
  --db-snapshot-identifier prod-migration-backup-20260206-120000
```

---

## 📊 Post-Migration Verification

### 1. Database Schema Check

```sql
-- Run on each production database
USE tenant1_production;

-- Verify columns exist with correct properties
SELECT
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'assessment_session_logs'
AND COLUMN_NAME IN ('is_node_required', 'retry_count');

-- Expected results:
-- is_node_required | tinyint(1) | NO | 0 | Flag indicating if this specific assessment node/question is required
-- retry_count | int | NO | 0 | Number of times user provided invalid response for this node
```

### 2. Application Health Check

```bash
# Check application endpoints
curl -I https://api.production.example.com/health
# Should return 200 OK

# Check assessment endpoint
curl -X POST https://api.production.example.com/api/assessment/start \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user"}'
# Should succeed
```

### 3. Monitor Application Logs

```bash
# Monitor for 15-30 minutes after migration
tail -f /var/log/app/production.log | grep -i "error\|exception\|failed"

# Check for database-related errors
tail -f /var/log/app/production.log | grep -i "assessment_session_logs\|sequelize"
```

### 4. Test Assessment Flow

**Manual testing checklist:**

- [ ] Start a new assessment
- [ ] Submit valid response for required node
- [ ] Submit invalid response for required node (should re-prompt)
- [ ] Submit response for optional node
- [ ] Complete assessment
- [ ] Check database - verify `is_node_required` and `retry_count` are being populated correctly

```sql
-- Verify new data is using the columns
SELECT
    assesmentNodeId,
    userResponseType,
    is_node_required,
    retry_count,
    createdAt
FROM assessment_session_logs
WHERE createdAt > NOW() - INTERVAL 1 HOUR
ORDER BY createdAt DESC
LIMIT 10;
```

---

## 📝 Migration Execution Log Template

**Fill this out during migration:**

```
Migration Execution Log
=======================

Date: _______________
Time Started: _______________
Executed By: _______________

Pre-Migration Checklist:
[ ] Environment verified
[ ] Environment variables set
[ ] Database backups completed
[ ] Staging migration tested
[ ] Migration file verified

Migration Execution:
Time Started: _______________
Command: node scripts/run-migrations.js production 20260206120000-add-node-required-flag.js

Schemas Migrated:
[ ] tenant1_production - Status: _______ Time: _______
[ ] tenant2_production - Status: _______ Time: _______
[ ] tenant3_production - Status: _______ Time: _______

Issues Encountered:
_______________________________________________
_______________________________________________

Post-Migration Verification:
[ ] Schema verification completed
[ ] Application health check passed
[ ] Logs monitored (no errors)
[ ] Assessment flow tested

Time Completed: _______________
Overall Status: SUCCESS / FAILED / PARTIAL

Notes:
_______________________________________________
_______________________________________________

Sign-off: _______________
```

---

## 🔒 Security Considerations

1. **AWS Credentials**: Ensure role has minimum required permissions
2. **Database Passwords**: Never log or expose database credentials
3. **Backup Storage**: Store backups securely, encrypt if needed
4. **Access Control**: Only authorized personnel should run migrations
5. **Audit Trail**: Keep logs of who ran migrations and when

---

## 📞 Emergency Contacts

| Role | Name | Contact |
|------|------|---------|
| Database Admin | _________ | _________ |
| DevOps Lead | _________ | _________ |
| On-Call Engineer | _________ | _________ |
| Product Owner | _________ | _________ |

---

## 📚 Additional Resources

- Migration Script Documentation: `scripts/README.md`
- Migration File: `src/database/migrations/20260206120000-add-node-required-flag.js`
- Assessment Node Implementation: `src/services/langchain/decision.router.service.ts` (line 275)
- Code Changes Summary: See commit history

---

## ✅ Final Checklist

Before declaring migration complete:

- [ ] All schemas successfully migrated
- [ ] All databases verified (columns exist with correct schema)
- [ ] Application started successfully
- [ ] No errors in application logs
- [ ] Assessment flow tested and working
- [ ] Backups stored securely
- [ ] Migration execution log completed
- [ ] Team notified of successful migration
- [ ] Documentation updated
- [ ] Monitoring dashboards checked

---

**Migration Status:** [ ] Not Started | [ ] In Progress | [ ] Completed | [ ] Rolled Back

**Sign-off:** _______________  **Date:** _______________
