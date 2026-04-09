# Implementation Plan - Data Standardization (Kenya)

## Objective
Standardize the HURE Care platform to align with Kenyan administrative standards, specifically focusing on date formatting (DD/MM/YYYY) and terminology ("Relationship" instead of "Relation").

## 1. Date Format Standardization (DD/MM/YYYY)
We will replace generic `.toLocaleDateString()` calls with `.toLocaleDateString('en-GB')` (or `en-KE`) to force the `dd/mm/yyyy` format. We will also update date inputs and displays where hardcoded formats are present.

### Target Files:
- [ ] `src/pages/clinical/Appointments.jsx`
- [ ] `src/pages/master/PatientList.jsx`
- [ ] `src/pages/clinical/Notes.jsx`
- [ ] `src/pages/financial/Billing.jsx`
- [ ] `src/pages/financial/BillingQueue.jsx`
- [ ] `src/pages/financial/Expenses.jsx`
- [ ] `src/pages/financial/Accounting.jsx`
- [ ] `src/pages/financial/ClaimsTracker.jsx`
- [ ] `src/pages/master/PatientDetails.jsx`
- [ ] `src/components/printing/PrintTemplates.jsx`
- [ ] `src/components/modals/AppointmentModal.jsx`
- [ ] `src/components/modals/QuickPatientModal.jsx`
- [ ] `src/components/modals/TriageModal.jsx`

## 2. Terminology Correction ("Relationship")
We will ensure that all labels and placeholders for "Relation" or "nextOfKinRelation" are displayed as "Relationship".

### Target Files:
- [ ] `src/components/modals/QuickPatientModal.jsx`
- [ ] `src/pages/master/PatientDetails.jsx`
- [ ] `src/pages/public/PatientIntake.jsx`

## 3. Implementation Steps

### Step 1: Global Replace for Date Formatting
Update `.toLocaleDateString()` to `.toLocaleDateString('en-GB')` in identified files.

### Step 2: Update Specific Date Utility Functions
Correct return formats in helper functions (e.g., `getRelativeVisitTime`).

### Step 3: Terminology Sweep
Update labels and placeholders from "Relation" to "Relationship".

### Step 4: Verification
Verify all patient-facing and staff-facing dates follow the DD/MM/YYYY pattern.
