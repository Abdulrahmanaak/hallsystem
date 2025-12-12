# Quick Start Guide - Database Setup

Choose the setup method that works best for you:

---

## ⚡ Option 1: SQLite (Recommended for Quick Testing)

**No PostgreSQL installation required!** Perfect for testing the system quickly.

### Step 1: Update Database Provider

Open **`prisma/schema.prisma`** and replace lines **7-10** with:

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

**Before:**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**After:**
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

### Step 2: Create .env File

Create a new file named **`.env`** in the project root (d:\hallsystem\.env) with this content:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="quickstart-secret-key-change-in-production"
NODE_ENV="development"
```

**Windows PowerShell command to create .env:**
```powershell
@"
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="quickstart-secret-key-change-in-production"
NODE_ENV="development"
"@ | Out-File -FilePath .env -Encoding utf8
```

### Step 3: Install Dependencies (if not done)

```bash
npm install
```

### Step 4: Generate Prisma Client

```bash
npm run db:generate
```

This creates the TypeScript types and Prisma Client from your schema.

### Step 5: Create Database Tables

```bash
npm run db:push
```

This creates all tables in the SQLite database (file: `./dev.db`).

### Step 6: Seed Sample Data

```bash
npx prisma db seed
```

**This creates:**
- ✅ 4 users (admin, supervisor, accountant, employee)
- ✅ 3 halls (القاعة الملكية, قاعة الياسمين, قاعة الورد)
- ✅ 3 customers with Arabic names
- ✅ 3 bookings (completed, confirmed, pending)
- ✅ Invoices and payments
- ✅ System settings with VAT configuration

### Step 7: Start Development Server

```bash
npm run dev
```

### Step 8: Login

Open **http://localhost:3000** in your browser.

**Login Credentials:**

| الصلاحية | Username | Password |
|---------|----------|----------|
| مدير النظام (Admin) | `admin` | `password123` |
| مشرف القاعات (Supervisor) | `supervisor` | `password123` |
| محاسب (Accountant) | `accountant` | `password123` |
| موظف (Employee) | `employee` | `password123` |

---

## 🐘 Option 2: PostgreSQL (Production Setup)

For production-ready setup with PostgreSQL.

### Step 1: Install PostgreSQL

**If not already installed:**

**Windows:** Download from https://www.postgresql.org/download/windows/

**Verify Installation:**
```bash
psql --version
```

### Step 2: Create Database

Open **pgAdmin** or use **psql command line**:

```sql
CREATE DATABASE hallsystem;
```

**Or using command line:**
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE hallsystem;

# Exit
\q
```

### Step 3: Create .env File

Create **`.env`** with your PostgreSQL credentials:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/hallsystem?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"
NODE_ENV="development"
```

**Replace `YOUR_PASSWORD` with your PostgreSQL password!**

**Generate a secure NEXTAUTH_SECRET:**
```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Step 4: Generate Prisma Client

```bash
npm run db:generate
```

### Step 5: Create Database Tables

```bash
npm run db:push
```

### Step 6: Seed Sample Data

```bash
npx prisma db seed
```

### Step 7: Start Development Server

```bash
npm run dev
```

### Step 8: Login

Open **http://localhost:3000** and login with the credentials from Option 1.

---

## 🔍 Verify Setup

After completing either option, verify everything works:

### 1. Check Database Tables

```bash
npm run db:studio
```

This opens **Prisma Studio** at http://localhost:5555 where you can browse all data.

### 2. Test Login

- Open http://localhost:3000
- You should see the Arabic login page "برنامج مناسبات"
- Login with `admin` / `password123`
- You should see the dashboard with stats

### 3. Test Different Roles

Logout and login with each role to see different menu permissions:
- **Admin**: Full access (all menu items)
- **Supervisor**: No "المستخدمين" or "الإعدادات" 
- **Accountant**: Only "المالية" access
- **Employee**: Basic access to bookings and calendar

---

## 🛠️ Troubleshooting

### ❌ Error: Module '"@prisma/client"' has no exported member

**Solution:**
```bash
npm run db:generate
```

### ❌ Error: Can't reach database server

**For SQLite:** Make sure you updated `schema.prisma` to use `sqlite` provider.

**For PostgreSQL:**
- Verify PostgreSQL is running: `pg_isready`
- Check DATABASE_URL in `.env`
- Test connection: `psql -U postgres -d hallsystem`

### ❌ Error during seed: Unique constraint failed

**Solution:** Database already has data. To reset:

**SQLite:**
```bash
# Delete the database file
rm dev.db    # Linux/Mac
del dev.db   # Windows

# Recreate tables and seed
npm run db:push
npx prisma db seed
```

**PostgreSQL:**
```bash
# Reset database
npx prisma db push --force-reset
npx prisma db seed
```

### ❌ Error: bcryptjs module not found

**Solution:**
```bash
npm install bcryptjs @types/bcryptjs
```

### ❌ Port 3000 already in use

**Solution:**
```bash
# Kill the process on port 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F

# Linux/Mac:
lsof -ti:3000 | xargs kill -9
```

---

## 📁 What Gets Created

After successful setup, your project will have:

```
hallsystem/
├── .env                    # Your environment variables
├── dev.db                  # SQLite database (if using SQLite)
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts            # Seed script
└── node_modules/
    └── .prisma/
        └── client/         # Generated Prisma Client
```

---

## 🎯 Next Steps

1. ✅ **Explore the Dashboard**: Login and check different pages
2. ✅ **Test Role Permissions**: Login with different users
3. ✅ **View Sample Data**: Open Prisma Studio (`npm run db:studio`)
4. 📖 **Read the Docs**: Check DATABASE_SETUP.md for more details
5. 🚀 **Start Building**: Add new bookings, customers, and halls!

---

## 📞 Need Help?

- Check **DATABASE_SETUP.md** for detailed PostgreSQL setup
- Run `npm run db:studio` to visually inspect your database
- Review the seed data in `prisma/seed.ts`

Happy coding! 🎉

