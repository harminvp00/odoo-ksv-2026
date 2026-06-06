# 🌉 VendorBridge — Enterprise Procurement & Vendor Management ERP

VendorBridge is a centralized, role-based **Enterprise Resource Planning (ERP)** platform designed to simplify, structure, and automate organizational procurement operations. 

From vendor onboarding and Request for Quotation (RFQ) creation to side-by-side bid analysis, multi-tiered approval workflows, automated Purchase Order (PO) issuance, and invoice management (with PDF generation and email dispatch), VendorBridge handles the entire procurement lifecycle securely and transparently.

---

## 🚀 Key Features by Role

### 🔴 Administrator (Super-Admin)
* **Full Oversight Dashboard:** Access KPI metrics (Active RFQs, Pending Approvals, POs Issued, and Total Spend).
* **Vendor Directory Management:** Review all registered vendors, activate pending accounts, or block/activate vendors.
* **Special Approval Bypass:** Admin retains authority to bypass the normal workflow chain and approve/reject any pending bid directly.
* **Invoice & Payment Controls:** Generate invoices from sent POs, update invoice status (Paid, Overdue, Pending), download PDFs, and trigger supplier emails.

### 🔵 Procurement Officer (Buyer)
* **RFQ Creation Wizard:** A stepped form to draft RFQs, add line items (with quantities and units), and assign specific vendors.
* **Bid Comparison Grid:** Compare multiple vendor quotations side-by-side. The system automatically highlights the lowest bid.
* **L1 Verification:** Kick-start the approval chain by verifying quotes at the L1 stage.
* **Document Generation:** Initiate invoice generation against acknowledged Purchase Orders.

### 🟡 Operations Manager (Approver)
* **Approvals Hub:** Dedicated queue to action pending L2 approval requests.
* **PO Auto-Generation:** Approving a bid at L2 automatically generates a formal Purchase Order with status `DRAFT` and sends it to the supplier.
* **Reports & Analytics:** Access spend trends, monthly volume analysis, and vendor rating tables.

### 🟢 Vendor (Supplier)
* **Supplier Dashboard:** View assigned RFQs, quotation submission history, received POs, and total revenue.
* **Bid Submission Portal:** Review assigned RFQs and submit itemized unit prices, payment terms, and delivery times.
* **Document Downloads:** Review received Purchase Orders, generate/view invoice summaries, and download invoice PDFs.
* **System Notifications:** Receive real-time dashboard notifications for new RFQ assignments, PO issuances, and invoice updates.

---

## 🛠️ Technical Stack & Architecture

### Frontend (Client-side)
* **Framework:** React 18 with TypeScript & Vite (fast building and hot-reloading).
* **Styling:** Vanilla Tailwind CSS configured with custom color tokens for a professional dashboard aesthetic.
* **Icons:** Lucide React for modern, vector-based visual guides.
* **Charts & Visualizations:** Recharts wrapper for clean SVG-based analytics dashboards.
* **API Client:** Axios preconfigured with request interceptors to automatically append JWT bearer tokens.

### Backend (Server-side)
* **Runtime:** Node.js with TypeScript & Express.
* **Database & ORM:** PostgreSQL database managed via Prisma ORM for structured queries and type-safe schema modeling.
* **Logging:** Winston logger mapping timestamped records to both files and console streams.
* **PDF Utility:** PDFKit server-side engine to generate and stream print-ready invoice PDFs.
* **Mail Dispatch:** Nodemailer preconfigured with SMTP to send invoice notifications directly.

### Data Security & Input Validation
* **Password Hashing:** BcryptJS (10 rounds) for hashing passwords prior to DB writes.
* **Authentication:** Stateless JWT (Json Web Tokens) with middleware to parse and inject user contexts.
* **Input Validation (Zod):** Strict backend schema enforcement utilizing Zod validation schemas. Any requests failing type checks, length constraints, or email patterns are rejected before hitting the database:
  * **Authentication:** Enforces password complexity, email patterns, and role boundaries.
  * **Vendors:** Asserts valid 15-character GSTIN format (`^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$`).
  * **RFQs:** Validates future deadlines and item shapes.
  * **Quotations:** Validates non-negative numerical bids and totals.

---

## 📁 Project Structure

```
├── client/                     # React Frontend App
│   ├── src/
│   │   ├── components/         # Shared layouts, buttons, tables, modals
│   │   ├── context/            # AuthContext & NotificationContext
│   │   ├── features/           # Modules: Auth, Dashboard, RFQs, Invoices, etc.
│   │   ├── hooks/              # Custom hook wrappers (e.g. useAuth)
│   │   ├── services/           # Axios HTTP endpoints interfaces
│   │   ├── App.tsx             # Route management & ProtectedRoute layers
│   │   └── main.tsx            # Bootstrap entrypoint
│   ├── tailwind.config.js      # Custom styles config
│   └── tsconfig.json           # Frontend TS configuration
│
└── server/                     # Express Backend API
    ├── prisma/
    │   ├── schema.prisma       # Prisma DB models & relational constraints
    │   └── seed.ts             # Smart test database seeding script
    ├── src/
    │   ├── config/             # DB clients & environment variable loaders
    │   ├── controllers/        # Request handlers (RFQ, auth, invoice, etc.)
    │   ├── middlewares/        # JWT parsing, RBAC checking, Zod validator
    │   ├── routes/             # Express routes indexing
    │   ├── services/           # Business logic: Emails, notifications, logs
    │   ├── utils/              # Winston log logger, PDF generator
    │   └── validations/        # Zod validation schemas
    ├── tsconfig.json           # Backend TS configuration
    └── .env                    # Secret variables (database URL, JWT, SMTP)
```

---

## 🔌 Running Locally

### 1. Configuration (.env)
Create an environment file named `.env` in the `server/` directory:
```ini
PORT=5000
DATABASE_URL="postgresql://<username>:<password>@localhost:5432/<database_name>?schema=public"
JWT_SECRET="your-jwt-signing-secret"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-specific-password"
```

### 2. Setup the Database (Prisma)
From the `server/` folder:
```bash
# Install dependencies
npm install

# Generate the Prisma Client
npx prisma generate

# Execute DB Migrations
npx prisma migrate dev --name init
```

### 3. Seed Testing Data
To reset and seed the database with testing accounts and transactions:
```bash
# Run the seed script
npm run db:seed
```

### 4. Start Server and Client
* **Backend (`/server`):** `npm run dev` (Runs on `http://localhost:5000`)
* **Frontend (`/client`):** `npm run dev` (Runs on `http://localhost:5173`)

---

## 🧪 Testing Credentials

The seed script establishes the following user accounts for immediate testing:

| Role | Email | Password | Linked Company / Details |
|------|-------|----------|-------------------------|
| **ADMIN** | `admin@vendorbridge.com` | `Admin@1234` | System Administrator (Bypasses approval steps) |
| **PROCUREMENT_OFFICER** | `ashishgokani58@gmail.com` | *Registered password* | Fallback default: `Officer@1234` |
| **MANAGER / Approver** | `an1874600@gmail.com` | *Registered password* | Fallback default: `Manager@1234` |
| **VENDOR 1** | `vendor1@techsupply.com` | `Vendor@1234` | TechSupply Solutions Pvt. Ltd. (IT category) |
| **VENDOR 2** | `vendor2@officehub.com` | `Vendor@1234` | OfficeHub Enterprises (Furniture category) |
| **VENDOR 3** | `vendor3@logipro.com` | `Vendor@1234` | LogiPro Shipping & Logistics (Logistics category) |