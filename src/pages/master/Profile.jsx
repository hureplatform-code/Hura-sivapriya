import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import facilityService from '../../services/facilityService';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  ShieldCheck, 
  Save,
  Image as ImageIcon,
  CheckCircle2,
  Trash2,
  Plus,
  Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const tabs = [
  { id: 'general', label: 'General Info', icon: Building2 },
  { id: 'contact', label: 'Contact Details', icon: Phone },
  { id: 'billing', label: 'Billing & License', icon: ShieldCheck },
  { id: 'branding', label: 'Print Branding', icon: Printer },
  { id: 'branches', label: 'Branch Settings', icon: Globe },
];

export default function Profile() {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [notification, setNotification] = useState(null);
  const [profile, setProfile] = useState({
    name: 'Hospital ERP',
    type: 'Multi-Speciality Hospital',
    tagline: 'Providing premium healthcare services.',
    phone: '',
    email: '',
    website: '',
    address: '',
    city: '',
    country: '',
    license: '',
    taxId: '',
    logoUrl: null,
    printHeader: '',
    printSubHeader: '',
    plan: 'Enterprise',
    isVerified: true,
    currency: 'USD',
    openingHours: 'Mon - Fri: 8:00 AM - 8:00 PM, Sat: 9:00 AM - 5:00 PM',
    socialLinks: {
      facebook: '',
      twitter: '',
      linkedin: ''
    }
  });
  const [branches, setBranches] = useState([]);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const { userData } = useAuth();

  useEffect(() => {
    if (userData?.facilityId) {
        fetchData();
    }
  }, [userData]);

  const fetchData = async () => {
    try {
      setFetching(true);
      const [profileData, branchesData] = await Promise.all([
        facilityService.getProfile(userData.facilityId),
        facilityService.getBranches() // This might also need filtering by facilityId later??
      ]);
      
      if (profileData) {
        setProfile(prev => ({ ...prev, ...profileData }));
        if (profileData.logoUrl) setLogoPreview(profileData.logoUrl);
      }
      if (branchesData) {
        setBranches(branchesData);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setFetching(false);
    }
  };

  const fetchProfile = fetchData; // Alias for backward compatibility if needed

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      // Ensure we don't accidentally wipe existing logoUrl if no new file provided
      const finalProfileData = {
        ...profile,
        logoUrl: profile.logoUrl || logoPreview
      };
      
      await facilityService.updateProfile(userData.facilityId, finalProfileData, logoFile);
      setLogoFile(null);
      showNotification('Facility profile updated successfully!');
      fetchData(); // Refresh to ensure state is in sync
    } catch (error) {
      showNotification('Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Company Profile</h1>
            <p className="text-slate-500 mt-1">Configure your hospital's identity, branding, and global settings.</p>
          </div>
          <button 
            type="submit" 
            form="profile-form"
            disabled={loading}
            className="flex items-center gap-2 px-8 py-3.5 bg-primary-600 text-white font-bold rounded-2xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-200 disabled:opacity-70 active:scale-95"
          >
            {loading ? (
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="h-5 w-5" />
            )}
            Save Changes
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white p-2 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-6 py-4 rounded-2xl transition-all font-bold text-sm
                    ${activeTab === tab.id 
                      ? 'bg-primary-50 text-primary-600 shadow-sm shadow-primary-50/50' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
                  `}
                >
                  <tab.icon className="h-5 w-5" />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="bg-primary-600 rounded-3xl p-6 text-white shadow-xl shadow-primary-100 relative overflow-hidden group">
              <div className="relative z-10">
                <h4 className="font-bold text-lg">{profile.plan ? `${profile.plan} Plan` : 'Standard Plan'}</h4>
                <p className="text-primary-100 text-sm mt-1">You are currently on the {profile.plan || 'Free'} Tier.</p>
                <button 
                  type="button"
                  className="mt-4 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl text-xs font-bold transition-all"
                >
                  Manage Subscription
                </button>
              </div>
              <Building2 className="absolute -right-4 -bottom-4 h-24 w-24 text-white/10 group-hover:scale-110 transition-transform duration-500" />
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <form id="profile-form" onSubmit={handleSave} className="p-8 space-y-8">
                {activeTab === 'general' && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-8"
                  >
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                      <div className="relative group">
                        <input 
                          type="file" 
                          id="logo-upload" 
                          className="hidden" 
                          accept="image/*"
                          onChange={handleLogoChange}
                        />
                        <label 
                          htmlFor="logo-upload"
                          className="h-40 w-40 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 group-hover:border-primary-400 transition-colors cursor-pointer overflow-hidden relative"
                        >
                          {logoPreview ? (
                            <img src={logoPreview} alt="Logo" className="h-full w-full object-contain p-4" />
                          ) : (
                            <>
                              <ImageIcon className="h-8 w-8 text-slate-300" />
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center px-4">Upload Logo</span>
                            </>
                          )}
                          <div className="absolute inset-0 bg-primary-600/0 group-hover:bg-primary-600/10 transition-colors" />
                        </label>
                        <button type="button" className="absolute -bottom-2 -right-2 p-2 bg-white rounded-xl shadow-lg border border-slate-100 text-slate-400 hover:text-primary-600">
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex-1 w-full space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-wider">Hospital Name</label>
                            <input 
                              type="text" 
                              value={profile.name}
                              onChange={(e) => setProfile({...profile, name: e.target.value})}
                              className="w-full px-4 py-3.5 bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-primary-500 rounded-2xl text-sm font-bold transition-all outline-none"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-wider">Base Currency</label>
                             <input 
                               type="text" 
                               value={profile.currency}
                               onChange={(e) => setProfile({...profile, currency: e.target.value})}
                               className="w-full px-4 py-3.5 bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-primary-500 rounded-2xl text-sm font-bold transition-all outline-none"
                             />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-wider">Practice Type</label>
                            <select 
                              value={profile.type}
                              onChange={(e) => setProfile({...profile, type: e.target.value})}
                              className="w-full px-4 py-3.5 bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-primary-500 rounded-2xl text-sm font-bold transition-all outline-none appearance-none"
                            >
                              <option>Multi-Speciality Hospital</option>
                              <option>General Clinic</option>
                              <option>Diagnostic Center</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-wider">Service Plan</label>
                            <select 
                              value={profile.plan}
                              onChange={(e) => setProfile({...profile, plan: e.target.value})}
                              className="w-full px-4 py-3.5 bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-primary-500 rounded-2xl text-sm font-bold transition-all outline-none appearance-none"
                            >
                              <option value="Basic">Basic Plan</option>
                              <option value="Pro">Professional Plan</option>
                              <option value="Enterprise">Enterprise Plan</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-wider">Facility Status</label>
                          <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-2xl h-[52px]">
                             <div className={`h-2 w-2 rounded-full ${profile.isVerified ? 'bg-emerald-500' : 'bg-slate-300'} animate-pulse`} />
                             <span className="text-sm font-bold text-slate-900">{profile.isVerified ? 'Verified Hospital' : 'Pending Verification'}</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-wider">Short Bio / Tagline</label>
                          <textarea 
                            rows="3"
                            value={profile.tagline}
                            onChange={(e) => setProfile({...profile, tagline: e.target.value})}
                            className="w-full px-4 py-3.5 bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-primary-500 rounded-2xl text-sm font-medium transition-all outline-none resize-none"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'contact' && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-8"
                  >
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-wider flex items-center gap-2">
                          <Phone className="h-3 w-3" /> Phone Number
                        </label>
                        <input type="text" value={profile.phone} onChange={(e) => setProfile({...profile, phone: e.target.value})} className="w-full px-4 py-3.5 bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-primary-500 rounded-2xl text-sm font-bold transition-all outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-wider flex items-center gap-2">
                          <Mail className="h-3 w-3" /> Email Address
                        </label>
                        <input type="email" value={profile.email} onChange={(e) => setProfile({...profile, email: e.target.value})} className="w-full px-4 py-3.5 bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-primary-500 rounded-2xl text-sm font-bold transition-all outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-wider flex items-center gap-2">
                          <Globe className="h-3 w-3" /> Website
                        </label>
                        <input type="url" value={profile.website} onChange={(e) => setProfile({...profile, website: e.target.value})} className="w-full px-4 py-3.5 bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-primary-500 rounded-2xl text-sm font-bold transition-all outline-none" />
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-wider flex items-center gap-2">
                          <MapPin className="h-3 w-3" /> Address
                        </label>
                        <textarea rows="4" value={profile.address} onChange={(e) => setProfile({...profile, address: e.target.value})} className="w-full px-4 py-3.5 bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-primary-500 rounded-2xl text-sm font-medium transition-all outline-none resize-none" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-wider">City</label>
                          <input type="text" value={profile.city} onChange={(e) => setProfile({...profile, city: e.target.value})} className="w-full px-4 py-3.5 bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-primary-500 rounded-2xl text-sm font-bold transition-all outline-none" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-wider">Country</label>
                          <input type="text" value={profile.country} onChange={(e) => setProfile({...profile, country: e.target.value})} className="w-full px-4 py-3.5 bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-primary-500 rounded-2xl text-sm font-bold transition-all outline-none" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-wider">Service Opening Hours</label>
                        <input 
                          type="text" 
                          value={profile.openingHours} 
                          onChange={(e) => setProfile({...profile, openingHours: e.target.value})} 
                          className="w-full px-4 py-3.5 bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-primary-500 rounded-2xl text-sm font-bold transition-all outline-none"
                          placeholder="e.g. Mon-Fri: 8am-8pm"
                        />
                      </div>

                      <div className="pt-4 space-y-4">
                        <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-wider block">Social Presence</label>
                        <div className="grid grid-cols-1 gap-4">
                           <div className="relative">
                             <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 text-xs font-bold uppercase">FB</div>
                             <input 
                                type="text" 
                                value={profile.socialLinks?.facebook} 
                                onChange={(e) => setProfile({...profile, socialLinks: {...profile.socialLinks, facebook: e.target.value}})}
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-primary-500 rounded-xl text-sm transition-all outline-none" 
                                placeholder="Facebook URL"
                             />
                           </div>
                           <div className="relative">
                             <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 text-xs font-bold uppercase">TW</div>
                             <input 
                                type="text" 
                                value={profile.socialLinks?.twitter} 
                                onChange={(e) => setProfile({...profile, socialLinks: {...profile.socialLinks, twitter: e.target.value}})}
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-primary-500 rounded-xl text-sm transition-all outline-none" 
                                placeholder="Twitter URL"
                             />
                           </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'billing' && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-8"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-wider">License Number</label>
                        <input type="text" value={profile.license} onChange={(e) => setProfile({...profile, license: e.target.value})} className="w-full px-4 py-3.5 bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-primary-500 rounded-2xl text-sm font-bold transition-all outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-wider">Tax ID / PIN</label>
                        <input type="text" value={profile.taxId} onChange={(e) => setProfile({...profile, taxId: e.target.value})} className="w-full px-4 py-3.5 bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-primary-500 rounded-2xl text-sm font-bold transition-all outline-none" />
                      </div>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-start gap-4">
                      <div className="p-2 bg-primary-100 text-primary-600 rounded-xl">
                        <ShieldCheck className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">{profile.isVerified ? 'Verified Facility' : 'Verification Required'}</h4>
                        <p className="text-sm text-slate-500 mt-1">
                          {profile.isVerified 
                            ? 'Your facility license has been verified by the system administrator.' 
                            : 'Please upload your medical license and tax documents for system verification.'}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'branding' && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-8"
                  >
                    <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white space-y-8 relative overflow-hidden group">
                       <div className="relative z-10">
                         <h3 className="text-xl font-black mb-1">Print Preview</h3>
                         <p className="text-slate-400 text-sm">How your facility will appear on thermal receipts and A4 reports.</p>
                         
                         <div className="mt-8 bg-white text-slate-900 p-8 rounded-2xl border-4 border-slate-800 shadow-2xl max-w-md mx-auto aspect-[3/4] flex flex-col items-center">
                            <div className="h-16 w-16 bg-slate-50 rounded-xl mb-4 flex items-center justify-center overflow-hidden">
                               {logoPreview ? <img src={logoPreview} alt="Logo" className="h-full w-full object-contain" /> : <ImageIcon className="h-8 w-8 text-slate-200" />}
                            </div>
                            <h4 className="text-lg font-black text-center uppercase leading-tight">{profile.printHeader || profile.name}</h4>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center mt-1">{profile.printSubHeader || profile.tagline}</p>
                            <div className="w-full border-t border-slate-100 mt-4 pt-4 space-y-2">
                               <div className="h-2 w-3/4 bg-slate-50 rounded-full mx-auto" />
                               <div className="h-2 w-1/2 bg-slate-50 rounded-full mx-auto" />
                            </div>
                         </div>
                       </div>
                       <Printer className="absolute -right-8 -bottom-8 h-32 w-32 text-white/5" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-wider">Letterhead Header</label>
                        <input 
                          type="text" 
                          value={profile.printHeader}
                          onChange={(e) => setProfile({...profile, printHeader: e.target.value})}
                          className="w-full px-4 py-3.5 bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-primary-500 rounded-2xl text-sm font-bold transition-all outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-wider">Letterhead Sub-text</label>
                        <input 
                          type="text" 
                          value={profile.printSubHeader}
                          onChange={(e) => setProfile({...profile, printSubHeader: e.target.value})}
                          className="w-full px-4 py-3.5 bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-primary-500 rounded-2xl text-sm font-bold transition-all outline-none"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                 {activeTab === 'branches' && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">Active Branches ({branches.length})</h4>
                      <button 
                         type="button"
                         onClick={() => window.location.href = '/master/branches'}
                         className="text-xs font-bold text-primary-600 hover:text-primary-700"
                      >
                         Manage in Branch Settings →
                      </button>
                    </div>

                    {branches?.map((branch) => (
                      <div key={branch.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between group">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-primary-600 transition-colors shadow-sm">
                            <Building2 className="h-6 w-6" />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1">
                             <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase">Branch Name</p>
                                <p className="font-bold text-slate-900">{branch.name}</p>
                             </div>
                             <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase">Location</p>
                                <p className="font-bold text-slate-500">{branch.location}</p>
                             </div>
                             <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase">Contact</p>
                                <p className="font-bold text-slate-500">{branch.phone}</p>
                             </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {branches.length === 0 && (
                       <div className="p-12 border-2 border-dashed border-slate-100 rounded-[2rem] text-center">
                          <p className="text-sm font-bold text-slate-400">No branches registered yet.</p>
                       </div>
                    )}
                  </motion.div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-sm min-w-[300px]"
          >
            <div className="h-8 w-8 bg-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            {notification}
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
