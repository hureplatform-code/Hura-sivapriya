import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { ToastProvider } from './contexts/ToastContext';
import { ConfirmProvider } from './contexts/ConfirmContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import SetupSuperadmin from './pages/SetupSuperadmin';
import Dashboard from './pages/Dashboard';
import PrivateRoute from './components/PrivateRoute';
import Users from './pages/master/Users';
import PermissionsEditor from './pages/master/PermissionsEditor';
import Profile from './pages/master/Profile';
import Subscriptions from './pages/superadmin/Subscriptions';
import GlobalAudit from './pages/superadmin/GlobalAudit';
import SystemCodes from './pages/superadmin/SystemCodes';
import PlatformSettings from './pages/superadmin/PlatformSettings';
import Reports from './pages/master/Reports';
import OutpatientReport from './pages/reports/OutpatientReport';
import OutcomeReport from './pages/reports/OutcomeReport';
import InventoryReport from './pages/reports/InventoryReport';
import Accounts from './pages/master/Accounts';
import Branches from './pages/master/Branches';
import PracticeType from './pages/config/PracticeType';
import Specialty from './pages/config/Specialty';
import Appointments from './pages/clinical/Appointments';
import Notes from './pages/clinical/Notes';
import ClinicalForms from './pages/clinical/ClinicalForms';
import NursingQueue from './pages/clinical/NursingQueue';
import Investigation from './pages/clinical/Investigation';
import Billing from './pages/financial/Billing';
import BillingQueue from './pages/financial/BillingQueue';
import Accounting from './pages/financial/Accounting';
import Expenses from './pages/financial/Expenses';
import Inventory from './pages/operational/Inventory';
import PharmacyQueue from './pages/operational/PharmacyQueue';
import LaboratoryQueue from './pages/operational/LaboratoryQueue';
import Ward from './pages/clinical/Ward';
import InpatientChart from './pages/clinical/InpatientChart';
import ChangePlan from './pages/subscription/ChangePlan';
import UserPlan from './pages/subscription/UserPlan';
import Growth from './pages/subscription/Growth';
import ICD10 from './pages/config/ICD10';
import NoteSetup from './pages/config/NoteSetup';
import DailyVisits from './pages/reports/DailyVisits';
import DiagnosisTrend from './pages/reports/DiagnosisTrend';
import PatientList from './pages/master/PatientList';
import PatientDetails from './pages/master/PatientDetails';
import ServiceUtilization from './pages/reports/ServiceUtilization';
import InvestigationSetup from './pages/config/InvestigationSetup';
import PharmacySetup from './pages/config/PharmacySetup';
import MedicineConfig from './pages/config/MedicineConfig';
import DrugCatalog from './pages/config/DrugCatalog';
import SmsSettings from './pages/config/SmsSettings';
import SmsLogs from './pages/config/SmsLogs';
import ProcedureMaster from './pages/config/ProcedureMaster';
import AdoptionReport from './pages/reports/AdoptionReport';
import ResourceUsageReport from './pages/reports/ResourceUsageReport';
import InsuranceAgingReport from './pages/reports/InsuranceAgingReport';
import DailyCashflowReport from './pages/reports/DailyCashflowReport';
import WaitlistTV from './pages/clinical/WaitlistTV';
import PatientIntake from './pages/public/PatientIntake';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <ToastProvider>
          <ConfirmProvider>
            <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          {/* Temporary Setup Route */}
          <Route path="/setup-superadmin" element={<SetupSuperadmin />} />
          <Route path="/intake" element={<PatientIntake />} />
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          
          {/* Master Setup */}
          <Route path="/master/users" element={<PrivateRoute><Users /></PrivateRoute>} />
          <Route path="/master/permissions" element={<PrivateRoute><PermissionsEditor /></PrivateRoute>} />
          <Route path="/master/accounts" element={<PrivateRoute><Accounts /></PrivateRoute>} />
          <Route path="/master/branches" element={<PrivateRoute><Branches /></PrivateRoute>} />
          <Route path="/master/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          
          {/* Superadmin Routes */}
          <Route path="/superadmin/subscriptions" element={<PrivateRoute><Subscriptions /></PrivateRoute>} />
          <Route path="/superadmin/audit" element={<PrivateRoute><GlobalAudit /></PrivateRoute>} />
          <Route path="/superadmin/codes" element={<PrivateRoute><SystemCodes /></PrivateRoute>} />
          <Route path="/superadmin/settings" element={<PrivateRoute><PlatformSettings /></PrivateRoute>} />
          <Route path="/master/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
          <Route path="/reports/outpatient" element={<PrivateRoute><OutpatientReport /></PrivateRoute>} />
          <Route path="/reports/outcome" element={<PrivateRoute><OutcomeReport /></PrivateRoute>} />
          <Route path="/reports/inventory" element={<PrivateRoute><InventoryReport /></PrivateRoute>} />
          <Route path="/reports/adoption" element={<PrivateRoute><AdoptionReport /></PrivateRoute>} />
          <Route path="/reports/usage" element={<PrivateRoute><ResourceUsageReport /></PrivateRoute>} />
          <Route path="/reports/insurance-aging" element={<PrivateRoute><InsuranceAgingReport /></PrivateRoute>} />
          <Route path="/reports/daily-cashflow" element={<PrivateRoute><DailyCashflowReport /></PrivateRoute>} />

          {/* Clinical Ops */}
          <Route path="/appointments" element={<PrivateRoute><Appointments /></PrivateRoute>} />
          <Route path="/notes" element={<PrivateRoute><Notes /></PrivateRoute>} />
          <Route path="/nursing/queue" element={<PrivateRoute><NursingQueue /></PrivateRoute>} />
          <Route path="/clinical-forms" element={<PrivateRoute><ClinicalForms /></PrivateRoute>} />
          <Route path="/investigation" element={<PrivateRoute><Investigation /></PrivateRoute>} />
          <Route path="/lab/queue" element={<PrivateRoute><LaboratoryQueue /></PrivateRoute>} />
          <Route path="/ward" element={<PrivateRoute><Ward /></PrivateRoute>} />
          <Route path="/ward/chart/:wardId/:bedId" element={<PrivateRoute><InpatientChart /></PrivateRoute>} />
          <Route path="/waitlist-tv" element={<WaitlistTV />} />
          
          {/* Configuration */}
          <Route path="/config/practice" element={<PrivateRoute><PracticeType /></PrivateRoute>} />
          <Route path="/config/specialty" element={<PrivateRoute><Specialty /></PrivateRoute>} />
          <Route path="/config/notes" element={<PrivateRoute><NoteSetup /></PrivateRoute>} />
          <Route path="/config/icd10" element={<PrivateRoute><ICD10 /></PrivateRoute>} />
          <Route path="/config/investigations" element={<PrivateRoute><InvestigationSetup /></PrivateRoute>} />
          <Route path="/config/pharmacy" element={<PrivateRoute><PharmacySetup /></PrivateRoute>} />
          <Route path="/config/medicine" element={<PrivateRoute><MedicineConfig /></PrivateRoute>} />
          <Route path="/config/catalog" element={<PrivateRoute><DrugCatalog /></PrivateRoute>} />
          <Route path="/config/sms" element={<PrivateRoute><SmsSettings /></PrivateRoute>} />
          <Route path="/config/sms-logs" element={<PrivateRoute><SmsLogs /></PrivateRoute>} />
          <Route path="/config/procedures" element={<PrivateRoute><ProcedureMaster /></PrivateRoute>} />
          
          {/* Subscription */}
          <Route path="/subscription/change" element={<PrivateRoute><ChangePlan /></PrivateRoute>} />
          <Route path="/subscription/user-plan" element={<PrivateRoute><UserPlan /></PrivateRoute>} />
          <Route path="/subscription/growth" element={<PrivateRoute><Growth /></PrivateRoute>} />
          
          {/* Billing & Pharmacy */}
          <Route path="/billing" element={<PrivateRoute><Billing /></PrivateRoute>} />
          <Route path="/billing/queue" element={<PrivateRoute><BillingQueue /></PrivateRoute>} />
          <Route path="/accounting" element={<PrivateRoute><Accounting /></PrivateRoute>} />
          <Route path="/expenses" element={<PrivateRoute><Expenses /></PrivateRoute>} />
          <Route path="/pharmacy/inventory" element={<PrivateRoute><Inventory /></PrivateRoute>} />
          <Route path="/pharmacy/queue" element={<PrivateRoute><PharmacyQueue /></PrivateRoute>} />
          
          {/* Reports */}
          <Route path="/reports/daily" element={<PrivateRoute><DailyVisits /></PrivateRoute>} />
          <Route path="/reports/diagnosis" element={<PrivateRoute><DiagnosisTrend /></PrivateRoute>} />
          <Route path="/reports/utilization" element={<PrivateRoute><ServiceUtilization /></PrivateRoute>} />

          {/* New Master Setup */}
          <Route path="/master/patients" element={<PrivateRoute><PatientList /></PrivateRoute>} />
          <Route path="/master/patients/:id" element={<PrivateRoute><PatientDetails /></PrivateRoute>} />
        </Routes>
            </Router>
          </ConfirmProvider>
        </ToastProvider>
      </CurrencyProvider>
    </AuthProvider>
  );
}

export default App;
