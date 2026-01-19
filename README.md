# نظام إدارة القاعات (مناسبات)

نظام شامل ومتعدد المستأجرين لإدارة قاعات المناسبات، مصمم لتبسيط عمليات الحجز، والتتبع المالي، وإدارة العملاء. يتكامل هذا النظام بسلاسة مع **قيود (Qoyod)** لمزامنة البيانات المحاسبية.

## الميزات

### 🏢 الإدارة الأساسية
- **دعم تعدد المستأجرين (Multi-Tenant)**: إدارة عدة ملاك للقاعات وقاعاتهم مع ضمان عزل البيانات.
- **إدارة القاعات**: تكوين القاعات بالسعة، والأسعار، والمرافق، وتفاصيل الموقع.
- **التحكم في الوصول القائم على الأدوار (Role-Based Access Control)**:
    - `SUPER_ADMIN`: وصول كامل للنظام.
    - `HALL_OWNER`: إدارة القاعات الخاصة والموظفين والإعدادات.
    - `ROOM_SUPERVISOR`: إدارة الحجوزات والعمليات اليومية.
    - `ACCOUNTANT`: الوصول إلى السجلات المالية والفواتير.
    - `EMPLOYEE`: وصول تشغيلي أساسي.

### 📅 الحجوزات والعمليات
- **إدارة الحجوزات**: إنشاء وعرض وإدارة الحجوزات (معلقة، مؤكدة، ملغاة).
- **تخصيص المناسبة**: تحديد نوع المناسبة (زواج، اجتماع، إلخ)، التوقيت، عدد الضيوف، وتفضيلات الوجبات.
- **الخدمات والإضافات**: إدارة الخدمات الإضافية مثل الصبابين، الذبائح، وكراتين الماء.
- **كشف التعارض**: منع الحجوزات المزدوجة لنفس القاعة وفترة الوقت.

### 💰 المالية والمحاسبة
- **الفوترة**: إنشاء تلقائي للفواتير مع حساب ضريبة القيمة المضافة.
- **تتبع المدفوعات**: تسجيل مدفوعات جزئية أو كاملة (نقدي، تحويل، بطاقة).
- **تكامل قيود (Qoyod)**:
    - مزامنة العملاء، والفواتير، والمدفوعات إلى برنامج قيود المحاسبي.
    - تحديثات الحالة في الوقت الفعلي وتسجيل الأخطاء لعمليات المزامنة.

### 👥 إدارة علاقات العملاء (CRM)
- **ملفات العملاء**: تخزين تفاصيل الاتصال، وأرقام الهوية، وسجل الحجوزات.
- **مزامنة قيود**: ربط ملفات العملاء بجهات الاتصال في قيود.

## التقنيات المستخدمة

- **إطار العمل**: [Next.js 15](https://nextjs.org/) (App Router)
- **قاعدة البيانات**: [PostgreSQL](https://www.postgresql.org/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **التنسيق**: [Tailwind CSS](https://tailwindcss.com/)
- **مكونات الواجهة**: [Radix UI](https://www.radix-ui.com/) / [Lucide React](https://lucide.dev/)
- **المصادقة**: استخدام جلسات آمنة (تفاصيل التنفيذ في `src/lib/auth`).

## البدء

### المتطلبات الأساسية

- Node.js (v18 أو أعلى)
- قاعدة بيانات PostgreSQL
- مفتاح Qoyod API (للتكامل المحاسبي)

### التثبيت

1. **استنساخ المستودع (Clone):**
   ```bash
   git clone <repository-url>
   cd hallsystem
   ```

2. **تثبيت الاعتماديات:**
   ```bash
   npm install
   ```

3. **إعداد البيئة:**
   قم بإنشاء ملف `.env` في المجلد الجذر بناءً على `.env.example`:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/hallsystem"
   NEXTAUTH_SECRET="your-super-secret-key"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

4. **إعداد قاعدة البيانات:**
   ```bash
   # إنشاء عميل Prisma
   npm run db:generate

   # دفع المخطط (Schema) إلى قاعدة البيانات
   npm run db:push
   
   # (اختياري) تعبئة قاعدة البيانات ببيانات أولية
   npm run prisma:seed
   ```

5. **تشغيل خادم التطوير:**
   ```bash
   npm run dev
   ```
   يمكن الوصول إلى التطبيق عبر `http://localhost:3000`.

## النصوص البرمجية (Scripts)

- `npm run dev`: تشغيل خادم التطوير.
- `npm run build`: البناء للإنتاج.
- `npm run start`: تشغيل خادم الإنتاج.
- `npm run db:generate`: إنشاء عميل Prisma.
- `npm run db:push`: دفع مخطط Prisma إلى قاعدة البيانات.
- `npm run db:studio`: فتح Prisma Studio لإدارة البيانات بصرياً.

## هيكل المجلدات

- `src/app`: صفحات Next.js App Router ومسارات API.
- `src/components`: مكونات واجهة المستخدم القابلة لإعادة الاستخدام.
- `src/lib`: دوال مساعدة، اتصال بقاعدة البيانات، وتكامل الخدمات الخارجية.
- `prisma`: مخطط قاعدة البيانات ونصوص الإعداد (Seeds).

## الترخيص

ملكية خاصة. جميع الحقوق محفوظة.

---

# Hall Management System (Munaosabat)

A comprehensive, multi-tenant Hall Management System designed to streamline booking operations, financial tracking, and customer management for event halls. This system integrates seamlessly with **Qoyod** for accounting synchronization.

## Features

### 🏢 Core Management
- **Multi-Tenant Support**: Manage multiple hall owners and their respective halls with data isolation.
- **Hall Management**: Configure halls with capacity, pricing, amenities, and location details.
- **Role-Based Access Control**:
    - `SUPER_ADMIN`: Full system access.
    - `HALL_OWNER`: Manage own halls, staff, and settings.
    - `ROOM_SUPERVISOR`: Manage day-to-day bookings and operations.
    - `ACCOUNTANT`: Access to financial records and invoices.
    - `EMPLOYEE`: Basic operational access.

### 📅 Bookings & Operations
- **Booking Management**: Create, view, and manage bookings (Pending, Confirmed, Cancelled).
- **Event Customization**: Specify event type (Wedding, Meeting, etc.), timing, guest count, and meal preferences.
- **Services & Add-ons**: Manage additional services like coffee servers, sacrifices, and water cartons.
- **Conflict Detection**: Prevent double bookings for the same hall and time slot.

### 💰 Finance & Accounting
- **Invoicing**: Automatic invoice generation with VAT calculation.
- **Payment Tracking**: Record partial or full payments (Cash, Transfer, Card).
- **Qoyod Integration**:
    - Sync Customers, Invoices, and Payments to Qoyod Accounting Software.
    - Real-time status updates and error logging for sync operations.

### 👥 Customer CRM
- **Customer Profiles**: Store contact details, ID numbers, and booking history.
- **Qoyod Sync**: Link customer profiles to Qoyod contacts.

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) / [Lucide React](https://lucide.dev/)
- **Authentication**: Usage of secure sessions (implementation details in `src/lib/auth`).

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL Database
- Qoyod API Key (for accounting integration)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd hallsystem
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a `.env` file in the root directory based on `.env.example`:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/hallsystem"
   NEXTAUTH_SECRET="your-super-secret-key"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

4. **Database Setup:**
   ```bash
   # Generate Prisma client
   npm run db:generate

   # Push schema to database
   npm run db:push
   
   # (Optional) Seed the database with initial data
   npm run prisma:seed
   ```

5. **Run Development Server:**
   ```bash
   npm run dev
   ```
   Access the app at `http://localhost:3000`.

## Scripts

- `npm run dev`: Start development server.
- `npm run build`: Build for production.
- `npm run start`: Start production server.
- `npm run db:generate`: Generate Prisma Client.
- `npm run db:push`: Push Prisma schema to database.
- `npm run db:studio`: Open Prisma Studio to manage data visually.

## Folder Structure

- `src/app`: Next.js App Router pages and API routes.
- `src/components`: Reusable UI components.
- `src/lib`: Utility functions, DB connection, and external service integrations.
- `prisma`: Database schema and seed scripts.

## License

Private Property. All rights reserved.
