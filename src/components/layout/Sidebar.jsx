import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  ClipboardList, 
  Stethoscope, 
  Settings, 
  LogOut,
  ChevronRight,
  ChevronDown,
  CloudCog,
  ShieldCheck,
  Store,
  CreditCard,
  FileBarChart,
  UserPlus,
  Building2,
  ListRestart
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { APP_CONFIG } from '../../config';

const menuItems = [
  { 
    id: 'dashboard',
    icon: LayoutDashboard, 
    label: 'Dashboard', 
    path: '/',
    roles: ['superadmin', 'doctor', 'clinic_owner', 'nurse', 'receptionist', 'pharmacist']
  },

  {
    id: 'master-setup',
    icon: Settings,
    label: 'Master Setup',
    roles: ['superadmin', 'clinic_owner'],
    subItems: [
      { label: 'Facility Profile', path: '/master/profile' },
      { label: 'Patient Registry', path: '/master/patients' },
      { label: 'Users & Staff', path: '/master/users' },
      { label: 'Security Matrix', path: '/master/permissions' },
      { label: 'Branch Management', path: '/master/branches' },
    ]
  },
  {
    id: 'facility-config',
    icon: ShieldCheck,
    label: 'Facility Config',
    roles: ['superadmin', 'clinic_owner'],
    subItems: [
      { label: 'Practice Type', path: '/config/practice' },
      { label: 'Specialty', path: '/config/specialty' },
      { label: 'Clinical Note Setup', path: '/config/notes' },
      { label: 'Medicine Config', path: '/config/medicine' },
      { label: 'Procedure Master', path: '/config/procedures' },
      { label: 'Pharmacy Setup', path: '/config/pharmacy' },
    ]
  },
  {
    id: 'clinical',
    icon: Stethoscope,
    label: 'Clinical Ops',
    roles: ['superadmin', 'doctor', 'clinic_owner', 'nurse', 'receptionist'],
    subItems: [
      { label: 'Appointments', path: '/appointments' },
      { label: 'Clinical Notes', path: '/notes' },
      { label: 'Clinical Forms', path: '/clinical-forms' },
      { label: 'Investigation', path: '/investigation' },
      { label: 'Ward / In-Patient', path: '/ward' },
    ]
  },
  {
    id: 'pharmacy',
    icon: Store,
    label: 'Pharmacy & Store',
    path: '/pharmacy',
    roles: ['superadmin', 'clinic_owner', 'pharmacist']
  },
  {
    id: 'financial',
    icon: CreditCard,
    label: 'Financials',
    roles: ['superadmin', 'clinic_owner'],
    subItems: [
      { label: 'Billing / Invoices', path: '/billing' },
      { label: 'General Ledger', path: '/accounting' },
    ]
  },
  {
    id: 'subscriptions',
    icon: CreditCard,
    label: 'Subscriptions',
    path: '/superadmin/subscriptions',
    roles: ['superadmin']
  },
  {
    id: 'reports',
    icon: FileBarChart,
    label: 'Reports',
    roles: ['superadmin', 'clinic_owner'],
    subItems: [
      { label: 'Out Patient Report', path: '/reports/outpatient' },
      { label: 'Daily Visits', path: '/reports/daily' },
      { label: 'Diagnosis Trend', path: '/reports/diagnosis' },
      { label: 'Consultant Outcomes', path: '/reports/outcomes' },
      { label: 'Service Utilization', path: '/reports/utilization' },
    ]
  },
  {
    id: 'subscription',
    icon: CreditCard,
    label: 'Subscription',
    path: '/master/accounts',
    roles: ['clinic_owner']
  }
];

export default function Sidebar() {
  const { userData, logout } = useAuth();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState({});

  const toggleExpand = (id) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Determine role. Do NOT default to 'doctor' silently.
  const role = userData?.role;

  // If user is logged in (currentUser exists) but userData/role is missing, 
  // waiting for AuthContext or data is corrupted.
  if (!role && userData === null) {
      // Data is loaded but null -> Profile missing
      return (
        <aside className="w-72 bg-white h-screen border-r border-slate-100 p-8 flex flex-col items-center justify-center text-center">
            <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-4">
                <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-black text-slate-900">Profile Missing</h3>
            <p className="text-xs text-slate-500 mt-2">
                Your account exists but has no role assigned. Please contact support or re-create your account.
            </p>
             <button 
                onClick={logout}
                className="mt-6 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-lg transition-colors"
            >
                Log Out
            </button>
        </aside>
      );
  }
  
  if (!role) return null; // Still loading or something else
  const [facilityProfile, setFacilityProfile] = useState(null);

  React.useEffect(() => {
    if (userData?.facilityId) {
       import('../../services/facilityService').then(m => {
          m.default.getProfile(userData.facilityId).then(p => {
            if (p) setFacilityProfile(p);
          });
       });
    }
  }, [userData?.facilityId]);

  const filteredMenuItems = menuItems.filter(item => 
    !item.roles || item.roles.includes(role)
  );

  return (
    <aside className="w-72 bg-white h-screen border-r border-slate-100 flex flex-col fixed left-0 top-0 z-20 overflow-y-auto scrollbar-hide">
      <div className="p-8 flex items-center gap-3 sticky top-0 bg-white z-10">
        <div className="h-10 w-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-100 overflow-hidden">
          {facilityProfile?.logoUrl ? (
            <img src={facilityProfile.logoUrl} alt="Logo" className="h-full w-full object-cover" />
          ) : (
            <Stethoscope className="text-white h-6 w-6" />
          )}
        </div>
        <span className="font-bold text-xl tracking-tight text-slate-900">{facilityProfile?.name || APP_CONFIG.HOSPITAL_NAME}</span>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-2">
        {filteredMenuItems.map((item) => {
          const isExpanded = expandedItems[item.id];
          const hasSubItems = item.subItems && item.subItems.length > 0;
          const isActive = item.path === location.pathname || 
                          (hasSubItems && item.subItems.some(sub => sub.path === location.pathname));

          return (
            <div key={item.id} className="space-y-1">
              {hasSubItems ? (
                <button
                  onClick={() => toggleExpand(item.id)}
                  className={`
                    w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-200 group
                    ${isActive ? 'bg-primary-50 text-primary-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
                  `}
                >
                  <div className="flex items-center gap-4">
                    <item.icon className={`h-5 w-5 ${isActive ? 'text-primary-600' : 'text-slate-400 group-hover:text-slate-900'}`} />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
              ) : (
                <NavLink
                  to={item.path}
                  className={({ isActive }) => `
                    flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 group
                    ${isActive 
                      ? 'bg-primary-50 text-primary-600 font-semibold shadow-sm shadow-primary-50/50' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
                  `}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              )}

              <AnimatePresence>
                {hasSubItems && isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden pl-12 space-y-1"
                  >
                    {item.subItems.filter(sub => !sub.roles || sub.roles.includes(role)).map((sub) => (
                      <NavLink
                        key={sub.path}
                        to={sub.path}
                        className={({ isActive }) => `
                          block px-4 py-2 text-sm rounded-xl transition-all
                          ${isActive 
                            ? 'text-primary-600 font-bold' 
                            : 'text-slate-400 hover:text-slate-900 hover:translate-x-1'}
                        `}
                      >
                        {sub.label}
                      </NavLink>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      <div className="p-4 mt-auto sticky bottom-0 bg-white">
        <div className="bg-slate-50 rounded-3xl p-4 border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 font-bold shadow-inner">
              {userData?.name?.split(' ').map(n => n[0]).join('') || 'JD'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate text-slate-900">{userData?.name || 'Jon Day'}</p>
              <p className="text-xs text-slate-500 truncate capitalize">{role}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all duration-200 text-sm font-bold border border-transparent hover:border-red-100"
          >
            <LogOut className="h-4 w-4" />
            Logout Session
          </button>
        </div>
      </div>
    </aside>
  );
}
