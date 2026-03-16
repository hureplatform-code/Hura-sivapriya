import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  UserPlus,
  ArrowUpRight,
  History,
  Phone,
  Mail,
  Calendar,
  MoreVertical,
  CheckCircle2,
  ExternalLink,
  User,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import patientService from '../../services/patientService';
import QuickPatientModal from '../../components/modals/QuickPatientModal';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useConfirm } from '../../contexts/ConfirmContext';

export default function PatientList() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenu, setActiveMenu] = useState(null);
  const [genderFilter, setGenderFilter] = useState('All');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const { userData } = useAuth();
  const { success, error: toastError } = useToast();
  const { confirm } = useConfirm();

  useEffect(() => {
    fetchPatients();
  }, []);

  if (userData?.role === 'superadmin') {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-12 text-center bg-white rounded-[3rem] border border-slate-100 shadow-sm">
           <div className="h-20 w-20 bg-amber-50 rounded-3xl flex items-center justify-center text-amber-600 mb-6 shadow-inner">
              <Users className="h-10 w-10" />
           </div>
           <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Access Restricted</h2>
           <p className="text-slate-500 max-w-md mt-2 font-medium">
             As a Platform Superadmin, you have governance-level access. Viewing individual patient records is restricted to maintain clinical privacy and HIPAA compliance.
           </p>
           <button 
             onClick={() => navigate('/superadmin/subscriptions')}
             className="mt-8 px-8 py-4 bg-slate-900 text-white font-medium text-[10px] uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
           >
             Return to Governance Hub
           </button>
        </div>
      </DashboardLayout>
    );
  }

  const fetchPatients = async (isLoadMore = false) => {
    try {
      if (isLoadMore) setLoadingMore(true);
      else setLoading(true);

      const { patients: newPatients, lastDoc } = await patientService.getAllPatients(
        userData?.facilityId, 
        20, 
        isLoadMore ? lastVisible : null
      );

      if (isLoadMore) {
        setPatients(prev => [...prev, ...newPatients]);
      } else {
        setPatients(newPatients);
      }

      setLastVisible(lastDoc);
      setHasMore(newPatients.length === 20);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toastError('Failed to load patient registry.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleDeletePatient = async (id) => {
    const isConfirmed = await confirm({
      title: 'Delete Patient Record',
      message: 'Are you sure you want to permanently delete this patient record? This action cannot be undone and will remove all associated clinical data.',
      confirmText: 'Delete Record',
      cancelText: 'Cancel',
      isDestructive: true
    });
    
    if (isConfirmed) {
      try {
        await patientService.deletePatient(id);
        fetchPatients();
        success('Patient record deleted successfully.');
      } catch (error) {
        console.error('Error deleting patient:', error);
        toastError('Failed to delete patient record.');
      }
    }
  };

  const handlePatientRegistered = (newPatient) => {
    setPatients(prev => [newPatient, ...prev]);
  };

  const filteredPatients = patients.filter(p => {
    if (!searchQuery) return genderFilter === 'All' || p.gender === genderFilter;

    const queryLower = searchQuery.toLowerCase();
    const cleanQuery = queryLower.replace(/[^a-z0-9]/g, '');
    const queryDigits = searchQuery.replace(/[^0-9]/g, '');
    const queryNoZero = queryDigits.startsWith('0') ? queryDigits.substring(1) : queryDigits;

    const mobileDigits = (p.mobile || '').replace(/[^0-9]/g, '');
    const contactDigits = (p.contact || '').replace(/[^0-9]/g, '');
    
    // Check document ID and user-facing patientId
    const cleanId1 = (p.id || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanId2 = (p.patientId || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    const nameMatch = p.name?.toLowerCase().includes(queryLower);
    const idMatch = cleanQuery && (cleanId1.includes(cleanQuery) || cleanId2.includes(cleanQuery));
    const phoneMatch = (queryDigits && (mobileDigits.includes(queryDigits) || contactDigits.includes(queryDigits))) ||
                      (queryNoZero && (mobileDigits.includes(queryNoZero) || contactDigits.includes(queryNoZero)));

    const matchesSearch = nameMatch || idMatch || phoneMatch;
    const matchesGender = genderFilter === 'All' || p.gender === genderFilter;
    return matchesSearch && matchesGender;
  });

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Patient Registry</h1>
            <p className="text-slate-500 mt-1">Centralized database for all registered patients and clinical histories.</p>
          </div>
          {userData?.role !== 'doctor' && (
            <button 
              onClick={() => setIsRegisterModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-medium rounded-2xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-200 active:scale-95"
            >
              <UserPlus className="h-5 w-5" />
              Register New Patient
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Total Registered', value: patients.length.toLocaleString(), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Recently Active', value: '42', icon: ArrowUpRight, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Returning Patients', value: '85%', icon: History, color: 'text-purple-600', bg: 'bg-purple-50' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">{stat.label}</p>
                <h3 className="text-2xl font-semibold text-slate-900 mt-1">{stat.value}</h3>
              </div>
              <div className={`h-12 w-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </motion.div>
          ))}
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input 
                type="text"
                placeholder="Search by Patient Name, OP Number (ID), or Phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none focus:ring-2 focus:ring-primary-100 rounded-2xl text-sm transition-all outline-none"
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <select 
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className="px-4 py-3 bg-slate-50 border-none focus:ring-2 focus:ring-primary-100 rounded-2xl text-sm font-medium transition-all outline-none appearance-none min-w-[120px]"
              >
                <option value="All">All Genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              <button className="p-3 bg-slate-50 text-slate-600 rounded-2xl hover:bg-slate-100 transition-colors">
                <Filter className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-slate-50">
                  <th className="pb-4 text-[10px] font-medium text-slate-400 uppercase tracking-widest px-4">Patient Info</th>
                  <th className="pb-4 text-[10px] font-medium text-slate-400 uppercase tracking-widest px-4">Contact</th>
                  <th className="pb-4 text-[10px] font-medium text-slate-400 uppercase tracking-widest px-4">Payment</th>
                  <th className="pb-4 text-[10px] font-medium text-slate-400 uppercase tracking-widest px-4">Status</th>
                  <th className="pb-4 text-[10px] font-medium text-slate-400 uppercase tracking-widest px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading && !loadingMore ? (
                   <tr>
                     <td colSpan="5" className="py-12 text-center text-slate-400 font-semibold uppercase tracking-widest text-xs">Loading patient registry...</td>
                   </tr>
                ) : filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-slate-500">No patients matching your search.</td>
                  </tr>
                ) : (
                  filteredPatients.map((pat, i) => (
                    <motion.tr 
                      key={pat.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="group hover:bg-slate-50/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/master/patients/${pat.id}`)}
                    >
                      <td className="py-5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center font-medium text-slate-500 text-xs">
                            {pat.name?.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 text-sm">{pat.name}</p>
                            <p className="text-xs text-slate-400 font-medium tracking-tight">ID: {pat.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-4">
                        <p className="text-sm font-medium text-slate-900">{pat.contact || pat.mobile}</p>
                        <p className="text-xs text-slate-400 font-medium">{pat.email || 'No email'}</p>
                      </td>
                      <td className="py-5 px-4">
                        <p className="text-sm font-medium text-slate-900 capitalize">{pat.paymentMode || 'Cash'}</p>
                      </td>
                      <td className="py-5 px-4">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-widest
                          ${pat.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}
                        `}>
                          {pat.status || 'Active'}
                        </span>
                      </td>
                      <td className="py-5 px-4 text-right">
                        {userData?.role === 'doctor' ? (
                          <button 
                            onClick={(e) => { e.stopPropagation(); navigate(`/master/patients/${pat.id}`); }}
                            className="px-4 py-2 bg-slate-50 text-slate-600 font-bold text-[10px] uppercase tracking-widest rounded-lg border border-slate-200 transition-all active:scale-95 flex items-center gap-2 ml-auto hover:bg-white hover:text-slate-900"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            View Details
                          </button>
                        ) : (
                          <div className="flex items-center justify-end gap-2 transition-opacity">
                            <button 
                              onClick={(e) => { e.stopPropagation(); navigate(`/master/patients/${pat.id}`); }}
                              className="p-2.5 text-slate-400 hover:text-primary-600 bg-white rounded-xl shadow-sm border border-slate-100"
                            >
                              <ExternalLink className="h-4.5 w-4.5" />
                            </button>
                            <div className="relative">
                              <button 
                                onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === pat.id ? null : pat.id); }}
                                className="p-2.5 text-slate-400 hover:text-slate-900 bg-white rounded-xl shadow-sm border border-slate-100"
                              >
                                <MoreVertical className="h-4.5 w-4.5" />
                              </button>

                              {activeMenu === pat.id && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50">
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); navigate(`/master/patients/${pat.id}`); setActiveMenu(null); }}
                                    className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 font-medium flex items-center gap-2"
                                  >
                                    <ExternalLink className="h-4 w-4" /> View Details
                                  </button>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); navigate(`/master/patients/${pat.id}`); setActiveMenu(null); }}
                                    className="w-full text-left px-4 py-2 text-sm text-primary-600 hover:bg-slate-50 font-medium flex items-center gap-2"
                                  >
                                    <User className="h-4 w-4" /> Edit Profile
                                  </button>
                                  <div className="h-px bg-slate-100 my-1" />
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleDeletePatient(pat.id); setActiveMenu(null); }}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-slate-50 font-medium flex items-center gap-2"
                                  >
                                    <Trash2 className="h-4 w-4" /> Delete Patient
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  )
                ))}
              </tbody>
            </table>
          </div>

          {hasMore && (
            <div className="pt-8 flex justify-center border-t border-slate-50">
               <button
                 onClick={() => fetchPatients(true)}
                 disabled={loadingMore}
                 className="px-10 py-3.5 bg-slate-50 text-slate-600 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center gap-2 disabled:opacity-50"
               >
                 {loadingMore ? 'Loading Records...' : 'Load More Patients'}
               </button>
            </div>
          )}
        </div>
      </div>
      <QuickPatientModal 
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSave={(data) => {
           handlePatientRegistered(data);
           success('Patient registered successfully.');
        }}
      />
    </DashboardLayout>
  );
}
