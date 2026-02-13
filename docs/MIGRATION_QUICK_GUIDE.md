# Production Migration - Quick Reference Guide

## 🚀 Quick Start

### 1. Prepare (5 minutes)

```bash
# Set environment variables
export ROLE_ARN="arn:aws:iam::123456789:role/ProdMigrationRole"
export region="us-east-1"
export SECRET_NAME_LIST="prod-tenant1,prod-tenant2,prod-tenant3"

# Verify
echo $ROLE_ARN
echo $SECRET_NAME_LIST
```

### 2. Backup (10-15 minutes)

```bash
# Create RDS snapshots or mysqldump backups
aws rds create-db-snapshot \
  --db-instance-identifier prod-db \
  --db-snapshot-identifier migration-backup-$(date +%Y%m%d-%H%M%S)
```

### 3. Test in Staging (5 minutes)

```bash
# Run in staging first!
export SECRET_NAME_LIST="staging-tenant1,staging-tenant2"
node scripts/run-migrations.js staging 20260206120000-add-node-required-flag
```

### 4. Run Migration (2-5 minutes)

```bash
# Execute in production
export SECRET_NAME_LIST="prod-tenant1,prod-tenant2,prod-tenant3"
node scripts/run-migrations.js production 20260206120000-add-node-required-flag
```

### 5. Verify (5 minutes)

```bash
# Check one database
mysql -h prod-db.example.com -u admin -p -D tenant1_production

# Run verification queries
DESCRIBE assessment_session_logs;
SELECT * FROM SequelizeMeta WHERE name = '20260206120000-add-node-required-flag.js';
```

---

## ⚠️ What to Watch For

### ✅ Success Indicators
- All schemas show "✓ Completed"
- Summary shows "Failed: 0"
- Columns visible in DESCRIBE output
- Entry in SequelizeMeta table

### ❌ Failure Indicators
- "✗ Failed" for any schema
- Summary shows "Failed: N"
- Error messages in output
- Missing columns after migration

---

## 🔙 Quick Rollback

If migration fails:

```bash
# Connect to database
mysql -h prod-db.example.com -u admin -p -D tenant_production

# Rollback
START TRANSACTION;
ALTER TABLE assessment_session_logs DROP COLUMN retry_count;
ALTER TABLE assessment_session_logs DROP COLUMN is_node_required;
DELETE FROM SequelizeMeta WHERE name = '20260206120000-add-node-required-flag.js';
COMMIT;
```

---

## 📋 Pre-Flight Checklist

- [ ] Backups created
- [ ] Tested in staging
- [ ] Team notified
- [ ] Environment variables set
- [ ] Migration script ready

---

## 📞 If Something Goes Wrong

1. **Don't Panic** - Migration is backward compatible
2. **Check the error message** - Script provides detailed errors
3. **Take a screenshot** - Capture the error output
4. **Contact team** - Refer to emergency contacts
5. **Rollback if needed** - Follow rollback procedure

---

## ⏱️ Estimated Timeline

| Phase | Duration |
|-------|----------|
| Preparation | 5 min |
| Backup | 10-15 min |
| Staging Test | 5 min |
| Production Migration | 2-5 min |
| Verification | 5 min |
| **Total** | **30-40 min** |

---

For detailed instructions, see: `docs/PRODUCTION_MIGRATION_PLAN.md`
