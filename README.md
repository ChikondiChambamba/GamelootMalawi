# GameLootMalawi

GameLootMalawi is a Node.js and Express e-commerce platform for selling gaming consoles, games, accessories, and electronics. It combines a server-rendered storefront, customer account flows, a checkout and order pipeline, promotional and rewards features, and an admin back office for catalog, order, payment, and sales-report management.

The application is built as a monolithic web app with EJS views, MySQL persistence, session-based web authentication, JWT-backed API routes, PDF invoice/report generation, and email notifications.

## Features

### Storefront

- Home page with featured and latest products
- Product catalog with category filtering and search
- Product detail pages with gallery and specifications
- Category landing pages
- Customer-service content pages:
  - `/contact`
  - `/faq`
  - `/shipping`
  - `/returns`
  - `/warranty`

### Shopping and checkout

- Guest cart stored in session
- Authenticated cart stored in MySQL
- Cart add, update, and remove flows
- Checkout with CSRF protection and anti-double-submit nonce
- Receipt upload for transfer-based payments
- Order creation with transaction-safe inserts into `orders` and `order_items`
- Order success page

### Customer account

- Registration and login
- Profile page
- Order history
- Forgot-password and reset-password flow

### Admin

- Product management
- Category management
- Order management and status updates
- Payment settings management
- Price calculator settings
- Sales report view with:
  - sold products
  - buyer details
  - per-line pricing
  - PDF export
  - Excel export

### Operations and integrations

- Email sending via Nodemailer
- Customer/admin order confirmation emails
- Order-status update emails
- PDF invoice generation
- Branded PDF headers shared across system PDFs
- Optional Cloudinary-backed media uploads
- `/health` endpoint with mailer and upload status

## Tech Stack

- Backend: Node.js, Express 5
- Templating: EJS
- Database: MySQL via `mysql2`
- Auth: `express-session`, `jsonwebtoken`, `bcryptjs`
- Security: `helmet`, `express-rate-limit`, CSRF middleware, same-origin protection
- Uploads: `multer`, `multer-storage-cloudinary`, Cloudinary
- Email: Nodemailer
- Documents: PDFKit
- Frontend: Bootstrap, vanilla JavaScript, EJS-rendered HTML

## Architecture Overview

This repository is an Express monolith with both SSR and API endpoints.

- Web layer: server-rendered pages under [routes/web](/c:/Users/victus/Documents/GitHub/GamelootMalawi/routes/web)
- API layer: JSON routes under [routes](/c:/Users/victus/Documents/GitHub/GamelootMalawi/routes)
- Controllers: [controllers](/c:/Users/victus/Documents/GitHub/GamelootMalawi/controllers)
- Models and SQL access: [models](/c:/Users/victus/Documents/GitHub/GamelootMalawi/models)
- Utilities: [utils](/c:/Users/victus/Documents/GitHub/GamelootMalawi/utils)
- Views: [views](/c:/Users/victus/Documents/GitHub/GamelootMalawi/views)
- Static assets: [public](/c:/Users/victus/Documents/GitHub/GamelootMalawi/public)

Application bootstrap happens in [app.js](/c:/Users/victus/Documents/GitHub/GamelootMalawi/app.js), where the app configures:

- Helmet and CSP
- body parsing
- session management
- flash messaging
- CSRF middleware
- rate limiting
- static asset serving
- request logging
- web and API route mounting
- global error handling

## Repository Structure

```text
GamelootMalawi/
├─ app.js
├─ config/
│  ├─ cloudinaryConfig.js
│  ├─ database.js
│  └─ env.js
├─ controllers/
├─ database/
│  └─ schema.sql
├─ middleware/
├─ models/
├─ public/
│  ├─ css/
│  ├─ images/
│  ├─ js/
│  └─ uploads/
├─ routes/
│  ├─ web/
│  ├─ auth.js
│  ├─ categories.js
│  ├─ order.js
│  └─ product.js
├─ scripts/
├─ utils/
├─ views/
│  ├─ pages/
│  ├─ partials/
│  └─ layout.ejs
└─ README.md
```

## Key Routes

### Web routes

- `/` home page
- `/shop` product listing and search
- `/category/:slug` category page
- `/product/:id` product detail page
- `/cart` cart page
- `/checkout` checkout page
- `/orders` customer orders
- `/profile` customer profile
- `/contact`, `/faq`, `/shipping`, `/returns`, `/warranty` customer-service pages
- `/admin` admin dashboard
- `/admin/products` product management
- `/admin/orders` order management
- `/admin/sales-report` sales report
- `/admin/payment-settings` payment settings

### API routes

- `/api/auth`
- `/api/products`
- `/api/orders`
- `/api/categories`

## Data Model

The baseline SQL schema is in [database/schema.sql](/c:/Users/victus/Documents/GitHub/GamelootMalawi/database/schema.sql).

Primary tables:

- `categories`
- `products`
- `users`
- `orders`
- `order_items`
- `cart_items`

Additional runtime-managed tables may be created by models for features such as:

- payment settings
- price calculator settings
- reward coupons
- promotions and winners
- password reset flow support

The codebase is intentionally defensive about schema drift in some places. For example, certain inserts or lookups fall back when optional columns are missing in older environments.

## Authentication Model

The project uses two auth styles:

- Session-based auth for the web app
- JWT auth for the JSON API

Web flows rely on `req.session.user` and secure cookies. API flows use Bearer tokens verified by middleware.

## Security Features

- Helmet headers with CSP
- rate limiting for global writes, login, registration, and forgot-password flows
- CSRF token generation and verification
- same-origin protection for mutating requests
- secure session cookies in production
- `x-powered-by` disabled

## Upload Strategy

### Product media

Product uploads can use:

- local disk storage in development
- Cloudinary in production-like environments when credentials are configured

See [config/cloudinaryConfig.js](/c:/Users/victus/Documents/GitHub/GamelootMalawi/config/cloudinaryConfig.js).

### Payment receipts

Checkout receipt uploads are currently stored under `public/uploads/receipts`.

## Email and PDF Generation

Email delivery is centralized in [utils/mailer.js](/c:/Users/victus/Documents/GitHub/GamelootMalawi/utils/mailer.js).

Capabilities:

- SMTP transport configuration
- transporter health reporting
- development fallback to `tmp/emails.log`
- customer and admin order emails
- order-status update emails

PDF generation includes:

- branded invoice PDF generation in [utils/invoicePdf.js](/c:/Users/victus/Documents/GitHub/GamelootMalawi/utils/invoicePdf.js)
- shared branded header helper in [utils/pdfBranding.js](/c:/Users/victus/Documents/GitHub/GamelootMalawi/utils/pdfBranding.js)
- sales report PDF export in [utils/salesReportPdf.js](/c:/Users/victus/Documents/GitHub/GamelootMalawi/utils/salesReportPdf.js)

Excel export for the sales report is generated in [utils/salesReportExcel.js](/c:/Users/victus/Documents/GitHub/GamelootMalawi/utils/salesReportExcel.js).

## Environment Variables

This project uses `.env` and configuration fallbacks from [config/env.js](/c:/Users/victus/Documents/GitHub/GamelootMalawi/config/env.js) and [config/database.js](/c:/Users/victus/Documents/GitHub/GamelootMalawi/config/database.js).

Create a `.env` file in the project root with values like:

```env
NODE_ENV=development
PORT=5000

SESSION_SECRET=change-this-in-production

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your-password
DB_NAME=gamelootmalawi
DB_SSL=false

DATABASE_URL=
MYSQL_URL=
MYSQL_PUBLIC_URL=
MYSQLHOST=
MYSQLPORT=
MYSQLUSER=
MYSQLPASSWORD=
MYSQLDATABASE=

JWT_SECRET=replace-this
JWT_EXPIRES_IN=7d

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-app-password
SMTP_SECURE=false
SMTP_FROM=your-email@example.com
ADMIN_INVOICE_EMAIL=admin@example.com
SMTP_DEBUG=false

APP_BASE_URL=http://localhost:5000

CLOUDINARY_URL=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_ENABLED=false

DB_POOL_SIZE=10
DB_CONNECT_TIMEOUT_MS=10000
RENDER=false
```

### Notes

- `SESSION_SECRET` is required in production.
- The app supports `DATABASE_URL` and Railway-style MySQL environment variables.
- If using Gmail SMTP, it is safest for `SMTP_FROM` to match `SMTP_USER`.
- In development, Cloudinary is off unless explicitly enabled.
- In production-like environments, Cloudinary is used when credentials are present.

## Installation

### Prerequisites

- Node.js `>=20 <23`
- MySQL
- npm

### Setup

1. Clone the repository.
2. Install dependencies.
3. Create and populate `.env`.
4. Create the database and apply the schema.
5. Start the server.

```bash
npm install
npm run dev
```

To run in standard mode:

```bash
npm start
```

## Database Setup

Apply the base schema from [database/schema.sql](/c:/Users/victus/Documents/GitHub/GamelootMalawi/database/schema.sql) using your preferred MySQL client.

Example:

```sql
SOURCE database/schema.sql;
```

The schema seeds:

- categories
- sample products
- sample users

Some feature tables are created lazily at runtime by the relevant models.

## Available Scripts

Defined in [package.json](/c:/Users/victus/Documents/GitHub/GamelootMalawi/package.json):

- `npm start` runs the production server
- `npm run dev` starts the app in watch mode
- `npm run test-db` runs the database connectivity test
- `npm run test-mailer` runs the mailer test script

Additional helper scripts in [scripts](/c:/Users/victus/Documents/GitHub/GamelootMalawi/scripts):

- `init_promotions.js`
- `reset-admin-password.js`
- `run_giveaway.js`
- `test-db.js`
- `test-mailer.js`

## Health Check

The app exposes:

```text
GET /health
```

Response includes:

- service name
- environment
- upload directory writability
- mailer status
- uptime
- timestamp

This is useful when diagnosing deployment, storage, or SMTP issues.

## Development Notes

### Sessions and locals

The app injects the following into `res.locals` for views:

- `currentUser`
- `cartCount`
- `searchTerm`
- `success`
- `error`

### Frontend behavior

Client-side behavior is mostly in:

- [public/js/main.js](/c:/Users/victus/Documents/GitHub/GamelootMalawi/public/js/main.js)
- [public/js/admin.js](/c:/Users/victus/Documents/GitHub/GamelootMalawi/public/js/admin.js)

This includes:

- cart actions
- UI toggles
- admin form submissions
- admin order status changes

### Admin UI

Admin pages are EJS-driven and enhanced with frontend JS for editing, modal interactions, and async actions.

## Deployment Notes

Before deploying, verify:

- `SESSION_SECRET` is set
- database credentials or `DATABASE_URL` are correct
- SMTP values are valid if email is required
- `APP_BASE_URL` matches the deployed site
- upload strategy matches the hosting environment

### Important operational considerations

- Product uploads are Cloudinary-ready.
- Payment receipts currently rely on local disk storage.
- Order emails are sent after checkout completion, so order creation can succeed even if email delivery fails.
- The `/health` endpoint is the quickest way to inspect mailer readiness.

## Documentation Files

This repository also includes supporting docs:

- [INTERVIEW_PREP_BACKEND_WEB.md](/c:/Users/victus/Documents/GitHub/GamelootMalawi/INTERVIEW_PREP_BACKEND_WEB.md)
- [PRICE_CALCULATOR_README.md](/c:/Users/victus/Documents/GitHub/GamelootMalawi/PRICE_CALCULATOR_README.md)
- [CALCULATOR_TESTING_GUIDE.md](/c:/Users/victus/Documents/GitHub/GamelootMalawi/CALCULATOR_TESTING_GUIDE.md)

## Known Gaps / Current Constraints

- There is no automated test suite configured yet.
- Some tables are created lazily at runtime rather than through a strict migration system.
- The codebase mixes route-level and controller-level business logic depending on feature area.
- Receipt storage is still local-disk based.

## Suggested Next Improvements

- Add a migration workflow for schema changes
- Add automated unit/integration tests
- Move receipt uploads to cloud storage
- Add durable background jobs for email sending
- Consolidate overlapping auth middleware

## License

ISC
