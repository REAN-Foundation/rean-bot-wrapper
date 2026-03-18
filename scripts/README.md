# Database Migration Script

This script automates database migrations across multiple schemas by fetching credentials from AWS Secrets Manager.

## Prerequisites

1. **AWS Credentials**: Configure AWS credentials with access to assume the specified role
2. **Node.js**: Ensure Node.js is installed
3. **Dependencies**: Run `npm install` in the project root

## Environment Variables

The script requires the following environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `ROLE_ARN` | AWS IAM role ARN for cross-account access | `arn:aws:iam::123456789012:role/DatabaseMigrationRole` |
| `region` | AWS region where secrets are stored | `us-east-1` |
| `SECRET_NAME_LIST` | Comma-separated list of secret names in AWS Secrets Manager | `tenant1-db-prod,tenant2-db-prod,tenant3-db-prod` |

## Secret Format

Each secret in AWS Secrets Manager should contain the following fields:

```json
{
  "DB_USER_NAME": "database_user",
  "DB_PASSWORD": "database_password",
  "DATA_BASE_NAME": "database_name",
  "DB_HOST": "database.example.com",
  "DB_PORT": "3306"
}
```

Alternative field names are also supported:
- `username` instead of `DB_USER_NAME`
- `password` instead of `DB_PASSWORD`
- `database` instead of `DATA_BASE_NAME`
- `host` instead of `DB_HOST`
- `port` instead of `DB_PORT`

## Usage

### Basic Usage - Run All Pending Migrations

```bash
ROLE_ARN=arn:aws:iam::123456789012:role/MyRole \
region=us-east-1 \
SECRET_NAME_LIST=tenant1-db,tenant2-db \
node scripts/run-migrations.js production
```

### Run Specific Migration Only

You can run a specific migration file instead of all pending migrations:

```bash
# With .js extension
ROLE_ARN=arn:aws:iam::123456789012:role/MyRole \
region=us-east-1 \
SECRET_NAME_LIST=tenant1-db,tenant2-db \
node scripts/run-migrations.js production 20260206120000-add-node-required-flag.js

# Without .js extension (also works)
ROLE_ARN=arn:aws:iam::123456789012:role/MyRole \
region=us-east-1 \
SECRET_NAME_LIST=tenant1-db,tenant2-db \
node scripts/run-migrations.js production 20260206120000-add-node-required-flag
```

**Use Cases for Specific Migration:**
- Testing a new migration in production before running all
- Running a hotfix migration urgently
- Re-running a failed migration after fixing it (must remove from SequelizeMeta first)
- Running migrations in a specific order

### Environment-Specific Examples

#### Production
```bash
ROLE_ARN=$PROD_ROLE_ARN \
region=us-east-1 \
SECRET_NAME_LIST=$PROD_SECRET_LIST \
node scripts/run-migrations.js production
```

#### UAT
```bash
ROLE_ARN=$UAT_ROLE_ARN \
region=us-west-2 \
SECRET_NAME_LIST=$UAT_SECRET_LIST \
node scripts/run-migrations.js uat
```

#### Development
```bash
ROLE_ARN=$DEV_ROLE_ARN \
region=us-east-1 \
SECRET_NAME_LIST=$DEV_SECRET_LIST \
node scripts/run-migrations.js development
```

## How It Works

1. **Authenticate**: Assumes the specified AWS IAM role using STS
2. **Fetch Secrets**: Retrieves database credentials from AWS Secrets Manager for all secrets in `SECRET_NAME_LIST`
3. **Run Migrations**: For each database schema:
   - Establishes connection
   - Checks migration status (executed vs pending)
   - If specific migration specified:
     - Verifies the migration file exists
     - Checks if already executed
     - Runs only that migration if pending
   - If no specific migration:
     - Executes all pending migrations in alphanumeric order
   - Records migration status in `SequelizeMeta` table
4. **Report Results**: Displays a summary of successful and failed migrations

### Specific Migration Behavior

When you specify a migration file:

- **If the file doesn't exist**: Script exits with error message
- **If already executed**: Script reports it's already executed and skips (shows warning)
- **If pending**: Runs only that migration and skips all others
- **Applied to all schemas**: The specific migration runs on all databases in SECRET_NAME_LIST

## Output Examples

### Running All Pending Migrations

The script provides colored, structured output:

```
Assuming AWS role...
✓ Successfully assumed AWS role

Fetching 3 secrets from AWS Secrets Manager...
  Fetching secret: tenant1-db-prod
  ✓ Fetched: tenant1-db-prod
  Fetching secret: tenant2-db-prod
  ✓ Fetched: tenant2-db-prod
  Fetching secret: tenant3-db-prod
  ✓ Fetched: tenant3-db-prod

======================================================================
Starting migrations for 3 database(s)
Environment: production
======================================================================

======================================================================
[1] Running migrations for schema: tenant1_production
    Host: db1.example.com:3306
======================================================================
✓ Database connection successful

Migration Status:
  Executed: 15
  Pending: 1

Executing 1 pending migration(s)...
  Running: 20260206120000-add-node-required-flag.js
  ✓ Completed: 20260206120000-add-node-required-flag.js

✓ Successfully executed 1 migration(s)

... [repeats for each schema] ...

======================================================================
MIGRATION SUMMARY
======================================================================

Total Schemas: 3
Successful: 3
Failed: 0

✓ Successful Schemas:
  • tenant1_production - 1 new migration(s) executed
  • tenant2_production - already up to date
  • tenant3_production - 1 new migration(s) executed

======================================================================
```

### Running Specific Migration

When running a specific migration file:

```
Running specific migration: 20260206120000-add-node-required-flag.js

Assuming AWS role...
✓ Successfully assumed AWS role

Fetching 3 secrets from AWS Secrets Manager...
  Fetching secret: tenant1-db-prod
  ✓ Fetched: tenant1-db-prod
  ...

======================================================================
Starting migrations for 3 database(s)
Environment: production
Target Migration: 20260206120000-add-node-required-flag.js
======================================================================

======================================================================
[1] Running migrations for schema: tenant1_production
    Host: db1.example.com:3306
======================================================================
✓ Database connection successful

📌 Specific migration requested: 20260206120000-add-node-required-flag.js

Migration Status:
  Executed: 15
  Pending: 1

Executing 1 pending migration...
  Running: 20260206120000-add-node-required-flag.js
  ✓ Completed: 20260206120000-add-node-required-flag.js

✓ Successfully executed 1 migration

... [repeats for each schema] ...

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

### Migration Already Executed

If you try to run a migration that's already been executed:

```
======================================================================
[1] Running migrations for schema: tenant1_production
    Host: db1.example.com:3306
======================================================================
✓ Database connection successful

📌 Specific migration requested: 20260206120000-add-node-required-flag.js

⚠ Migration already executed: 20260206120000-add-node-required-flag.js
  To re-run, first remove it from SequelizeMeta table
```

## Exit Codes

- `0`: All migrations succeeded
- `1`: One or more migrations failed or critical error occurred

## Error Handling

If a migration fails for any schema:
- The script continues to attempt migrations on remaining schemas
- Failed schemas are listed in the summary
- The script exits with code 1

## Troubleshooting

### "Missing required environment variables"
Ensure `ROLE_ARN`, `region`, and `SECRET_NAME_LIST` are set before running the script.

### "Failed to assume role"
- Verify the `ROLE_ARN` is correct
- Ensure your AWS credentials have permission to assume the role
- Check that the role's trust policy allows your AWS account/user

### "Failed to fetch secret"
- Verify the secret names in `SECRET_NAME_LIST` are correct
- Ensure the assumed role has `secretsmanager:GetSecretValue` permission
- Check that the secrets exist in the specified region

### "Database connection failed"
- Verify the database credentials in the secret are correct
- Ensure the database host is accessible from your network
- Check firewall rules and security groups

### "Migration failed"
- Review the error message for the specific migration
- Check the migration file for syntax errors
- Verify the database schema is in the expected state
- Consider running the migration manually to debug

### "Migration file not found"
- Verify the migration file name is spelled correctly
- Check that the file exists in `src/database/migrations/`
- The script accepts names with or without `.js` extension

### "Migration already executed"
- The migration has already been run on this schema
- Check `SequelizeMeta` table to see executed migrations:
  ```sql
  SELECT * FROM SequelizeMeta ORDER BY name;
  ```
- To re-run a migration (use with caution):
  ```sql
  DELETE FROM SequelizeMeta WHERE name = '20260206120000-add-node-required-flag.js';
  ```
  Then run the migration script again

## Safety Features

1. **Transaction Support**: Each migration runs in its own transaction (if supported by the migration)
2. **Migration Tracking**: Uses `SequelizeMeta` table to track executed migrations
3. **Sequential Execution**: Migrations run in alphanumeric order
4. **Connection Testing**: Tests database connection before attempting migrations
5. **Detailed Logging**: Provides clear feedback on each step

## Best Practices

1. **Test First**: Always test migrations in a development environment first
2. **Backup**: Create database backups before running migrations in production
3. **Review Output**: Carefully review the summary to ensure all schemas were updated
4. **Rollback Plan**: Ensure you have rollback migrations ready if needed
5. **Monitor**: Watch for errors during migration execution

## Adding New Migrations

1. Create migration file in `src/database/migrations/`
2. Follow naming convention: `YYYYMMDDHHMMSS-description.js`
3. Implement both `up` and `down` functions
4. Test in development environment
5. Run this script to apply to all schemas

## Example Migration File

```javascript
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.addColumn(
            'table_name',
            'column_name',
            {
                type: Sequelize.STRING,
                allowNull: true
            }
        );
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.removeColumn(
            'table_name',
            'column_name'
        );
    }
};
```
