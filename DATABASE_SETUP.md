# Database Setup Guide

## Prerequisites
Before setting up the database, make sure you have PostgreSQL installed and running on your system.

### Install PostgreSQL (if not already installed)

**Windows:**
1. Download from: https://www.postgresql.org/download/windows/
2. Install with default settings
3. Remember the password you set for the `postgres` user

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Linux:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

---

## Step 1: Create Database

Open PostgreSQL command line or use pgAdmin and run:

```sql
CREATE DATABASE hallsystem;
```

Or using command line:
```bash
# Windows (PowerShell)
psql -U postgres -c "CREATE DATABASE hallsystem;"

# macOS/Linux
sudo -u postgres psql -c "CREATE DATABASE hallsystem;"
```

---

## Step 2: Configure Environment Variables

1. Copy the example environment file:
```bash
copy .env.example .env
```

2. Open `.env` and update these values:

```env
# Update with your PostgreSQL credentials
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/hallsystem?schema=public"

# Generate a secret key (run this command):
# openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-generated-secret-here"

# Qoyod Integration (leave empty for now)
QOYOD_API_KEY=""
QOYOD_API_SECRET=""
QOYOD_BASE_URL="https://api.qoyod.com/v1"
QOYOD_ENABLED="false"

NODE_ENV="development"
```

**To generate NEXTAUTH_SECRET:**
```bash
# On Windows (PowerShell)
openssl rand -base64 32

# Or use this Node.js command
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## Step 3: Generate Prisma Client

```bash
npm run db:generate
```

This creates the Prisma Client based on your schema.

---

## Step 4: Push Schema to Database

```bash
npm run db:push
```

This creates all the tables in your database without migrations.

---

## Step 5: Seed Sample Data

```bash
npx prisma db seed
```

This will create:
- ✅ 4 users (one for each role)
- ✅ 3 halls (Royal Hall, Jasmine Hall, Rose Hall)
- ✅ 3 customers  
- ✅ 3 bookings (past, current, pending)
- ✅ Invoices and payments
- ✅ System settings

---

## Step 6: Verify Database

Open Prisma Studio to view your data:

```bash
npm run db:studio
```

This opens a GUI at `http://localhost:5555` where you can browse all data.

---

## Login Credentials

After seeding, you can login with:

| Role       | Username   | Password     |
|------------|------------|--------------|
| Admin      | admin      | password123  |
| Supervisor | supervisor | password123  |
| Accountant | accountant | password123  |
| Employee   | employee   | password123  |

---

## Troubleshooting

### Connection refused
- Make sure PostgreSQL service is running
- Check if the port 5432 is correct (default PostgreSQL port)

### Authentication failed
- Verify your PostgreSQL username and password in DATABASE_URL
- Default username is usually `postgres`

### Database doesn't exist
- Make sure you created the `hallsystem` database first
- Check the database name in your DATABASE_URL

### Permission denied
- On Linux/Mac, you might need to configure PostgreSQL authentication
- Edit `/etc/postgresql/*/main/pg_hba.conf` if needed

---

## Alternative: Using SQLite (for testing)

If you prefer not to install PostgreSQL for testing, you can use SQLite:

1. Update `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}
```

2. Update `.env`:
```env
DATABASE_URL="file:./dev.db"
```

3. Then run the same commands (generate, push, seed)

---

## Next Steps

Once your database is set up and seeded:

1. Start the development server:
```bash
npm run dev
```

2. Open http://localhost:3000

3. Login with any of the credentials above

4. Test the different role permissions!
