# HURA Care - End-to-End Application Flow & Test Cases

This document describes the complete lifecycle of a clinic operating within the HURA Care SaaS platform. It serves as both an understanding of the application flow and a comprehensive test suite.

---

## 🏗️ Phase 1: Platform Setup & Governance (Superadmin Flow)
**Objective:** The Superadmin sets up the platform infrastructure, approves clinics, and manages overarching subscriptions.

### Test Case 1.1: Superadmin Login & Dashboard Access
- **Action:** Navigate to the login page and authenticate using Superadmin credentials.
- **Expected Result:** Redirects to the Platform Dashboard `/` showing global metrics (Total Clinics, Platform Revenue).
- **Security Check:** Attempt to navigate to operational routes (`/patients`, `/billing`, `/notes`). It should block access and show the `Clinical Governance Notice`.

### Test Case 1.2: Manage Organization Subscriptions
- **Action:** Go to **Subscriptions**. Locate a registered facility.
- **Expected Result:** You should see a list of all clinics and their current plans.
- **Action:** Click "Process" on a pending upgrade or edit a client's plan, setting limitations (e.g., Staff limit: 30, Location limit: 2).
- **Expected Result:** Plan applies immediately. A green professional toast confirms the success.

---

## ⚕️ Phase 2: Clinic Onboarding (Clinic Owner Flow)
**Objective:** A doctor or medical group owner signs up, creates their branches, and invites their operational staff.

### Test Case 2.1: Clinic Owner Configuration & Branch Limits
- **Action:** Login as a user with the `clinic_owner` role.
- **Action:** Navigate to **Settings/Master > Branches**.
- **Expected Result:** You should see a list of physical locations for your clinic.
- **Test:** Try to add more branches than what the Superadmin set in your subscription.
- **Expected Result:** System throws a warning toast: "Your current plan limits you to X locations" and prevents creation.

### Test Case 2.2: Staff Management & Granular Permissions
- **Action:** Navigate to **Settings/Master > Users**.
- **Action:** Create a new Staff member (e.g., "Nurse Joy").
- **Action:** Open the **Security Matrix** (Permissions) for the new user.
- **Test:** Disable the "Financial" module, but enable the "Clinical Notes" and "Appointments" modules. Save the matrix.
- **Expected Result:** A success toast confirms saving. When "Nurse Joy" logs in, the Finance/Billing tabs should be completely hidden/inaccessible.

### Test Case 2.3: SMS Wallet & Reminders Setup
- **Action:** Navigate to **Config > SMS Preferences**.
- **Action:** Purchase an SMS bundle to top-up the wallet.
- **Expected Result:** The clinic's SMS balance increases.
- **Note:** The backend Firebase Cloud function is now armed to send automated reminders as long as the balance is > 0.

---

## 🏥 Phase 3: The Patient Journey (Reception & Triage Flow)
**Objective:** A patient walks in or calls to book an appointment, arrives at the clinic, and has their initial vitals recorded.

### Test Case 3.1: Patient Registration
- **Action:** Login as a Receptionist/Admin.
- **Action:** Navigate to **Master > Patients**. Click **Add Patient**.
- **Test:** Rapidly double-click the "Save Patient" button.
- **Expected Result:** The button enters a loading state, preventing duplicate records. A professional success toast appears.

### Test Case 3.2: Appointment Booking & SMS Trigger
- **Action:** Navigate to **Clinical > Appointments**.
- **Action:** Click **New Booking**, select the newly created patient, assign to a doctor, and pick a future time.
- **Expected Result:** Appointment appears on the calendar.
- **Backend Check:** Firebase triggers the "Booking Confirmed" SMS to the patient's phone.

### Test Case 3.3: Managing the Queue & Vitals (Triage)
- **Action:** When the patient arrives, locate their appointment and click **Triage**.
- **Action:** Enter vitals (Blood Pressure, Temp, Weight) and save.
- **Expected Result:** Appointment status transitions to `Triage / Pending Doctor`. A success toast confirms the action. Vitals are permanently recorded in the patient's medical history.

---

## 🩺 Phase 4: Medical Administration (Doctor Flow)
**Objective:** The doctor conducts the actual consultation, prescribes medication, writes clinical notes, and discharges the patient.

### Test Case 4.1: Initiating Consultation
- **Action:** Login as the Doctor. Navigate to **Appointments**.
- **Action:** Find the triaged patient and click **Start Session**.
- **Expected Result:** The status changes to `In-Session` and the app automatically routes the doctor to `/notes`.

### Test Case 4.2: Writing Clinical Notes (SOAP)
- **Action:** In the Notes interface, write out the subjective/objective observations.
- **Expected Result:** The notes securely save to the patient's chart.

### Test Case 4.3: Requesting Investigations (Labs/Images)
- **Action:** Navigate to **Clinical > Investigations**.
- **Action:** Create a new Lab/Radiology request for the patient.
- **Expected Result:** The request is entered into the queue. Once the lab tech completes it, the results map directly to this consultation.

---

## 🛏️ Phase 5: Inpatient & Admissions (Ward Flow)
**Objective:** If the patient requires extended observation, they are admitted to a ward bed.

### Test Case 5.1: Ward Management & Bed Allocation
- **Action:** Navigate to **Master > Wards**. Ensure a ward (e.g., "ICU") and beds exist.
- **Action:** Navigate to **Clinical > Inpatient & IPD**.
- **Action:** Admit a patient to a specific bed.
- **Expected Result:** The patient is visually represented in the IPD tracker.

### Test Case 5.2: Inpatient Charting & Vitals Tracking
- **Action:** Open the admitted patient's **Inpatient Chart**.
- **Action:** Add daily nurses' notes and periodic vitals checks.
- **Expected Result:** The chart aggregates a timeline of the patient's stay until discharge.

---

## 💵 Phase 6: Cashier & Billing (Finance Flow)
**Objective:** The patient's journey concludes at the cashier, where all services are billed.

### Test Case 6.1: Generating an Invoice
- **Action:** Login as Receptionist/Biller.
- **Action:** Navigate to **Financial Hub > Billing**.
- **Action:** Generate an invoice linked to the completed consultation or IPD stay.
- **Expected Result:** The invoice compiles all billable line items (consultation fee, pharmacy, labs).

### Test Case 6.2: Marking Invoice as Paid
- **Action:** Collect cash/card payment from the patient.
- **Action:** Locate the invoice and click **Mark as Paid**.
- **Expected Result:** Status transitions to `PAID`. Financial reporting metrics at the top of the dashboard immediately update. A success toast appears.

---

## ⚠️ Phase 7: Edge Cases & System Constraints
**Objective:** Verify stability and error handling.

1. **Delete Protection:** Try to delete a patient record or invoice. 
   - *Expected:* Placed behind a custom "Are you actually sure?" confirmation modal, rather than an ugly browser alert.
2. **Missing Permissions Attempt:** Attempt to navigate directly to `/billing` using a URL while logged in as a Clinical User who has billing disabled via the security matrix.
   - *Expected:* The system rejects the route and bounces the user back to the dashboard.
3. **Empty Searches:** Use the search bar in the patient list with a gibberish string.
   - *Expected:* A clean "No patients found" empty state rather than a broken table or crash.
