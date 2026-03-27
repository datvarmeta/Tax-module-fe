# BasalPay Web Frontend

Web checkout demo for the Tax Module — simulates an e-commerce flow where users purchase services with HBAR (Hedera), then receive a VAT e-invoice issued via Viettel SInvoice API.

## Tech Stack

- React 19 + TypeScript
- Vite 8 (dev server + build)
- Tailwind CSS 4
- Framer Motion (page transitions, animations)
- Lucide React (icons)

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint
npm run lint
```

The dev server proxies `/api/*` requests to the Go backend at `http://localhost:8080`. Make sure the backend is running (`make run` from the project root).

## Checkout Flow

The app implements a 5-step checkout:

### 1. Select (Shopping Cart)

Browse products, add to cart with quantity controls. A floating cart bar at the bottom shows item count, subtotal, and a "Proceed to Checkout" button. Supports search and category filtering.

### 2. Checkout

Review cart items (edit quantity, remove). Fill in buyer information (Personal or Business). Order summary sidebar shows per-item breakdown, subtotal, VAT (10%), network fee, total in VND, and HBAR conversion.

### 3. Payment

Connect a Hashpack wallet (simulated), review transaction details, confirm payment. The app then:

1. Creates an invoice via `POST /api/v1/invoices` (with all cart items)
2. Simulates blockchain processing steps
3. Saves the transaction hash via `PATCH /api/v1/invoices/:id/payment`
4. Submits the invoice for Viettel publishing via `POST /api/v1/invoices/:id/submit`

### 4. Success

Shows transaction receipt (hash, amounts, buyer, status). Polls `GET /api/v1/invoices/:id/status` until the invoice is completed or failed, then displays the VAT e-invoice generation result.

### 5. Invoice

Renders a formal VAT e-invoice with seller/buyer info, itemized table, subtotal/VAT/total, Viettel invoice code, and blockchain reference.

## API Endpoints Used

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/v1/invoices` | Create invoice with items array |
| `PATCH` | `/api/v1/invoices/:id/payment` | Save transaction hash |
| `POST` | `/api/v1/invoices/:id/submit` | Submit for Viettel publishing |
| `GET` | `/api/v1/invoices/:id/status` | Poll invoice status |
| `GET` | `/api/v1/invoices/:id` | Fetch full invoice with Viettel data |

## Project Structure

```
src/
├── main.tsx                  # App bootstrap
├── App.tsx                   # Root component, step routing
├── index.css                 # Tailwind import
├── types/index.ts            # Types, product data, constants
├── services/api.ts           # Backend API client
├── hooks/useSimulation.ts    # Central state (cart, steps, API calls)
└── components/
    ├── Header.tsx            # Nav bar with step indicator + cart badge
    ├── SelectStep.tsx        # Product grid + cart controls
    ├── CheckoutStep.tsx      # Cart review + buyer form + order summary
    ├── PaymentStep.tsx       # Wallet connection + payment confirmation
    ├── SuccessStep.tsx       # Transaction receipt + invoice polling
    └── InvoiceView.tsx       # VAT e-invoice display
```

## Constants

| Name | Value | Notes |
|------|-------|-------|
| `EXCHANGE_RATE` | 2,480 | VND per HBAR |
| `NETWORK_FEE` | 5,000 | VND, display only (not in invoice) |
| `TAX_RATE` | 10 | VAT percentage |

All financial values (VND amounts, tax, token amounts) are calculated frontend-side and passed through to the backend as-is — the Tax Module does not recalculate.
