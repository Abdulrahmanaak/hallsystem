@echo off
echo =====================================================
echo   Hall Management System - Database Setup
echo =====================================================
echo.

echo Step 1: Checking for .env file...
if not exist ".env" (
    echo .env file not found!
    echo.
    echo Please create a .env file with the following content:
    echo.
    echo DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/hallsystem?schema=public"
    echo NEXTAUTH_URL="http://localhost:3000"
    echo NEXTAUTH_SECRET="generate-a-secret-here"
    echo QOYOD_ENABLED="false"
    echo.
    echo Press any key to open DATABASE_SETUP.md for detailed instructions...
    pause > nul
    start DATABASE_SETUP.md
    exit /b 1
)

echo ✓ .env file found
echo.

echo Step 2: Generating Prisma Client...
call npm run db:generate
if errorlevel 1 (
    echo ✗ Failed to generate Prisma Client
    pause
    exit /b 1
)
echo ✓ Prisma Client generated
echo.

echo Step 3: Pushing schema to database...
call npm run db:push
if errorlevel 1 (
    echo ✗ Failed to push schema to database
    echo.
    echo Make sure:
    echo - PostgreSQL is running
    echo - Database "hallsystem" exists
    echo - Credentials in .env are correct
    pause
    exit /b 1
)
echo ✓ Schema pushed to database
echo.

echo Step 4: Seeding sample data...
call npx prisma db seed
if errorlevel 1 (
    echo ✗ Failed to seed database
    pause
    exit /b 1
)
echo.

echo =====================================================
echo   ✨ Database setup complete!
echo =====================================================
echo.
echo Login credentials:
echo   Admin:      username: admin      ^| password: password123
echo   Supervisor: username: supervisor ^| password: password123
echo   Accountant: username: accountant ^| password: password123
echo   Employee:   username: employee   ^| password: password123
echo.
echo Next step: Run "npm run dev" to start the application
echo.
pause
