# HURE Care Technical Reference

## System Architecture
HURE Care is built as a centralized EMR & Clinic Management Platform.
- **Frontend**: React (Vite), TailwindCSS, Framer Motion.
- **Backend**: Firebase Firestore, Firebase Auth, Firebase Storage.

## Public Marketing gateway
- **Route**: `/` (`LandingPage.jsx`)
- **CMS**: Managed by `siteContentService.js` (Firestore `site_content/landing_page`).
- **Signup**: Multi-step flow in `/signup` (`Signup.jsx`). Pre-selects plan via `?plan=...`.

## Facility Lifecycle & Verification
1. **Signup**: Creates facility in `facilities` collection.
2. **Trial**: 10-day trial activated on creation (`status: 'trial'`, `subscription.expiryDate`).
3. **Verification**: Facility owner must submit licensing documents (`verificationStatus: 'pending' -> 'submitted' -> 'verified'`).
4. **Restrictions**: If trial expires AND `verificationStatus !== 'verified'`, writing actions (adding patients, generating invoices) are restricted.

## Core Services
- `authService.js`: User authentication & role-based session management.
- `facilityService.js`: Facility profiling, verification, and subscription tracking.
- `siteContentService.js`: Dynamic content management for the marketing site.
- `patientService.js`: EMR patient records & registry.
- `billingService.js`: Financial invoice generation & payment tracking.

## Database Schema (Firestore)
- `users`: `{ uid, email, role, facilityId, ... }`
- `facilities`: `{ name, status, verificationStatus, subscription: { planId, expiryDate }, ... }`
- `site_content`: `{ landing_page: { heroTitle, pricingTitle, ... } }`
- `patients`: `{ name, facilityId, patientId, ... }`
- `billing`: `{ invoiceNo, amount, status, facilityId, ... }`

## Role-Based Access
- `superadmin`: Platform governance, site content management, organization oversight.
- `clinic_owner`: Facility management, verification submission, standard clinical workflows.
- `doctor / nurse / receptionist`: Operation-specific access within a facility.
