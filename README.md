# MediTrack Pro — Smart Pharma Audit, Expiry Tracking & Intelligent Inventory Automation

MediTrack Pro is a full-stack, enterprise-grade pharmacy management system designed to help retail and hospital pharmacies manage medicine inventory, batch-level consignments, perishability tracking, mathematical demand forecasting, regulatory audit logs, and automated procurement workflows in a unified platform. Built with a dual-role architecture for Administrators and Licensed Pharmacists.

> 📖 **Looking for comprehensive technical and feature documentation?**  
> Check out the [Comprehensive Feature Specification & System Documentation](FEATURE_README.md), containing mathematical formulations (Croston-SBA forecasting, FEFO allocation, patient expiry risk calculations), complete REST API matrices, database ER diagrams, and end-to-end workflow lifecycles.

---

## 🌟 Key Features Overview

### Role-Based Access Control (RBAC) & Segregated Duties
* **Admin Role:**
  - Executive Dashboard with real-time KPI metrics and financial/dispensing analytics.
  - Complete Medicine Master Catalog CRUD and batch consignment provisioning.
  - Inventory reconciliation and physical stock adjustment with mandatory audit reasons.
  - **Smart Insights:** AI/Statistical Demand Forecasting powered by Croston's Method with Syntetos-Boylan Approximation (SBA) across 6+ months of historical data.
  - **Auto Reorder Engine:** Automated evaluation of stock levels vs. minimum thresholds and 30-day forecasted demand with one-click Purchase Order generation.
  - **Order Received & Inwarding:** Complete tracking of awaiting supplier orders and automated batch creation upon shipment delivery.
  - Read-only historical dispensing audit oversight (admins cannot dispense directly, enforcing separation of duties).
  - Pharmacist staff onboarding, credential management, and account activation/deactivation.
  - Regulatory-grade audit log inspector and multi-dimensional report exports.
  - System-wide expiry horizons and notification preferences.

* **Pharmacist Role:**
  - Daily Shift Dashboard with shift statistics, quick dispensing access, and urgent expiry radars.
  - Available medicine catalog search with real-time stock counts.
  - **6-Step Clinical Dispensing Workflow:**
    - Instant medicine search by brand name, generic active ingredient, strength, or dosage form.
    - Automated **First-Expired, First-Out (FEFO)** batch allocation.
    - **Patient Prescription Expiry Conflict Check:** Validates whether the allocated batch will expire before the patient finishes their treatment duration ($DaysRemaining < TreatmentDays$) and suggests safer alternative batches.
    - Multi-item checkout cart with customer and prescription reference metadata.
    - Atomic stock deduction and digital receipt generation.
  - Real-time Expiry Alerts radar prioritizing batches nearing expiration.
  - Personal dispensing history ledger with line-item inspection.

---

## 🚀 Navigation & Application Modules

### Administration Modules (`/admin/*`)
1. **Dashboard** (`/admin/dashboard`): Real-time KPI summary, monthly dispensing trends, dosage form shares, and live audit feeds.
2. **Medicines** (`/admin/medicines`): Catalog management, live stock counters, and multi-field search.
3. **Medicine Details** (`/admin/medicines/:id`): Deep-dive into active batches, usable vs. expired quantities, and product history.
4. **Batches** (`/admin/batches`): Consignment tracking with supplier, mfg date, expiry date, days left, and perishability badges.
5. **Inventory** (`/admin/inventory`): Central stock registry with manual add/deduct adjustment modals and reason logging.
6. **Dispensing** (`/admin/dispensing`): Full historical audit of all pharmacy dispensing transactions.
7. **Expiry Tracking** (`/admin/expiry`): Perishability radar categorizing stock into Safe, Near Expiry, Critical, and Expired.
8. **Pharmacists** (`/admin/pharmacists`): Staff administration and account status management.
9. **Audit Logs** (`/admin/audit-logs`): Regulatory-grade system action ledger with multi-parameter filtering.
10. **Reports** (`/admin/reports`): On-demand generator for Inventory, Expiry, Dispensing, Audit, and Low Stock reports.
11. **Smart Insights** (`/admin/insights`): Demand forecasting engine implementing Croston's Method with SBA and WAPE accuracy metrics.
12. **Auto Reorder** (`/admin/reorder`): Automated purchase order generator with Suggested Reorder Quantity (ROQ) calculations.
13. **Order Received** (`/admin/order-received`): Supplier shipment intake with automated batch creation and stock replenishment.
14. **Settings** (`/admin/settings`): Profile, security, configurable expiry threshold days, and notification toggles.

### Pharmacy Modules (`/pharmacist/*`)
1. **Dashboard** (`/pharmacist/dashboard`): Operational shift metrics, urgent expiry alerts, and dispensing launchpad.
2. **Medicines** (`/pharmacist/medicines`): Fast lookup of ready-to-dispense drugs with live stock counts.
3. **Dispense Medicine** (`/pharmacist/dispense`): 6-step guided dispensing with FEFO batch selection, dosage safety checks, cart review, and digital receipts.
4. **Expiry Alerts** (`/pharmacist/expiry-alerts`): Dedicated radar displaying near-expiry and critical batches.
5. **Dispensing History** (`/pharmacist/history`): Personal dispensing ledger with line-item inspection modals.

---

## 💻 Tech Stack

### Frontend Architecture
- **Framework:** React 18 with Vite
- **Styling:** Tailwind CSS with custom healthcare color palette
- **Data Visualization:** Recharts (AreaChart, BarChart, PieChart)
- **Icons:** Lucide React
- **State & Routing:** React Router v6, Context API (AuthContext, ToastContext)

### Backend Architecture
- **Runtime & Framework:** Java 21, Spring Boot 3.3.0
- **Web Layer:** Spring Web MVC with RESTful endpoints
- **Persistence:** Spring Data JPA with Hibernate ORM
- **Database:** MySQL Server 8.0+
- **Validation & Security:** Jakarta Bean Validation, Role-Based Route Guards

---

## 📂 Project Directory Structure

```text
meditrack_pro-smart_pharma/
├── backend/
│   ├── src/main/java/com/pharmacy/meditrack/
│   │   ├── config/            # WebConfig, DataSeeder
│   │   ├── controller/        # REST Controllers (Auth, Medicine, Batch, Dispensing, Reorder, Audit, User)
│   │   ├── dto/               # Request & Response Data Transfer Objects
│   │   ├── entity/            # JPA Entities (Medicine, Batch, DispensingTransaction, ReorderOrder, etc.)
│   │   ├── enums/             # MedicineStatus, UserRole, UserStatus
│   │   ├── exception/         # Global Exception Handlers
│   │   ├── repository/        # Spring Data Repositories
│   │   └── service/           # Business Logic Services & Initializers
│   ├── src/main/resources/    # application.properties
│   └── pom.xml                # Maven Dependencies
├── frontend/
│   ├── src/
│   │   ├── components/        # Reusable UI widgets, Cards, Modals, Tables, Layouts
│   │   ├── context/           # AuthContext, ToastContext
│   │   ├── data/              # Mock catalog & historical transaction sets
│   │   ├── layouts/           # DashboardLayout with dynamic Sidebar
│   │   ├── pages/
│   │   │   ├── admin/         # 14 Admin management & intelligence pages
│   │   │   ├── auth/          # Login page
│   │   │   ├── pharmacist/    # 5 Clinical dispensing & history pages
│   │   │   └── shared/        # Unauthorized, NotFound pages
│   │   ├── routes/            # AdminRoute & PharmacistRoute guards
│   │   ├── services/          # Axios / Fetch API service adapters
│   │   └── utils/             # Croston-SBA forecasting engine & date/perishability helpers
│   ├── package.json
│   └── vite.config.js
├── FEATURE_README.md          # Comprehensive Master Feature Guide & Specification
└── README.md                  # Project Overview & Quickstart Guide
```

---

## 🔑 Demo Login Credentials

The application seeds two pre-configured user accounts on initial startup:

| Role | Email | Password | Primary Functions |
| :--- | :--- | :--- | :--- |
| **Pharmacy Administrator** | `admin@meditrack.com` | `admin123` | System management, POs, Forecasting, Audits |
| **Licensed Pharmacist** | `pharmacist@meditrack.com` | `pharma123` | Clinical dispensing, FEFO allocation, Expiry alerts |

---

## 🛠️ How to Run Locally

### 1. Database Setup
Ensure MySQL is running, then create the database:
```sql
CREATE DATABASE meditrack CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```
Verify database credentials in `backend/src/main/resources/application.properties` (default: username `root`, password `root`, port `3306`).

### 2. Run Backend (Spring Boot)
```bash
cd backend
mvn clean install -DskipTests
mvn spring-boot:run
```
*Backend runs at `http://localhost:8081`.*

### 3. Run Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs at `http://localhost:5173`.*

---

## 📚 Complete Feature Specification

For detailed mathematical formulas, step-by-step workflow diagrams, REST endpoint schemas, and technical implementation notes, please see:  
👉 **[FEATURE_README.md](FEATURE_README.md)**
