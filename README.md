# TraderApp wallets service demo

This is code base for traderapp wallets service demo

## Installation

-   clone repo
-   Run `npm install` to install packages.
-   Run `npm run dev` to start project

# Wallets Service Migrations Framework

This project includes a migrations framework that allows you to manage database schema changes in a structured way. The framework supports creating, running, and rolling back migrations.

To create a new migration, use the following command:

```bash
npm run db:migration-create -- <migration-name>
```

Replace `<migration-name>` with a descriptive name for your migration (e.g., `add-new-field`). This will create a new migration file in the `src/scripts/migrations` directory with a timestamp prefix.

### Example

```bash
npm run db:migration-create -- add-new-field
```

This command will create a file named something like `20231005123000_add-new-field.ts`.

To run all outstanding migrations, use the following command:

```bash
npm run db:migrate-all
```

If you want to run a specific migration, you can do so by providing just the name of the migration file (without the timestamp prefix or `.ts` extension):

```bash
npm run db:migrate-one -- <migration-name>
```

Replace `<migration-name>` with the name of the migration file you want to run.

### Example

```bash
npm run db:migrate-one -- add-new-field
```

This command will run the specified migration.

## Rolling Back Migrations

To roll back the last executed migration, use the following command:

```bash
npm run db:migrate-rollback
```

If you want to roll back a specific migration, you can do so by providing just the name of the migration file:

```bash
npm run db:migrate-rollback -- <migration-name>
```

### Example

```bash
npm run db:migrate-rollback -- add-new-field
```

## Migration File Structure

Each migration file should export two functions: `up` and `down`. The `up` function contains the logic for applying the migration, while the `down` function contains the logic for rolling it back.

### Example Migration File

```typescript:README.md
export async function up(db: any) {
    // Your migration logic here
    console.log("Running migration: add-new-field");
    // Example: await db.collection('users').updateMany({}, { $set: { newField: 'defaultValue' } });
}

export async function down(db: any) {
    // Your rollback logic here
    console.log("Rolling back migration: add-new-field");
    // Example: await db.collection('users').updateMany({}, { $unset: { newField: "" } });
}
```

## Environment Configuration

The migrations framework retrieves the database connection URL from AWS Secrets Manager. Ensure that your AWS credentials are configured correctly and that the secret containing the database URL is accessible.

### Example Secret Structure

The secret should contain a key for the database URL:

```json
{
	"walletsServiceDbUrl": "<dburl>"
}
```

## Conclusion

This migrations framework provides a structured way to manage database changes in your application. By following the steps outlined above, you can easily create, run, and roll back migrations as needed.
