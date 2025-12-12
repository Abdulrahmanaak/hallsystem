# SQLite Configuration Guide

## What needs to be changed in schema.prisma

Find these lines (lines 8-10) in `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"      ← CHANGE THIS
  url      = env("DATABASE_URL")
}
```

Change `postgresql` to `sqlite`:

```prisma
datasource db {
  provider = "sqlite"          ← TO THIS
  url      = env("DATABASE_URL")
}
```

That's the ONLY change needed!

## Full comparison:

### ❌ BEFORE (PostgreSQL):
```prisma
// Prisma Schema for Hall Management System
// Sprint 1 MVP - Arabic Hall Management with Qoyod Integration

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"          ← THIS LINE
  url      = env("DATABASE_URL")
}
```

### ✅ AFTER (SQLite):
```prisma
// Prisma Schema for Hall Management System
// Sprint 1 MVP - Arabic Hall Management with Qoyod Integration

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"              ← THIS LINE  
  url      = env("DATABASE_URL")
}
```

Save the file and continue with the setup steps!
