import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import PrivateRoute from './components/PrivateRoute';
import Users from './pages/master/Users';
import PermissionsEditor from './pages/master/PermissionsEditor';
import Profile from './pages/master/Profile';
import Accounts from './pages/master/Accounts';
import Branches from './pages/master/Branches';
import PracticeType from './pages/config/PracticeType';
import Specialty from './pages/config/Specialty';
import Appointments from './pages/clinical/Appointments';
import Notes from './pages/clinical/Notes';
import ClinicalForms from './pages/clinical/ClinicalForms';
import Investigation from './pages/clinical/Investigation';
import Billing from './pages/financial/Billing';
import Accounting from './pages/financial/Accounting';
import Inventory from './pages/operational/Inventory';
import Ward from './pages/clinical/Ward';
import OutpatientReport from './pages/reports/OutpatientReport';
import ChangePlan from './pages/subscription/ChangePlan';
import UserPlan from './pages/subscription/UserPlan';
import Growth from './pages/subscription/Growth';
import ICD10 from './pages/config/ICD10';
import NoteSetup from './pages/config/NoteSetup';
import DailyVisits from './pages/reports/DailyVisits';
import DiagnosisTrend from './pages/reports/DiagnosisTrend';
import PatientList from './pages/master/PatientList';
import PatientDetails from './pages/master/PatientDetails';
import OutcomeReport from './pages/reports/OutcomeReport';
import ServiceUtilization from './pages/reports/ServiceUtilization';
import InvestigationSetup from './pages/config/InvestigationSetup';
import PharmacySetup from './pages/config/PharmacySetup';
import MedicineConfig from './pages/config/MedicineConfig';
import DrugCatalog from './pages/config/DrugCatalog';
import ProcedureMaster from './pages/config/ProcedureMaster';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          
          {/* Master Setup */}
          <Route path="/master/users" element={<PrivateRoute><Users /></PrivateRoute>} />
          <Route path="/master/permissions" element={<PrivateRoute><PermissionsEditor /></PrivateRoute>} />
          <Route path="/master/accounts" element={<PrivateRoute><Accounts /></PrivateRoute>} />
          <Route path="/master/branches" element={<PrivateRoute><Branches /></PrivateRoute>} />
          <Route path="/master/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          
          {/* Clinical Ops */}
          <Route path="/appointments" element={<PrivateRoute><Appointments /></PrivateRoute>} />
          <Route path="/notes" element={<PrivateRoute><Notes /></PrivateRoute>} />
          <Route path="/clinical-forms" element={<PrivateRoute><ClinicalForms /></PrivateRoute>} />
          <Route path="/investigation" element={<PrivateRoute><Investigation /></PrivateRoute>} />
          <Route path="/ward" element={<PrivateRoute><Ward /></PrivateRoute>} />
          
          {/* Configuration */}
          <Route path="/config/practice" element={<PrivateRoute><PracticeType /></PrivateRoute>} />
          <Route path="/config/specialty" element={<PrivateRoute><Specialty /></PrivateRoute>} />
          <Route path="/config/notes" element={<PrivateRoute><NoteSetup /></PrivateRoute>} />
          <Route path="/config/icd10" element={<PrivateRoute><ICD10 /></PrivateRoute>} />
          <Route path="/config/investigations" element={<PrivateRoute><InvestigationSetup /></PrivateRoute>} />
          <Route path="/config/pharmacy" element={<PrivateRoute><PharmacySetup /></PrivateRoute>} />
          <Route path="/config/medicine" element={<PrivateRoute><MedicineConfig /></PrivateRoute>} />
          <Route path="/config/catalog" element={<PrivateRoute><DrugCatalog /></PrivateRoute>} />
          <Route path="/config/procedures" element={<PrivateRoute><ProcedureMaster /></PrivateRoute>} />
          
          {/* Subscription */}
          <Route path="/subscription/change" element={<PrivateRoute><ChangePlan /></PrivateRoute>} />
          <Route path="/subscription/user-plan" element={<PrivateRoute><UserPlan /></PrivateRoute>} />
          <Route path="/subscription/growth" element={<PrivateRoute><Growth /></PrivateRoute>} />
          
          {/* Billing & Pharmacy */}
          <Route path="/billing" element={<PrivateRoute><Billing /></PrivateRoute>} />
          <Route path="/accounting" element={<PrivateRoute><Accounting /></PrivateRoute>} />
          <Route path="/pharmacy" element={<PrivateRoute><Inventory /></PrivateRoute>} />
          
          {/* Reports */}
          <Route path="/reports/outpatient" element={<PrivateRoute><OutpatientReport /></PrivateRoute>} />
          <Route path="/reports/daily" element={<PrivateRoute><DailyVisits /></PrivateRoute>} />
          <Route path="/reports/diagnosis" element={<PrivateRoute><DiagnosisTrend /></PrivateRoute>} />
          <Route path="/reports/outcomes" element={<PrivateRoute><OutcomeReport /></PrivateRoute>} />
          <Route path="/reports/utilization" element={<PrivateRoute><ServiceUtilization /></PrivateRoute>} />

          {/* New Master Setup */}
          <Route path="/master/patients" element={<PrivateRoute><PatientList /></PrivateRoute>} />
          <Route path="/master/patients/:id" element={<PrivateRoute><PatientDetails /></PrivateRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
