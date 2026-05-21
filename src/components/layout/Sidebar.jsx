import React, { useState, useEffect } from 'react';
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
  X,
  PieChart,
  Activity,
  ArrowUpRight,
  TrendingUp,
  FileEdit,
  Headphones
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useConfirm } from '../../contexts/ConfirmContext';
import { motion, AnimatePresence } from 'framer-motion';
import { APP_CONFIG } from '../../config';

const getMenuItems = (role, facilityProfile) => {
  const isSuperadmin = role === 'superadmin' || role === 'platform_owner';

  return [
    {
      id: 'dashboard',
      icon: LayoutDashboard,
      label: 'Dashboard',
      path: '/dashboard',
      roles: ['superadmin', 'doctor', 'clinic_owner', 'nurse', 'receptionist', 'pharmacist', 'lab_tech', 'lab_admin', 'pharmacist_admin']
    },

    // 2. Organizations (Promoted for Superadmin)
    {
      id: 'subscriptions',
      icon: Building2,
      label: 'Organizations',
      path: '/superadmin/subscriptions',
      roles: ['superadmin']
    },

    // 3. Subscriptions & Billing (Promoted and Renamed for Superadmin)
    {
      id: 'financial',
      icon: CreditCard,
      label: isSuperadmin ? 'Subscriptions & Billing' : 'Financial Hub',
      roles: ['superadmin', 'clinic_owner', 'admin', 'receptionist', 'lab_tech'],
      subItems: [
        { label: 'Collection Queue', path: '/billing/queue', roles: ['clinic_owner', 'admin', 'receptionist', 'lab_tech'] },
        { label: 'Invoices & Records', path: '/billing', roles: ['clinic_owner', 'admin', 'receptionist', 'lab_tech'] },
        { label: 'Insurance Claims', path: '/billing/claims', roles: ['clinic_owner', 'admin', 'receptionist'] },
        { label: 'Platform Ledger', path: '/accounting', roles: ['superadmin'] },
        { label: 'Expenses & Ledger', path: '/accounting', roles: ['clinic_owner', 'admin'] },
      ]
    },

    // 4. Audit Logs (Promoted and Renamed for Superadmin)
    {
      id: 'audit-trail',
      icon: History,
      label: isSuperadmin ? 'Audit Logs' : 'Global Audit Logs',
      path: '/superadmin/audit',
      roles: ['superadmin']
    },

    // 5. Site Content (Extracted for Superadmin)
    {
      id: 'site-content',
      icon: FileEdit,
      label: 'Site Content',
      path: '/superadmin/site-content',
      roles: ['superadmin']
    },

    // 6. Settings (Extracted for Superadmin)
    {
      id: 'platform-settings',
      icon: Settings,
      label: 'Settings',
      path: '/superadmin/settings',
      roles: ['superadmin']
    },

    // --- Remaining items ---
    
    {
      id: 'patients',
      icon: Users,
      label: 'Patient Registry',
      path: '/master/patients',
      roles: ['clinic_owner', 'doctor', 'nurse', 'receptionist']
    },
    {
      id: 'master-setup',
      icon: Settings,
      label: 'Master Setup',
      roles: ['clinic_owner'], // Removed superadmin
      subItems: [
        { label: 'Facility Profile', path: '/master/profile', roles: ['clinic_owner'] },
        { label: 'Users & Staff', path: '/master/users', roles: ['clinic_owner'] },
        { label: 'Security Matrix', path: '/master/permissions', roles: ['clinic_owner'] },
        { label: 'Branch Management', path: '/master/branches', roles: ['clinic_owner'] },
      ]
    },
    {
      id: 'facility-config',
      icon: ShieldCheck,
      label: 'Configurations',
      roles: ['clinic_owner', 'lab_admin', 'pharmacist_admin'], // Hidden from superadmin as they are now top-level
      subItems: [
        { label: 'Practice Type', path: '/config/practice', roles: ['clinic_owner'] },
        { label: 'Specialty', path: '/config/specialty', roles: ['clinic_owner'] },
        { label: 'Clinical Note Setup', path: '/config/notes', roles: ['clinic_owner'] },
        { label: 'Medicine Config', path: '/config/medicine', roles: ['clinic_owner', 'pharmacist_admin'] },
        { label: 'Drug Catalog', path: '/config/catalog', roles: ['clinic_owner', 'pharmacist_admin'] },
        { label: 'Procedure Master', path: '/config/procedures', roles: ['clinic_owner'] },
        { label: 'Investigation Catalogue', path: '/config/investigations', roles: ['clinic_owner', 'lab_admin'] },
        { label: 'ICD-10 Catalogue', path: '/config/icd10', roles: ['clinic_owner'] },
        { label: 'Pharmacy Setup', path: '/config/pharmacy', roles: ['clinic_owner', 'pharmacist_admin'] },
        { label: 'SMS Notifications', path: '/config/sms', roles: ['clinic_owner'] },
      ]
    },
    {
      id: 'clinical',
      icon: Stethoscope,
      label: 'Clinical Ops',
      roles: ['doctor', 'clinic_owner', 'nurse', 'receptionist', 'lab_tech'],
      subItems: [
        { label: role === 'lab_tech' ? 'Lab Appointment' : 'Appointments', path: '/appointments' },
        { label: 'Clinical Notes', path: '/notes', roles: ['doctor', 'clinic_owner'] },
        { label: 'Nursing Orders', path: '/nursing/queue', roles: ['nurse', 'clinic_owner', 'doctor'] },
        { label: 'Clinical Forms', path: '/clinical-forms', roles: ['doctor', 'clinic_owner', 'nurse'] },
        { label: 'Laboratory Registry', path: '/lab/queue', roles: ['lab_tech', 'clinic_owner', 'doctor'] },
        { label: 'Diagnostics & Labs', path: '/investigation', roles: ['doctor', 'clinic_owner', 'nurse'] },
        { label: 'Prescriptions', path: '/prescriptions', roles: ['doctor', 'clinic_owner'] },
        ...(facilityProfile?.modules?.ward !== false ? [
          { label: 'Ward / In-Patient', path: '/ward', roles: ['doctor', 'clinic_owner', 'nurse'] }
        ] : []),
        { label: 'Waitlist TV', path: '/waitlist-tv', roles: ['doctor', 'nurse', 'receptionist', 'clinic_owner', 'admin'] },
      ]
    },
    {
      id: 'system-codes',
      icon: Database,
      label: role === 'superadmin' ? 'System Codes Master' : 'Clinical Lexicon',
      path: '/superadmin/codes',
      roles: ['clinic_owner', 'admin'] // Removed superadmin
    },
    {
      id: 'reports',
      icon: FileBarChart,
      label: 'Reports',
      path: '/master/reports',
      roles: ['superadmin', 'clinic_owner', 'doctor', 'nurse', 'receptionist', 'pharmacist', 'lab_tech', 'lab_admin', 'pharmacist_admin']
    },
  ];
};

export default function Sidebar({ isOpen, onClose }) {
  const { userData, logout, actingRole } = useAuth();
  const { confirm } = useConfirm();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState({});
  const [facilityProfile, setFacilityProfile] = useState(null);
  const [providerBalance, setProviderBalance] = useState(null);

  useEffect(() => {
    if (userData?.facilityId) {
      import('../../services/facilityService').then(m => {
        m.default.getProfile(userData.facilityId).then(p => {
          if (p) setFacilityProfile(p);
        });
      });
    }

    const role = actingRole || userData?.role;
    if (role === 'doctor' || role === 'clinic_owner' || role === 'receptionist' || role === 'nurse' || role === 'lab_tech' || role === 'pharmacist' || role === 'lab_admin' || role === 'pharmacist_admin') {
      setExpandedItems(prev => ({
        ...prev,
        clinical: (role === 'doctor' || role === 'clinic_owner' || role === 'receptionist' || role === 'nurse' || role === 'lab_tech' || role === 'lab_admin'),
        pharmacy: (role === 'pharmacist' || role === 'clinic_owner' || role === 'pharmacist_admin'),
        financial: (role === 'receptionist' || role === 'clinic_owner') ? true : prev.financial
      }));
    }

    if (role === 'superadmin') {
      import('../../services/smsSettingsService').then(m => {
        m.default.getAtBalance().then(bal => {
          if (bal) setProviderBalance(bal);
        });
      });
    }
  }, [userData?.facilityId, actingRole, userData?.role]);

  // Auto-expand menu if sub-item is active
  useEffect(() => {
    const role = actingRole || userData?.role;
    if (!role) return;
    const items = getMenuItems(role, facilityProfile).filter(item => !item.roles || item.roles.includes(role));
    items.forEach(item => {
      if (item.subItems) {
        const activeSubItems = item.subItems.filter(sub => !sub.roles || sub.roles.includes(role));
        if (activeSubItems.length > 1 && activeSubItems.some(sub => sub.path === location.pathname)) {
          setExpandedItems(prev => ({ ...prev, [item.id]: true }));
        }
      }
    });
  }, [location.pathname, actingRole, userData?.role, facilityProfile]);

  const toggleExpand = (id) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const role = actingRole || userData?.role;
  const isSuperadmin = role === 'superadmin' || role === 'platform_owner';

  if (!role && userData === null) {
    return (
      <aside className="fixed lg:static w-72 bg-white h-screen border-r border-slate-100 p-8 flex flex-col items-center justify-center text-center z-[60]">
        <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-4">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-medium text-slate-900">Profile Missing</h3>
        <p className="text-xs text-slate-500 mt-2">Your account exists but has no role assigned.</p>
        <button onClick={logout} className="mt-6 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded-lg transition-colors">Log Out</button>
      </aside>
    );
  }

  if (!role) return null;

  const filteredMenuItems = getMenuItems(role, facilityProfile)
    .filter(item => !item.roles || item.roles.includes(role))
    .map(item => {
      if (item.subItems) {
        const activeSubItems = item.subItems.filter(sub => !sub.roles || sub.roles.includes(role));
        if (activeSubItems.length === 1) {
          return {
            ...item,
            path: activeSubItems[0].path,
            subItems: []
          };
        }
        return {
          ...item,
          subItems: activeSubItems
        };
      }
      return item;
    });

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[50] lg:hidden" />
        )}
      </AnimatePresence>

      <aside className={`
        w-72 h-screen flex flex-col fixed left-0 top-0 z-[60] overflow-y-auto scrollbar-hide transition-all duration-300
        bg-[#0B1120] text-slate-400
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-8 flex items-center justify-between sticky top-0 z-10 bg-[#0B1120]">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-[#0052FF] text-white shadow-sm shrink-0">
              <svg className="w-5.5 h-5.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2S3 5 3 12s9 10 9 10 9-3 9-10S12 2 12 2zm1 14h-2v-3H8v-2h3V8h2v3h3v2h-3v3z" />
              </svg>
            </div>
            <span className="font-bold text-xl tracking-tight text-white">Hure Care</span>
          </div>
          <button onClick={onClose} className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-2">
          {filteredMenuItems.map((item) => {
            const isExpanded = expandedItems[item.id];
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isActive = item.path === location.pathname || (hasSubItems && item.subItems.some(sub => sub.path === location.pathname));

            return (
              <div key={item.id} className="space-y-1">
                {hasSubItems ? (
                  <button
                    onClick={() => toggleExpand(item.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-200 group
                      ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}
                    `}
                  >
                    <div className="flex items-center gap-4">
                      <item.icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                ) : (
                  <NavLink
                    to={item.path}
                    className={({ isActive }) => `flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 group
                      ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}
                    `}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </NavLink>
                )}

                <AnimatePresence>
                  {hasSubItems && isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden pl-12 space-y-1">
                      {item.subItems.filter(sub => !sub.roles || sub.roles.includes(role)).map((sub) => (
                        <NavLink key={sub.path} to={sub.path} className={({ isActive }) => `block px-4 py-2 text-sm rounded-xl transition-all ${isActive ? 'text-white font-medium' : 'text-slate-500 hover:text-white hover:translate-x-1'}`}>{sub.label}</NavLink>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        <div className="p-4 mt-auto sticky bottom-0 z-10 bg-[#0B1120] space-y-3">
          {isSuperadmin && providerBalance && (
            <div className="p-4 rounded-2xl bg-slate-900 text-white shadow-xl shadow-slate-900/20 relative overflow-hidden group border border-white/5 mb-2">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">Platform Balance</span>
                  <div className={`h-2 w-2 rounded-full ${providerBalance.includes('-') ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                </div>
                <p className="text-sm font-bold tabular-nums tracking-tight leading-none">{providerBalance}</p>
              </div>
            </div>
          )}

          {/* User Profile Card */}
          <div 
            onClick={async () => {
              const isConfirmed = await confirm({
                title: 'Log Out',
                message: 'Are you sure you want to log out of HURE Care? Your session will be safely ended.',
                confirmText: 'Log Out',
                cancelText: 'Cancel',
                isDestructive: true
              });
              if (isConfirmed) {
                logout();
              }
            }}
            className="bg-[#1E293B]/40 border border-white/5 rounded-2xl p-4 transition-all duration-200 hover:bg-slate-800/60 cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-[#0052FF] flex items-center justify-center text-white font-semibold shadow-inner shrink-0 group-hover:scale-105 transition-transform">
                {userData?.name ? userData.name[0] : 'J'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-white leading-tight">{userData?.name || 'Jebin'}</p>
                <p className="text-[10px] font-semibold text-slate-500 mt-0.5 tracking-wider uppercase">{role === 'superadmin' ? 'Super Admin' : role.replace('_', ' ')}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-500 shrink-0 group-hover:text-slate-300 transition-colors" />
            </div>
          </div>

          {/* Need Help? Contact Support Widget */}
          <a 
            href="mailto:support@hurecare.com"
            className="bg-[#1E293B]/20 border border-white/5 rounded-2xl p-4 flex items-center gap-4 transition-all duration-200 hover:bg-slate-800/40 cursor-pointer group"
          >
            <div className="h-9 w-9 rounded-xl bg-slate-800/60 border border-white/5 flex items-center justify-center text-slate-300 shrink-0 group-hover:scale-105 transition-transform">
              <Headphones className="h-4 w-4 text-slate-200" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white leading-tight">Need Help?</p>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5 tracking-wide">Contact Support</p>
            </div>
          </a>
        </div>
      </aside>
    </>
  );
}
