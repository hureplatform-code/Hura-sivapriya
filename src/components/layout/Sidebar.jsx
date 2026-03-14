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
  ListRestart,
  History,
  Database,
  Shield,
  MessageSquare,
  X
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
      { label: 'Facility Profile', path: '/master/profile', roles: ['clinic_owner'] },
      { label: 'Patient Registry', path: '/master/patients', roles: ['clinic_owner', 'doctor', 'nurse', 'receptionist'] },
      { label: 'Users & Staff', path: '/master/users', roles: ['superadmin', 'clinic_owner'] },
      { label: 'Security Matrix', path: '/master/permissions', roles: ['superadmin', 'clinic_owner'] },
      { label: 'Branch Management', path: '/master/branches', roles: ['clinic_owner'] },
    ]
  },
  {
    id: 'facility-config',
    icon: ShieldCheck,
    label: 'Configurations',
    roles: ['superadmin', 'clinic_owner'],
    subItems: [
      { label: 'Practice Type', path: '/config/practice', roles: ['clinic_owner'] },
      { label: 'Specialty', path: '/config/specialty', roles: ['clinic_owner'] },
      { label: 'Clinical Note Setup', path: '/config/notes', roles: ['clinic_owner'] },
      { label: 'Medicine Config', path: '/config/medicine', roles: ['superadmin', 'clinic_owner'] },
      { label: 'Drug Catalog', path: '/config/catalog', roles: ['superadmin', 'clinic_owner'] },
      { label: 'Procedure Master', path: '/config/procedures', roles: ['superadmin', 'clinic_owner'] },
      { label: 'Investigation Catalogue', path: '/config/investigations', roles: ['superadmin', 'clinic_owner'] },
      { label: 'ICD-10 Catalogue', path: '/config/icd10', roles: ['superadmin', 'clinic_owner'] },
      { label: 'Pharmacy Setup', path: '/config/pharmacy', roles: ['clinic_owner'] },
      { label: 'SMS Notifications', path: '/config/sms', roles: ['superadmin', 'clinic_owner'] },
      { label: 'Global Platform Settings', path: '/superadmin/settings', roles: ['superadmin'] },
    ]
  },
  {
    id: 'clinical',
    icon: Stethoscope,
    label: 'Clinical Ops',
    roles: ['doctor', 'clinic_owner', 'nurse', 'receptionist'],
    subItems: [
      { label: 'Appointments', path: '/appointments' },
      { label: 'Clinical Notes', path: '/notes', roles: ['doctor', 'clinic_owner', 'nurse'] },
      { label: 'Clinical Forms', path: '/clinical-forms', roles: ['doctor', 'clinic_owner', 'nurse'] },
      { label: 'Investigation', path: '/investigation', roles: ['doctor', 'clinic_owner', 'nurse', 'lab_tech'] },
      { label: 'Ward / In-Patient', path: '/ward', roles: ['doctor', 'clinic_owner', 'nurse'] },
      { label: 'Waitlist TV', path: '/waitlist-tv', roles: ['doctor', 'nurse', 'receptionist', 'clinic_owner', 'admin'] },
    ]
  },
  {
    id: 'pharmacy',
    icon: Store,
    label: 'Pharmacy & Store',
    path: '/pharmacy',
    roles: ['clinic_owner', 'pharmacist']
  },
  {
    id: 'financial',
    icon: CreditCard,
    label: 'Financials',
    roles: ['superadmin', 'clinic_owner', 'admin', 'receptionist'],
    subItems: [
      { label: 'Billing / Invoices', path: '/billing', roles: ['clinic_owner', 'admin', 'receptionist'] },
      { label: 'General Ledger', path: '/accounting', roles: ['clinic_owner', 'admin'] },
      { label: 'Platform Revenue', path: '/accounting', roles: ['superadmin'] },
      { label: 'Expenses', path: '/expenses', roles: ['superadmin', 'clinic_owner', 'admin'] },
    ]
  },
  {
    id: 'subscriptions',
    icon: Building2,
    label: 'Organizations',
    path: '/superadmin/subscriptions',
    roles: ['superadmin']
  },
  {
    id: 'audit-trail',
    icon: History,
    label: 'Global Audit Logs',
    path: '/superadmin/audit',
    roles: ['superadmin']
  },
  {
    id: 'system-codes',
    icon: Database,
    label: 'System Codes',
    path: '/superadmin/codes',
    roles: ['superadmin']
  },
  {
    id: 'reports',
    icon: FileBarChart,
    label: 'Reports',
    path: '/master/reports',
    roles: ['superadmin', 'clinic_owner', 'doctor', 'nurse', 'receptionist', 'pharmacist']
  },
  {
    id: 'subscription',
    icon: CreditCard,
    label: 'Subscription',
    path: '/master/accounts',
    roles: ['clinic_owner']
  }
];

export default function Sidebar({ isOpen, onClose }) {
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
        <aside className="fixed lg:static w-72 bg-white h-screen border-r border-slate-100 p-8 flex flex-col items-center justify-center text-center z-[60]">
            <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-4">
                <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-medium text-slate-900">Profile Missing</h3>
            <p className="text-xs text-slate-500 mt-2">
                Your account exists but has no role assigned. Please contact support or re-create your account.
            </p>
             <button 
                onClick={logout}
                className="mt-6 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded-lg transition-colors"
            >
                Log Out
            </button>
        </aside>
      );
  }
  
  if (!role) return null; // Still loading or something else
  const [facilityProfile, setFacilityProfile] = useState(null);
  const [providerBalance, setProviderBalance] = useState(null);

  React.useEffect(() => {
    if (userData?.facilityId) {
       import('../../services/facilityService').then(m => {
          m.default.getProfile(userData.facilityId).then(p => {
             if (p) setFacilityProfile(p);
          });
       });
    }

    if (role === 'superadmin') {
      import('../../services/smsSettingsService').then(m => {
        m.default.getAtBalance().then(bal => {
          if (bal) setProviderBalance(bal);
        });
      });
    }
  }, [userData?.facilityId, role]);

  const filteredMenuItems = menuItems.filter(item => 
    !item.roles || item.roles.includes(role)
  );

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[50] lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={`
        w-72 bg-white h-screen border-r border-slate-100 flex flex-col fixed left-0 top-0 z-[60] overflow-y-auto scrollbar-hide transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-8 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center shadow-sm overflow-hidden">
              {facilityProfile?.logoUrl ? (
                <img src={facilityProfile.logoUrl} alt="Logo" className="h-full w-full object-cover" />
              ) : (
                <img src="/logo.png" alt="Doctor Logo" className="h-full w-full object-contain p-1" />
              )}
            </div>
            <span className="font-medium text-xl tracking-tight text-slate-900 truncate max-w-[120px]">{facilityProfile?.name || APP_CONFIG.HOSPITAL_NAME}</span>
          </div>
          <button onClick={onClose} className="lg:hidden p-2 text-slate-400 hover:text-slate-900">
            <X className="h-5 w-5" />
          </button>
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
                            ? 'text-primary-600 font-medium' 
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
            <div className="h-10 w-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 font-medium shadow-inner">
              {userData?.name?.split(' ').map(n => n[0]).join('') || 'JD'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-slate-900">{userData?.name || 'Jon Day'}</p>
              <p className="text-xs text-slate-500 truncate capitalize">{role}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all duration-200 text-sm font-medium border border-transparent hover:border-red-100"
          >
            <LogOut className="h-4 w-4" />
            Logout Session
          </button>
        </div>

        {/* Superadmin Provider Balance Health Widget */}
        {role === 'superadmin' && providerBalance && (
          <div className="mt-4 p-4 rounded-[1.5rem] bg-slate-900 text-white shadow-xl shadow-slate-200 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">AT Master Balance</span>
                <div className={`h-2 w-2 rounded-full ${providerBalance.includes('-') ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
              </div>
              <p className="text-lg font-bold tabular-nums">{providerBalance}</p>
              {providerBalance.includes('-') && (
                <p className="text-[9px] text-red-400 font-medium mt-1 leading-tight">Critical: SMS Delivery Halted. Re-charge required.</p>
              )}
            </div>
            <MessageSquare className="absolute -right-4 -bottom-4 h-16 w-16 text-white/5 rotate-12 group-hover:scale-110 transition-transform" />
          </div>
        )}
      </div>
      </aside>
    </>
  );
}
