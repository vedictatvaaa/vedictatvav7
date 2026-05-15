# Database Management — Vedic Tatva

This file is the single plain-English reference for how the Vedic Tatva database works,
how to change it, and how to keep it in sync across GitHub and the live server.
No SQL knowledge is required for day-to-day operations.

---

## How it works in one sentence

The file `shared/schema.ts` **is** the database. Every table, column, and index is described
there. When you deploy, that file is compared against the live database and any new columns
or tables are created automatically. Nothing is ever deleted automatically.

---

## The golden rule

> **Edit `shared/schema.ts` in Replit → push to GitHub → deploy on the VPS.**
> The database updates itself.

You never need to write SQL or run database commands manually for normal changes.

---

## Step-by-step: making a schema change

These are the only steps a developer (or technically confident admin) ever needs:

1. **Open Replit** and edit `shared/schema.ts` — add a new column, table, or index.
2. **Test in Replit** — the dev server auto-restarts. Click "Sync schema now" in
   Admin → Backups & Database to apply it to the dev database immediately.
3. **Push to GitHub** using Replit's Version Control panel (the branch icon in the
   left sidebar). Click "Push to GitHub".
4. **Deploy on the VPS** — SSH in and run:
   ```
   bash /var/www/vedicTattva-replit/scripts/deploy.sh
   ```
   The deploy script runs `npm run db:push` automatically, which safely applies all
   new columns and tables. You will see "Syncing database schema…" in the deploy log.

That's it. The live database is now updated.

---

## What is safe vs. what needs care

| Change | What happens | Safe? |
|---|---|---|
| Add a new table | Created automatically | Yes |
| Add a new column (nullable) | Added automatically | Yes |
| Add an index | Created automatically | Yes |
| Rename a column | Drizzle will refuse and ask you to confirm | Manual step needed |
| Drop a column | Drizzle will refuse and ask you to confirm | Manual step needed |
| Change a column type | Drizzle will refuse and ask you to confirm | Manual step needed |

For "Manual step needed" changes: SSH to the VPS and run `npm run db:push` interactively
so you can type `yes` to confirm the destructive change.

---

## Schema changelog — track changes here

When a developer makes a schema change, they should add a line here so the team knows
what changed and why. Newest at the top.

| Date | Change | Why |
|---|---|---|
| 2026-05-15 | Added 30+ indexes across 16 tables | Production query performance |
| (initial) | All original tables | Initial build |

---

## Backups

Backups happen automatically:
- **On disk**: Every 24 hours (first one runs 5 minutes after server boot). Kept for 7 days.
  Files land in `./backups/` on the VPS as `vedictatva-YYYY-MM-DDTHH-MM-SS.sql.gz`.
- **Cloud** (optional): If you configure a cloud provider (Cloudflare R2, Backblaze B2,
  AWS S3, or Google Cloud Storage), every backup auto-uploads there too.

You can also trigger a backup on demand from **Admin → Backups & Database → Run backup now**.

### How to restore from a backup

1. Download the `.sql.gz` file (from the admin panel or directly from the VPS).
2. Copy it to the VPS.
3. Run:
   ```bash
   gunzip -c vedictatva-<timestamp>.sql.gz | psql "$DATABASE_URL"
   ```
   Replace `<timestamp>` with the actual filename you downloaded.

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `PG_DATABASE_URL` | Yes | Full PostgreSQL connection string |
| `BACKUP_DIR` | No | Where to store backups (default: `./backups`) |
| `BACKUP_RETENTION_DAYS` | No | How many days to keep backups (default: 7) |
| `BACKUP_CLOUD_PROVIDER` | No | `r2`, `b2`, `s3`, or `gcs` |
| `BACKUP_S3_BUCKET` | No | Cloud bucket name (R2/B2/S3) |
| `BACKUP_S3_ENDPOINT` | No | S3-compatible endpoint URL |
| `BACKUP_S3_ACCESS_KEY_ID` | No | Cloud access key |
| `BACKUP_S3_SECRET_ACCESS_KEY` | No | Cloud secret key |
| `BACKUP_GCS_BUCKET` | No | Google Cloud Storage bucket name |

---

## Quick reference commands (VPS shell)

```bash
# Apply schema changes to production manually
npm run db:push

# Run a manual backup right now
pg_dump --no-owner --no-privileges "$DATABASE_URL" | gzip -9 > backups/manual-$(date +%Y%m%d).sql.gz

# See what tables exist and their sizes
psql "$DATABASE_URL" -c "
  SELECT relname AS table, pg_size_pretty(pg_total_relation_size(oid)) AS size
  FROM pg_class WHERE relkind='r' AND relname NOT LIKE 'pg_%'
  ORDER BY pg_total_relation_size(oid) DESC;"

# Count rows in orders table
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM orders;"

# Full restore from a backup file
gunzip -c backups/vedictatva-<timestamp>.sql.gz | psql "$DATABASE_URL"
```

---

## FAQ

**Q: Do I need to do anything after pulling new code from GitHub?**
A: No — `scripts/deploy.sh` handles everything including schema sync. Just run the deploy script.

**Q: Can running db:push accidentally delete my data?**
A: No. Drizzle only adds new things (tables, columns, indexes). It will never drop a column
or table silently — it will stop and ask you to confirm any destructive change.

**Q: What if the deploy script fails at "Syncing database schema"?**
A: SSH to the VPS and run `npm run db:push` manually. If it asks you to confirm a change,
read the prompt carefully and type `yes` if you want to proceed. Or set `SKIP_DB_PUSH=1`
in your env to skip it and apply manually later.

**Q: Where is the schema file?**
A: `shared/schema.ts` in the root of the repo. This is the only file that controls the
database structure. Keep it in Git — it's the source of truth.

**Q: How do I see the current database tables and sizes?**
A: Admin panel → Backups & Database → scroll to "Database Health". It shows every table,
row count, and size in real time.
