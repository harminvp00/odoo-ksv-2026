# VendorBridge - Procurement & Vendor Management ERP

VendorBridge is a centralized, role-based Enterprise Resource Planning (ERP) platform designed to simplify, structure, and automate organizational procurement operations. The platform integrates and handles relational workflows spanning User Roles, Vendor Profiles, Requests for Quotation (RFQs), Vendor Quotations, Procurement Approvals, Purchase Orders (POs), and Invoice generation with PDF/Print/Email support.

---

## Technical Stack
- **Frontend:** React (TypeScript, Vite, Tailwind CSS, Lucide React, Recharts)
- **Backend:** Node.js (TypeScript, Express, Winston Logger, Zod Validations)
- **Database ORM:** Prisma ORM connecting to PostgreSQL

---

## Implementation Roadmap & Feature Priorities

To build **VendorBridge** successfully, follow this relational, step-by-step implementation sequence. Building core infrastructure first ensures that subsequent features connect smoothly to existing database relations.

### Phase 1: High Priority (Core Relational Infrastructure)
1. **User Authentication & Role-Based Access Control (RBAC):**
   - *Backend:* [auth.routes.ts](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/server/src/routes/auth.routes.ts) and [auth.controller.ts](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/server/src/controllers/auth.controller.ts) using JWT tokens.
   - *Frontend:* [Login.tsx](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/client/src/features/auth/Login.tsx) and [Register.tsx](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/client/src/features/auth/Register.tsx).
   - *Why:* All database tables (Vendors, RFQs, etc.) relate to a specific `User` ID or require specific `Role` rights (Officer, Vendor, Manager, Admin).
2. **Vendor Directory Profile Management:**
   - *Backend:* [vendor.routes.ts](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/server/src/routes/vendor.routes.ts) and [vendor.controller.ts](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/server/src/controllers/vendor.controller.ts).
   - *Frontend:* [VendorsPage.tsx](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/client/src/features/vendors/VendorsPage.tsx).
   - *Why:* You cannot create or assign RFQs without registered active vendors on the platform.
3. **RFQ Creation Wizard & Stepped Forms:**
   - *Backend:* [rfq.routes.ts](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/server/src/routes/rfq.routes.ts) and [rfq.controller.ts](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/server/src/controllers/rfq.controller.ts).
   - *Frontend:* [RFQCreate.tsx](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/client/src/features/rfqs/RFQCreate.tsx).
   - *Why:* RFQs are the entry point of the procurement lifecycle.

### Phase 2: Medium Priority (Bidding & Approval Flow)
4. **Vendor Bidding & Quotation Submissions:**
   - *Backend:* [quotation.routes.ts](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/server/src/routes/quotation.routes.ts) and [quotation.controller.ts](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/server/src/controllers/quotation.controller.ts).
   - *Frontend:* [QuotationSubmit.tsx](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/client/src/features/quotations/QuotationSubmit.tsx).
   - *Why:* Enables vendors to submit pricing, delivery schedules, and payment terms against published RFQs.
5. **Bid Comparison Grid:**
   - *Backend:* `/compare/:rfqId` endpoint inside [quotation.controller.ts](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/server/src/controllers/quotation.controller.ts).
   - *Frontend:* [QuotationCompare.tsx](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/client/src/features/quotations/QuotationCompare.tsx).
   - *Why:* Helps Procurement Officers choose the most suitable bid (usually lowest price) and initiate approvals.
6. **Approval Chain Workflows:**
   - *Backend:* [approval.routes.ts](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/server/src/routes/approval.routes.ts) and [approval.controller.ts](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/server/src/controllers/approval.controller.ts).
   - *Frontend:* [ApprovalWorkflow.tsx](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/client/src/features/approvals/ApprovalWorkflow.tsx).
   - *Why:* Restricts PO creation until authorized managers (L1 Head and L2 Finance Manager) approve the chosen bid.

### Phase 3: Low Priority (Document Generation & Reporting)
7. **Purchase Order (PO) & Invoice Generation:**
   - *Backend:* [po.routes.ts](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/server/src/routes/po.routes.ts), [invoice.routes.ts](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/server/src/routes/invoice.routes.ts) and [pdf.service.ts](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/server/src/services/pdf.service.ts).
   - *Frontend:* [POInvoiceDetail.tsx](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/client/src/features/invoices/POInvoiceDetail.tsx).
   - *Why:* Translates approved bids into formal legally-binding POs and invoices.
8. **Email Notifier Service:**
   - *Backend:* [email.service.ts](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/server/src/services/email.service.ts) to send out invoices and alerts.
   - *Why:* Important communication helper, but does not block the core relational procurement workflow.
9. **Activity Logs & Audit Trails:**
   - *Backend:* [activity.routes.ts](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/server/src/routes/activity.routes.ts) tracking system state transitions.
   - *Frontend:* [ActivityLogs.tsx](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/client/src/features/activity/ActivityLogs.tsx).
   - *Why:* Record keeping that compiles historical events.
10. **Reports & Analytics Dashboard:**
    - *Backend:* [report.routes.ts](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/server/src/routes/report.routes.ts) running database aggregates.
    - *Frontend:* [ReportsAnalytics.tsx](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/client/src/features/reports/ReportsAnalytics.tsx).
    - *Why:* Summarizes procurement insights after a history of POs and invoices are generated.

---

## Detailed Directory & File Structure Walkthrough

Below is an alphabetical mapping of the files and folders generated on disk. Click any file link to open it directly.

### 1. Client Side (React application under `client/`)

#### Build & Settings Configurations
- [client/package.json](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/client/package.json) - Defines Vite, React, Tailwind, and charting package dependencies and scripts.
- [client/tsconfig.json](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/client/tsconfig.json) - Main TypeScript compiler parameters tailored for bundler resolution and strict typing rules.
- [client/tsconfig.node.json](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/client/tsconfig.node.json) - Specific compiler rules for the Node-based build config (`vite.config.ts`).
- [client/vite.config.ts](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/client/vite.config.ts) - Sets up development server, target ports, and proxy mapping requests from `/api` to the local Node backend.
- [client/tailwind.config.js](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/client/tailwind.config.js) - Extends colors for a dark-themed visual design matching the mockups.
- [client/index.html](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/client/index.html) - Entry HTML loader linking Google fonts (Outfit) and custom theme resets.

#### Application Setup
- [client/src/main.tsx](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/client/src/main.tsx) - Standard React main bootstrapping file mounting the virtual DOM structure.
- [client/src/index.css](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/client/src/index.css) - Houses utility CSS classes (Tailwind bindings, glassmorphic panel stylings).
- [client/src/App.tsx](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/client/src/App.tsx) - Sets up App Router with explicit path navigation routes.

#### Common Layout & Shared Components
- [client/src/components/common/Sidebar.tsx](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/client/src/components/common/Sidebar.tsx) - Left-side panel for unified application module navigation.
- [client/src/components/common/Navbar.tsx](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/client/src/components/common/Navbar.tsx) - Header displaying active notifications, session user profiles, and roles.
- [client/src/components/common/Button.tsx](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/client/src/components/common/Button.tsx) - Reusable interactive buttons supporting dynamic variants (`primary`, `secondary`, `danger`, `ghost`).
- [client/src/components/common/Table.tsx](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/client/src/components/common/Table.tsx) - Custom structured grid layout wrapping tables.
- [client/src/components/common/Input.tsx](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/client/src/components/common/Input.tsx) - Standardized textbox fields with integrated error styling.
- [client/src/components/common/Modal.tsx](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/client/src/components/common/Modal.tsx) - Dialog element wrapping forms.

#### State Contexts & Hook wrappers
- [client/src/context/AuthContext.tsx](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/client/src/context/AuthContext.tsx) - Stores active login details, session keys, and manages logging in/out.
- [client/src/context/NotificationContext.tsx](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/client/src/context/NotificationContext.tsx) - Manages app-wide alert cards (for live status updates).
- [client/src/hooks/useAuth.ts](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/client/src/hooks/useAuth.ts) - Helper hook accessing user state contexts.

#### Web Services (HTTP Axios Integrations)
- [client/src/services/api.ts](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/client/src/services/api.ts) - Preconfigured Axios instance appending JWT bearer tokens dynamically.
- [client/src/services/auth.service.ts](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/client/src/services/auth.service.ts) - APIs for login validation, signups, and password requests.
- [client/src/services/vendor.service.ts](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/client/src/services/vendor.service.ts) - Handles supplier profiles list and registrations.
- [client/src/services/rfq.service.ts](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/client/src/services/rfq.service.ts) - Registers details for new RFQs and target vendors.
- [client/src/services/quotation.service.ts](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/client/src/services/quotation.service.ts) - APIs to submit prices or retrieve side-by-side grids.
- [client/src/services/approval.service.ts](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/client/src/services/approval.service.ts) - Validates transitions for multi-stage approvals.
- [client/src/services/invoice.service.ts](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/client/src/services/invoice.service.ts) - PDF downloads, invoice details, and email notifications.
- [client/src/services/activity.service.ts](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/client/src/services/activity.service.ts) - Feeds live audit timeline events.

#### Core Feature Modules
- [client/src/features/auth/Login.tsx](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/client/src/features/auth/Login.tsx) - **Screen 1:** Validates user entry and maps dashboard routing.
- [client/src/features/auth/Register.tsx](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/client/src/features/auth/Register.tsx) - **Screen 2:** Unified registration form collecting contact and role details.
- [client/src/features/auth/ForgotPassword.tsx](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/client/src/features/auth/ForgotPassword.tsx) - Requests account resets and sends recovery emails.
- [client/src/features/dashboard/Dashboard.tsx](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/client/src/features/dashboard/Dashboard.tsx) - **Screen 3:** Procurement officer dashboard. Summarizes statistics, active RFQs, and purchase tables.
- [client/src/features/vendors/VendorsPage.tsx](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/client/src/features/vendors/VendorsPage.tsx) - **Screen 4:** Directory to register suppliers, search entries, and filter lists.
- [client/src/features/rfqs/RFQCreate.tsx](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/client/src/features/rfqs/RFQCreate.tsx) - **Screen 5:** Multi-step wizard to create RFQs, manage line items, and assign vendors.
- [client/src/features/quotations/QuotationSubmit.tsx](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/client/src/features/quotations/QuotationSubmit.tsx) - **Screen 6:** Vendor bidding form for entering unit prices, delivery times, and notes.
- [client/src/features/quotations/QuotationCompare.tsx](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/client/src/features/quotations/QuotationCompare.tsx) - **Screen 7:** Grid page comparing vendor bids side-by-side and highlighting the lowest bid.
- [client/src/features/approvals/ApprovalWorkflow.tsx](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/client/src/features/approvals/ApprovalWorkflow.tsx) - **Screen 8:** Chain log page tracking approval steps and comments.
- [client/src/features/invoices/POInvoiceDetail.tsx](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/client/src/features/invoices/POInvoiceDetail.tsx) - **Screen 9:** Formatted document viewer showing invoice/PO line items, taxes, and download options.
- [client/src/features/activity/ActivityLogs.tsx](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/client/src/features/activity/ActivityLogs.tsx) - **Screen 10:** Detailed logs list filtering audit actions.
- [client/src/features/reports/ReportsAnalytics.tsx](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/client/src/features/reports/ReportsAnalytics.tsx) - **Screen 11:** Interactive charts displaying total spending and category metrics.

---

### 2. Server Side (Express server under `server/`)

#### Build & Database Configurations
- [server/package.json](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/server/package.json) - Defines runtime scripts and dependency list (Express, CORS, Prisma, Winston, TypeScript).
- [server/tsconfig.json](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/server/tsconfig.json) - Handles server compilation rules (mapping commonjs output to `/dist`).
- [server/prisma/schema.prisma](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/server/prisma/schema.prisma) - **Database Schema Design:** Specifies standard models (`User`, `Vendor`, `RFQ`, `RFQLineItem`, `Quotation`, `Approval`, `PurchaseOrder`, `Invoice`, `ActivityLog`) and their relationships.

#### Application Setup & Environment
- [server/src/index.ts](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/server/src/index.ts) - Standard app launcher mapping Express to a designated port.
- [server/src/app.ts](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/server/src/app.ts) - Initial app config binding middlewares (CORS, parser) and routing models.
- [server/src/config/db.ts](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/server/src/config/db.ts) - Initializer exposing the Prisma Client object.
- [server/src/config/env.ts](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/server/src/config/env.ts) - Loads and validates environment variables.

#### Express Middlewares
- [server/src/middlewares/auth.middleware.ts](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/server/src/middlewares/auth.middleware.ts) - Decrypts Bearer JWT tokens and checks authorization.
- [server/src/middlewares/role.middleware.ts](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/server/src/middlewares/role.middleware.ts) - Implements role-based access control (RBAC).
- [server/src/middlewares/error.middleware.ts](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/server/src/middlewares/error.middleware.ts) - Central Express exception handling middleware.
- [server/src/middlewares/validation.middleware.ts](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/server/src/middlewares/validation.middleware.ts) - Uses schema validators to assert parameter shapes before executing routes.

#### Routing Controllers & Business Logic
- [server/src/routes/index.ts](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/server/src/routes/index.ts) - Central API router index mapping resource endpoints.
- Controllers ([controllers/](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/server/src/controllers/)) and Routers ([routes/](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/server/src/routes/)) handle endpoints for:
  - Auth, Vendors, RFQs, Quotations, Approvals, Purchase Orders (PO), Invoices, Activity logs, and Reports.

#### Utility Services
- [server/src/services/email.service.ts](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/server/src/services/email.service.ts) - Custom utility class containing triggers to send emails.
- [server/src/services/pdf.service.ts](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/server/src/services/pdf.service.ts) - Handles generating PDF binary file buffers.
- [server/src/utils/logger.ts](file:///c:/Users/gokan/OneDrive/Desktop/odoo-ksv-2026/server/src/utils/logger.ts) - Implements Winston logger for server output tracking.

---

## Step-by-Step Execution Commands

Follow these steps to configure, build, and run the VendorBridge system:

### Phase 1: Environment Setup

Create an environment configuration file named `.env` in the `server` directory:

```ini
PORT=5000
DATABASE_URL="postgresql://<username>:<password>@localhost:5432/<database_name>?schema=public"
JWT_SECRET="generate-a-secure-secret-key-phrase"
SMTP_HOST="smtp.mailtrap.io"
SMTP_PORT=2525
SMTP_USER="smtp-username"
SMTP_PASS="smtp-password"
```

---

### Phase 2: Database Migration Setup (Prisma)

Open a terminal at the project root and navigate to the `server/` directory:

```bash
cd server
```

Install dependency packages:

```bash
npm install
```

Generate Prisma Client assets locally on disk:

```bash
npx prisma generate
```

Create migration tables in PostgreSQL database:

```bash
npx prisma migrate dev --name init
```

*(Optional)* Run Prisma Studio database browser:

```bash
npx prisma studio
```

---

### Phase 3: Launching the Backend Express Server

Navigate to the `server/` directory and execute:

```bash
npm run dev
```

This starts the API listener on `http://localhost:5000`.

---

### Phase 4: Launching the Frontend React Application

Open a new terminal window at the project root and navigate to the `client/` directory:

```bash
cd client
```

Install frontend package dependencies:

```bash
npm install
```

Launch the Vite hot-reloading development server:

```bash
npm run dev
```

The app will start at `http://localhost:5173`.