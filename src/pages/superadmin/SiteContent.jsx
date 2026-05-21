import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import {
   Save,
   RotateCcw,
   Globe,
   Layout,
   CreditCard,
   HelpCircle,
   AlertCircle,
   Edit,
   Trash2,
   Plus,
   ArrowRight,
   Upload,
   Activity,
   TrendingUp,
   CheckCircle2,
   User,
   ShieldCheck,
   Eye,
   MoreVertical,
   Calendar,
   ChevronDown,
   ChevronUp,
   FileText,
   Image as ImageIcon,
   X,
   Check,
   Loader2,
   ExternalLink,
   LayoutGrid,
   Clock
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import siteContentService from '../../services/siteContentService';
import { db, storage } from '../../firebase';
import { collection, getDocs, doc, setDoc, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

// Default dynamic fallbacks (to populate if empty in DB)
const DEFAULT_FEATURES = [
  {
    icon: "User",
    title: "Patient Administration",
    description: "Centralized patient records, visit history, and care documentation secured with enterprise-grade encryption.",
  },
  {
    icon: "Calendar",
    title: "Intelligent Scheduling",
    description: "Optimize provider calendars and patient flow across single or multi-branch facility operations.",
  },
  {
    icon: "FileText",
    title: "Clinical Documentation",
    description: "Structured SOAP notes and treatment plans designed for clinical speed and precision.",
  },
  {
    icon: "CreditCard",
    title: "Revenue Cycle",
    description: "Automated billing, charges, and payment tracking linked directly to the clinical encounter.",
  },
  {
    icon: "Globe",
    title: "Multi-Location Control",
    description: "Manage branch-level operations with centralized administrative oversight and secure access.",
  },
  {
    icon: "ShieldCheck",
    title: "Audit & Governance",
    description: "Role-based access controls and immutable audit logs to protect sensitive health information.",
  },
];

const DEFAULT_GROWTH_STEPS = [
  {
    step: "01",
    title: "10-Day Evaluation",
    body: "Experience the full HURE Care workflow across triage, clinical notes, and billing with zero restrictions.",
    icon: "Activity",
    color: "bg-teal-50 text-teal-600"
  },
  {
    step: "02",
    title: "Document Verification",
    body: "Submit your facility licensing for our compliance review to ensure secure, uninterrupted access.",
    icon: "ShieldCheck",
    color: "bg-blue-50 text-blue-600"
  },
  {
    step: "03",
    title: "Unrestricted Growth",
    body: "Activate your preferred plan and scale your facility with a verified professional operating system.",
    icon: "TrendingUp",
    color: "bg-indigo-50 text-indigo-600"
  }
];

const DEFAULT_FAQS = [
  {
    question: "How long does system onboarding take?",
    answer: "Most facilities are fully operational within 24 hours. Our intuitive setup allows you to add providers and begin documentation immediately.",
  },
  {
    question: "Can I manage decentralized branch locations?",
    answer: "Yes. HURE Care was engineered for centralization, allowing you to manage multiple branches from a single administrative account.",
  },
  {
    question: "What modules are included in the base plan?",
    answer: "Every plan includes the core patient care OS: Triage, Clinical Documentation, Appointments, Pharmacy, Lab tracking, and Billing.",
  },
  {
    question: "How does the evaluation period work?",
    answer: "The 10-day trial gives you unrestricted access to all features so your clinical team can validate the workflow.",
  },
];

const initialContent = {
   heroBadge: "Patient care management, done right",
   heroTitleLine1: "Streamline your",
   heroTitleHighlight1: "patient care",
   heroTitleHighlight2: "operations",
   heroBody: "HURE Care is the modern operating system for healthcare facility operations, built to help facilities manage appointments, patient records, visit documentation, billing, and daily front-desk-to-provider coordination in one secure system.",
   heroNote: "Experience how modern EMR should feel.",
   pricingEyebrow: "FLEXIBLE PRICING",
   pricingTitle: "Simple, transparent plans",
   pricingNote: "Choose the plan that fits your facility's growth. All plans include full EMR workflow access. Scaling is limited only by staff and locations.",
   faqEyebrow: "SUPPORT",
   faqTitle: "Frequently Asked Questions",
   faqBody: "Can't find the answer you're looking for? Reach out to our specialist team.",
   footerBlurb: "HURE Care: The intelligent operating system empowering healthcare facilities with streamlined workflows and data-driven coordination.",
   
   // Ecosystem header
   ecosystemEyebrow: "Core Ecosystem",
   ecosystemTitle: "Built for precision. Designed for clinical flow.",
   ecosystemBody: "Everything your medical team needs to transition from manual bottlenecks to digital excellence.",
   
   // Logo URL
   logoUrl: "",
   
   // Arrays
   features: DEFAULT_FEATURES,
   growthSteps: DEFAULT_GROWTH_STEPS,
   faqs: DEFAULT_FAQS
};

// Available premium Lucide Icons for selection
const AVAILABLE_ICONS = [
  "User", "Calendar", "FileText", "CreditCard", "Globe", "ShieldCheck",
  "Activity", "TrendingUp", "Layout", "Stethoscope", "Settings", "Database",
  "MessageSquare", "Heart", "Clock", "Award", "Plus", "Shield", "Activity"
];

const RenderIcon = ({ iconName, className }) => {
  const IconComponent = LucideIcons[iconName] || LucideIcons.HelpCircle;
  return <IconComponent className={className} />;
};

export default function SiteContent() {
   const { userData } = useAuth();
   const [content, setContent] = useState(initialContent);
   const [plans, setPlans] = useState([]);
   const [loading, setLoading] = useState(true);
   const [saving, setSaving] = useState(false);
   const [uploadingImage, setUploadingImage] = useState(false);
   const { success, error } = useToast();

   // Navigation Tab state: 'general' | 'images' | 'features' | 'pricing' | 'faqs'
   const [activeTab, setActiveTab] = useState('general');

   // Modal / Overlay edit states
   const [editSection, setEditSection] = useState(null); // 'hero' | 'ecosystem' | 'pricing' | 'growth' | null
   const [editFeatureIdx, setEditFeatureIdx] = useState(null); // index or 'new'
   const [featureForm, setFeatureForm] = useState({ title: '', description: '', icon: 'User' });
   const [editPlanId, setEditPlanId] = useState(null);
   const [planForm, setPlanForm] = useState({ name: '', subtitle: '', price: 0, maxStaff: 10, maxLocations: 1, featured: false });
   const [editFaqIdx, setEditFaqIdx] = useState(null); // index or 'new'
   const [faqForm, setFaqForm] = useState({ question: '', answer: '' });

   useEffect(() => {
      const loadAllData = async () => {
         try {
            const [dbContent, plansSnap] = await Promise.all([
               siteContentService.getContent(),
               getDocs(query(collection(db, 'subscription_plans'), orderBy('price', 'asc')))
            ]);

            if (dbContent) {
               setContent(prev => ({ 
                 ...prev, 
                 ...dbContent,
                 features: dbContent.features || DEFAULT_FEATURES,
                 growthSteps: dbContent.growthSteps || DEFAULT_GROWTH_STEPS,
                 faqs: dbContent.faqs || DEFAULT_FAQS
               }));
            }

            const plansList = plansSnap.docs.map(doc => ({
               id: doc.id,
               ...doc.data()
            }));
            setPlans(plansList);
         } catch (err) {
            console.error("Failed to load content/plans:", err);
            error("Error fetching site data.");
         } finally {
            setLoading(false);
         }
      };
      loadAllData();
   }, []);

   const saveMainContent = async (updatedData) => {
      try {
         setSaving(true);
         const author = userData?.name || "Super Admin";
         const dataToSave = {
            ...updatedData,
            lastUpdatedBy: author,
            updatedAt: new Date().toISOString()
         };
         await siteContentService.updateContent(dataToSave);
         setContent(dataToSave);
         success("Marketing content saved successfully!");
         setEditSection(null);
      } catch (err) {
         error("Failed to save changes.");
      } finally {
         setSaving(false);
      }
   };

   // Reset to absolute default templates
   const handleReset = async () => {
      if (window.confirm("Are you sure you want to reset all landing page texts, features, growth steps, and FAQs to standard default templates? This will overwrite the live database.")) {
         try {
            setSaving(true);
            const author = userData?.name || "Super Admin";
            const defaults = {
               ...initialContent,
               lastUpdatedBy: author,
               updatedAt: new Date().toISOString()
            };
            await siteContentService.updateContent(defaults);
            setContent(defaults);
            success("Reset to defaults completed successfully!");
         } catch (err) {
            error("Failed to reset content.");
         } finally {
            setSaving(false);
         }
      }
   };

   // File upload to firebase storage
   const handleLogoUpload = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
         setUploadingImage(true);
         const storageRef = ref(storage, `branding/landing_page_logo_${Date.now()}_${file.name}`);
         const snapshot = await uploadBytes(storageRef, file);
         const url = await getDownloadURL(snapshot.ref);
         
         const updated = { ...content, logoUrl: url };
         await saveMainContent(updated);
         success("Logo uploaded and updated successfully!");
      } catch (err) {
         console.error(err);
         error("Logo upload failed. Check storage bucket setup.");
      } finally {
         setUploadingImage(false);
      }
   };

   // Plan crud
   const handleEditPlan = (plan) => {
      setEditPlanId(plan.id);
      setPlanForm({ ...plan });
   };

   const handleSavePlan = async () => {
      try {
         setSaving(true);
         await setDoc(doc(db, 'subscription_plans', editPlanId), planForm, { merge: true });
         setPlans(prev => prev.map(p => p.id === editPlanId ? { ...p, ...planForm } : p));
         success(`Subscription plan '${planForm.name}' updated!`);
         setEditPlanId(null);
      } catch (err) {
         error("Failed to update plan.");
      } finally {
         setSaving(false);
      }
   };

   // Feature card list modifications
   const handleOpenFeatureForm = (index) => {
      if (index === 'new') {
         setFeatureForm({ title: '', description: '', icon: 'User' });
         setEditFeatureIdx('new');
      } else {
         setFeatureForm({ ...content.features[index] });
         setEditFeatureIdx(index);
      }
   };

   const handleSaveFeature = async () => {
      if (!featureForm.title || !featureForm.description) {
         error("Title and description are required!");
         return;
      }
      let updatedFeatures = [...(content.features || [])];
      if (editFeatureIdx === 'new') {
         updatedFeatures.push(featureForm);
      } else {
         updatedFeatures[editFeatureIdx] = featureForm;
      }
      const updated = { ...content, features: updatedFeatures };
      await saveMainContent(updated);
      setEditFeatureIdx(null);
   };

   const handleDeleteFeature = async (idx) => {
      if (window.confirm("Are you sure you want to delete this feature card?")) {
         const updatedFeatures = content.features.filter((_, i) => i !== idx);
         const updated = { ...content, features: updatedFeatures };
         await saveMainContent(updated);
      }
   };

   // FAQ modifications
   const handleOpenFaqForm = (index) => {
      if (index === 'new') {
         setFaqForm({ question: '', answer: '' });
         setEditFaqIdx('new');
      } else {
         setFaqForm({ ...content.faqs[index] });
         setEditFaqIdx(index);
      }
   };

   const handleSaveFaq = async () => {
      if (!faqForm.question || !faqForm.answer) {
         error("Question and answer are required!");
         return;
      }
      let updatedFaqs = [...(content.faqs || [])];
      if (editFaqIdx === 'new') {
         updatedFaqs.push(faqForm);
      } else {
         updatedFaqs[editFaqIdx] = faqForm;
      }
      const updated = { ...content, faqs: updatedFaqs };
      await saveMainContent(updated);
      setEditFaqIdx(null);
   };

   const handleDeleteFaq = async (idx) => {
      if (window.confirm("Are you sure you want to delete this FAQ?")) {
         const updatedFaqs = content.faqs.filter((_, i) => i !== idx);
         const updated = { ...content, faqs: updatedFaqs };
         await saveMainContent(updated);
      }
   };

   // Drag-like order shifts for lists
   const handleMoveFaq = async (idx, direction) => {
      let updatedFaqs = [...content.faqs];
      if (direction === 'up' && idx > 0) {
         const temp = updatedFaqs[idx];
         updatedFaqs[idx] = updatedFaqs[idx - 1];
         updatedFaqs[idx - 1] = temp;
      } else if (direction === 'down' && idx < updatedFaqs.length - 1) {
         const temp = updatedFaqs[idx];
         updatedFaqs[idx] = updatedFaqs[idx + 1];
         updatedFaqs[idx + 1] = temp;
      } else {
         return;
      }
      const updated = { ...content, faqs: updatedFaqs };
      await saveMainContent(updated);
   };

   if (loading) {
      return (
         <DashboardLayout>
            <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
               <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
               <p className="text-slate-500 font-semibold text-sm">Loading marketing manager...</p>
            </div>
         </DashboardLayout>
      );
   }

   // Format Date helper
   const formatDate = (isoString) => {
      if (!isoString) return "Not published yet";
      let date;
      if (typeof isoString === 'object' && isoString.toDate && typeof isoString.toDate === 'function') {
         date = isoString.toDate();
      } else if (typeof isoString === 'object' && isoString.seconds) {
         date = new Date(isoString.seconds * 1000);
      } else {
         date = new Date(isoString);
      }
      if (isNaN(date.getTime())) {
         return "Not published yet";
      }
      try {
         return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
         });
      } catch (e) {
         console.error("Error formatting date:", e);
         return "Not published yet";
      }
   };

   // Format Date Only helper
   const formatDateOnly = (isoString) => {
      if (!isoString) return "Jun 7, 2026";
      let date;
      if (typeof isoString === 'object' && isoString.toDate && typeof isoString.toDate === 'function') {
         date = isoString.toDate();
      } else if (typeof isoString === 'object' && isoString.seconds) {
         date = new Date(isoString.seconds * 1000);
      } else {
         date = new Date(isoString);
      }
      if (isNaN(date.getTime())) {
         return "Jun 7, 2026";
      }
      try {
         return date.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
         });
      } catch (e) {
         console.error("Error formatting date only:", e);
         return "Jun 7, 2026";
      }
   };

   // List of high-level sections in the 'General Text' table
    const sectionsList = [
      {
         id: 'hero',
         title: 'Hero Section',
         description: 'Manage headline, subheadline, description, and CTA buttons on the landing page hero.',
         icon: Layout,
         iconColor: 'bg-teal-50 text-teal-600 border border-teal-100',
         iconChar: 'T',
         lastUpdated: content.updatedAt ? formatDate(content.updatedAt) : 'Jun 7, 2026 10:24 AM',
         updatedBy: content.lastUpdatedBy || 'Jebin',
         status: 'Published'
      },
      {
         id: 'ecosystem',
         title: 'Core Ecosystem',
         description: 'Manage the section title, subtitle, and all feature cards in the ecosystem area.',
         icon: ImageIcon,
         iconColor: 'bg-purple-50 text-purple-600 border border-purple-100',
         iconChar: '▩',
         lastUpdated: content.updatedAt ? formatDate(content.updatedAt) : 'Jun 6, 2026 05:15 PM',
         updatedBy: content.lastUpdatedBy || 'Mary Wanjiku',
         status: 'Published'
      },
      {
         id: 'pricing',
         title: 'Pricing Section',
         description: 'Update pricing header, plans, features, and buttons for all pricing cards.',
         icon: CreditCard,
         iconColor: 'bg-orange-50 text-orange-600 border border-orange-100',
         iconChar: '$',
         lastUpdated: content.updatedAt ? formatDate(content.updatedAt) : 'Jun 7, 2026 09:40 AM',
         updatedBy: content.lastUpdatedBy || 'Jebin',
         status: 'Published'
      },
      {
         id: 'growth',
         title: 'Growth Steps',
         description: 'Manage the 3-step process section (Evaluation, Verification, Growth).',
         icon: TrendingUp,
         iconColor: 'bg-blue-50 text-blue-600 border border-blue-100',
         iconChar: '📈',
         lastUpdated: content.updatedAt ? formatDate(content.updatedAt) : 'Jun 5, 2026 11:30 AM',
         updatedBy: content.lastUpdatedBy || 'Mary Wanjiku',
         status: 'Published'
      },
      {
         id: 'faqs_section',
         title: 'FAQs',
         description: 'Add, edit, or reorder frequently asked questions and their answers.',
         icon: HelpCircle,
         iconColor: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
         iconChar: '?',
         lastUpdated: content.updatedAt ? formatDate(content.updatedAt) : 'Jun 4, 2026 03:22 PM',
         updatedBy: content.lastUpdatedBy || 'Alice Otieno',
         status: 'Published'
      },
      {
         id: 'images_section',
         title: 'Images & Logo',
         description: 'Upload and manage logos, hero visuals, and other images used on the website.',
         icon: ImageIcon,
         iconColor: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
         iconChar: '🖼',
         lastUpdated: content.updatedAt ? formatDate(content.updatedAt) : 'Jun 3, 2026 02:18 PM',
         updatedBy: content.lastUpdatedBy || 'Jebin',
         status: 'Published'
      }
   ];

   return (
      <DashboardLayout>
         <div className="space-y-8 max-w-[1600px] mx-auto pb-10 px-4">
            
            {/* Header Mockup */}
            <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
               <div>
                  <h1 className="text-3xl font-extrabold text-slate-950 tracking-tight">Site Content</h1>
                  <p className="text-slate-500 text-sm mt-1.5 font-medium">Manage all public website content and keep your landing page up to date.</p>
               </div>
               <div className="flex items-center gap-3">
                  <a
                     href="/"
                     target="_blank"
                     rel="noopener noreferrer"
                     className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0052FF] text-white font-semibold text-sm rounded-xl hover:bg-blue-600 transition-all shadow-md shadow-blue-200/50 active:scale-95 shrink-0"
                  >
                     Preview Website <ExternalLink className="h-4 w-4" />
                  </a>
               </div>
            </header>

            {/* TAB SELECTOR PILL SYSTEM */}
            <div className="flex flex-wrap bg-slate-100/70 p-1.5 rounded-2xl gap-1 max-w-2xl border border-slate-200/20">
               {[
                  { key: 'general', label: 'General Text' },
                  { key: 'images', label: 'Images & Logo' },
                  { key: 'features', label: 'Features Grid' },
                  { key: 'pricing', label: 'Pricing Plans' },
                  { key: 'faqs', label: 'FAQs' }
               ].map(tab => (
                  <button
                     key={tab.key}
                     onClick={() => setActiveTab(tab.key)}
                     className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        activeTab === tab.key 
                        ? 'bg-white text-slate-900 shadow-md shadow-slate-200/40 border border-slate-100' 
                        : 'text-slate-500 hover:text-slate-900 hover:bg-white/40'
                     }`}
                  >
                     {tab.label}
                  </button>
               ))}
            </div>

            {/* MAIN TAB SWITCHER */}
            <div className="min-h-[50vh]">
               {activeTab === 'general' && (
                  <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                     <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                           <thead>
                              <tr className="border-b border-slate-50 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">
                                 <th className="py-5 px-8">Section</th>
                                 <th className="py-5 px-6">Description</th>
                                 <th className="py-5 px-6">Last Updated</th>
                                 <th className="py-5 px-6">Status</th>
                                 <th className="py-5 px-8 text-right">Actions</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-50 text-sm">
                              {sectionsList.map(sec => (
                                 <tr key={sec.id} className="hover:bg-slate-50/50 transition-all group">
                                    {/* Section Info with Circle Icon */}
                                    <td className="py-5 px-8 font-bold text-slate-900">
                                       <div className="flex items-center gap-4">
                                          <div className={`h-10 w-10 ${sec.iconColor} rounded-xl flex items-center justify-center font-bold shadow-sm shrink-0`}>
                                             {sec.id === 'ecosystem' ? (
                                                <LayoutGrid className="h-5 w-5" />
                                             ) : sec.id === 'growth' ? (
                                                <TrendingUp className="h-5 w-5" />
                                             ) : sec.id === 'images_section' ? (
                                                <ImageIcon className="h-5 w-5" />
                                             ) : (
                                                <span className="text-base font-semibold">{sec.iconChar}</span>
                                             )}
                                          </div>
                                          <span className="font-semibold text-slate-900">{sec.title}</span>
                                       </div>
                                    </td>
                                    {/* Description */}
                                    <td className="py-5 px-6 text-slate-500 max-w-xs font-medium">
                                       {sec.description}
                                    </td>
                                    {/* Last Updated */}
                                    <td className="py-5 px-6">
                                       <div className="font-semibold text-slate-800 text-xs">{sec.lastUpdated}</div>
                                       <div className="text-[10px] text-slate-400 mt-0.5">by {sec.updatedBy}</div>
                                    </td>
                                    {/* Status Badge */}
                                    <td className="py-5 px-6">
                                       <span className="inline-flex items-center px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-lg uppercase tracking-wider">
                                          {sec.status}
                                       </span>
                                    </td>
                                    {/* Action button triggers */}
                                    <td className="py-5 px-8 text-right">
                                       <div className="flex items-center justify-end gap-2">
                                          <button
                                             onClick={() => {
                                                if (sec.id === 'faqs_section') setActiveTab('faqs');
                                                else if (sec.id === 'images_section') setActiveTab('images');
                                                else setEditSection(sec.id);
                                             }}
                                             className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 rounded-xl text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all text-xs font-semibold shadow-sm active:scale-95 shrink-0"
                                          >
                                             <Edit className="h-3.5 w-3.5 text-slate-400" /> Edit
                                          </button>
                                          <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all shrink-0">
                                             <MoreVertical className="h-4 w-4" />
                                          </button>
                                       </div>
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>

                     {/* Sub-table reset button */}
                     <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                        <p className="text-xs text-slate-400 font-medium">To revert all live landing page dynamic arrays and texts back to system defaults, use the reset action.</p>
                        <button
                           onClick={handleReset}
                           className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all text-xs font-semibold bg-white active:scale-95 shadow-sm"
                        >
                           <RotateCcw className="h-3.5 w-3.5 text-slate-400" /> Reset Templates
                        </button>
                     </div>
                  </div>
               )}

               {activeTab === 'images' && (
                  <div className="grid md:grid-cols-2 gap-8">
                     <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm space-y-6">
                        <div className="flex items-center gap-4 mb-2 pb-4 border-b border-slate-50">
                           <div className="h-10 w-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center">
                              🖼
                           </div>
                           <h2 className="text-xl font-bold text-slate-900">Logo Management</h2>
                        </div>

                        <div className="space-y-4">
                           <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block ml-1">Current Branding Logo</label>
                           <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center gap-4 relative">
                              {content.logoUrl ? (
                                 <img src={content.logoUrl} alt="Live Logo" className="h-16 object-contain p-2 bg-white rounded-xl shadow-sm" />
                              ) : (
                                 <img src="/logo.png" alt="Fallback Logo" className="h-16 object-contain p-2 bg-white rounded-xl shadow-sm" />
                              )}
                              <p className="text-xs text-slate-400 font-medium">Rendered dynamically at the top navbar and footer</p>
                           </div>

                           <div className="space-y-2">
                              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block ml-1">Direct Logo URL</label>
                              <input
                                 type="text"
                                 value={content.logoUrl}
                                 onChange={(e) => setContent({ ...content, logoUrl: e.target.value })}
                                 placeholder="https://example.com/logo.png"
                                 className="w-full px-5 py-4 bg-slate-50 border border-slate-100 focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all text-sm font-semibold text-slate-800"
                              />
                           </div>

                           <div className="pt-2">
                              <label className="flex items-center justify-center gap-2 w-full px-6 py-4 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 font-bold text-sm tracking-wide transition-all cursor-pointer shadow-lg active:scale-98">
                                 {uploadingImage ? (
                                    <>
                                       <Loader2 className="animate-spin h-5 w-5" /> Uploading...
                                    </>
                                 ) : (
                                    <>
                                       <Upload className="h-5 w-5" /> Upload New File
                                    </>
                                 )}
                                 <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoUpload}
                                    className="hidden"
                                    disabled={uploadingImage}
                                 />
                              </label>
                           </div>
                        </div>
                     </div>

                     <div className="space-y-8 text-center bg-teal-600 rounded-[2.5rem] p-10 text-white flex flex-col justify-center items-center">
                        <div className="h-16 w-16 bg-white/20 rounded-3xl flex items-center justify-center mb-6">
                           <Globe className="h-8 w-8" />
                        </div>
                        <h3 className="text-2xl font-bold tracking-tight">Real-time Image Assets</h3>
                        <p className="text-teal-50 leading-relaxed text-sm max-w-xs">
                           Uploading files automatically stores them inside your Firebase Storage bucket under "branding/" and links it directly to the Landing Page.
                        </p>
                        <button
                           onClick={() => saveMainContent(content)}
                           disabled={saving}
                           className="mt-6 flex items-center gap-2 px-6 py-3 bg-white text-teal-700 font-extrabold text-xs uppercase tracking-widest rounded-xl hover:bg-teal-50 transition-all shadow-xl active:scale-95 disabled:opacity-50"
                        >
                           <Save className="h-4 w-4" /> Save Asset Settings
                        </button>
                     </div>
                  </div>
               )}

               {activeTab === 'features' && (
                  <div className="space-y-6">
                     <div className="flex items-center justify-between">
                        <div>
                           <h2 className="text-xl font-bold text-slate-900">Features Grid Cards</h2>
                           <p className="text-slate-500 text-xs mt-0.5">Manage key module highlights displayed in the live grid ecosystem.</p>
                        </div>
                        <button
                           onClick={() => handleOpenFeatureForm('new')}
                           className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                        >
                           <Plus className="h-4 w-4" /> Add Feature Card
                        </button>
                     </div>

                     <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {(content.features || []).map((feat, idx) => (
                           <div key={idx} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative group hover:shadow-xl transition-all flex flex-col justify-between">
                              <div>
                                 <div className="flex items-center justify-between mb-4">
                                    <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center text-teal-600 shadow-inner group-hover:bg-teal-600 group-hover:text-white transition-all">
                                       <RenderIcon iconName={feat.icon} className="h-5 w-5" />
                                    </div>
                                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                                       <button
                                          onClick={() => handleOpenFeatureForm(idx)}
                                          className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-900 rounded-lg transition-colors"
                                          title="Edit"
                                       >
                                          <Edit className="h-4 w-4" />
                                       </button>
                                       <button
                                          onClick={() => handleDeleteFeature(idx)}
                                          className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                                          title="Delete"
                                       >
                                          <Trash2 className="h-4 w-4" />
                                       </button>
                                    </div>
                                 </div>
                                 <h3 className="font-bold text-slate-900 text-base mb-1">{feat.title}</h3>
                                 <p className="text-slate-500 text-xs leading-relaxed font-semibold">{feat.description}</p>
                              </div>
                              <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                                 <span>Icon: {feat.icon}</span>
                                 <span className="text-teal-500 font-extrabold">Active</span>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               )}

               {activeTab === 'pricing' && (
                  <div className="space-y-6">
                     <div>
                        <h2 className="text-xl font-bold text-slate-900">Subscription Plans</h2>
                        <p className="text-slate-500 text-xs mt-0.5">Edit live facility packages, pricing tiers, and active resource restrictions.</p>
                     </div>

                     <div className="grid md:grid-cols-3 gap-6">
                        {plans.map((plan) => (
                           <div key={plan.id} className={`bg-white rounded-3xl p-8 border shadow-sm flex flex-col justify-between transition-all relative ${
                              plan.featured ? 'border-teal-500 ring-1 ring-teal-500 shadow-teal-50' : 'border-slate-100'
                           }`}>
                              {plan.featured && (
                                 <span className="absolute -top-3.5 left-6 px-3 py-1 bg-teal-500 text-white text-[9px] font-black rounded-full uppercase tracking-wider">
                                    Featured Plan
                                 </span>
                              )}
                              <div>
                                 <h3 className="font-bold text-slate-900 text-xl">{plan.name}</h3>
                                 <p className="text-slate-400 text-xs mt-1 font-semibold">{plan.subtitle}</p>
                                 
                                 <div className="my-6">
                                    <span className="text-3xl font-extrabold text-slate-900">Ksh {plan.price?.toLocaleString()}</span>
                                    <span className="text-slate-400 text-xs font-semibold"> / month</span>
                                 </div>

                                 <ul className="space-y-3 text-slate-600 text-xs font-semibold mb-6">
                                    <li className="flex items-center gap-2">
                                       <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                       {plan.maxLocations === 1 ? 'Single location limit' : `Up to ${plan.maxLocations} locations`}
                                    </li>
                                    <li className="flex items-center gap-2">
                                       <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                       {`Max ${plan.maxStaff} staff profiles`}
                                    </li>
                                    <li className="flex items-center gap-2">
                                       <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                       Full Platform EMR Workflow
                                    </li>
                                 </ul>
                              </div>

                              <button
                                 onClick={() => handleEditPlan(plan)}
                                 className="w-full py-3 border border-slate-200 hover:bg-slate-900 hover:text-white rounded-xl text-xs font-bold tracking-wider uppercase transition-all shadow-sm active:scale-95 bg-white"
                              >
                                 Edit Plan details
                              </button>
                           </div>
                        ))}
                     </div>
                  </div>
               )}

               {activeTab === 'faqs' && (
                  <div className="space-y-6">
                     <div className="flex items-center justify-between">
                        <div>
                           <h2 className="text-xl font-bold text-slate-900">Frequently Asked Questions</h2>
                           <p className="text-slate-500 text-xs mt-0.5 font-medium">Add, sort, and edit core FAQ dropdown cards.</p>
                        </div>
                        <button
                           onClick={() => handleOpenFaqForm('new')}
                           className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                        >
                           <Plus className="h-4 w-4" /> Add FAQ Card
                        </button>
                     </div>

                     <div className="space-y-4">
                        {(content.faqs || []).map((faq, idx) => (
                           <div key={idx} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-start justify-between gap-4 group">
                              <div className="space-y-2">
                                 <h3 className="font-semibold text-slate-900 text-base flex items-center gap-3">
                                    <span className="text-xs font-black text-slate-200">Q{idx + 1}</span>
                                    {faq.question}
                                 </h3>
                                 <p className="text-slate-500 text-sm leading-relaxed font-semibold pl-8">{faq.answer}</p>
                              </div>
                              
                              <div className="flex items-center gap-1 shrink-0">
                                 {/* Ordering Shift buttons */}
                                 <button
                                    onClick={() => handleMoveFaq(idx, 'up')}
                                    disabled={idx === 0}
                                    className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-800 disabled:opacity-30 rounded-lg"
                                 >
                                    <ChevronUp className="h-4 w-4" />
                                 </button>
                                 <button
                                    onClick={() => handleMoveFaq(idx, 'down')}
                                    disabled={idx === (content.faqs || []).length - 1}
                                    className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-800 disabled:opacity-30 rounded-lg"
                                 >
                                    <ChevronDown className="h-4 w-4" />
                                 </button>

                                 <div className="h-4 w-px bg-slate-100 mx-1" />

                                 <button
                                    onClick={() => handleOpenFaqForm(idx)}
                                    className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-900 rounded-lg transition-colors"
                                 >
                                    <Edit className="h-4 w-4" />
                                 </button>
                                 <button
                                    onClick={() => handleDeleteFaq(idx)}
                                    className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                                 >
                                    <Trash2 className="h-4 w-4" />
                                 </button>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               )}
            </div>
            {/* SITE SUMMARY FOOTER MOCKUP SECTION */}
            <div className="pt-8 border-t border-slate-100">
               <h3 className="text-lg font-bold text-slate-900 mb-6">Site Summary</h3>
               <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                     { 
                        largeText: '6', 
                        title: 'Content Sections', 
                        note: 'Total managed sections', 
                        icon: FileText, 
                        color: 'bg-blue-50 text-blue-600 border border-blue-100' 
                     },
                     { 
                        largeText: '6', 
                        title: 'Published', 
                        note: 'Live on website', 
                        icon: CheckCircle2, 
                        color: 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                     },
                     { 
                        largeText: '0', 
                        title: 'Drafts', 
                        note: 'Unpublished changes', 
                        icon: Clock, 
                        color: 'bg-orange-50 text-orange-600 border border-orange-100' 
                     },
                     { 
                        largeText: content.updatedAt ? formatDateOnly(content.updatedAt) : 'Jun 7, 2026', 
                        title: 'Last Published', 
                        note: 'Most recent update', 
                        icon: Calendar, 
                        color: 'bg-red-50 text-red-600 border border-red-100' 
                     }
                  ].map((card, idx) => {
                     const isLong = card.largeText.length > 5;
                     return (
                        <div key={idx} className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all min-h-[112px] w-full">
                           <div className={`h-14 w-14 ${card.color} rounded-2xl flex items-center justify-center shadow-inner shrink-0`}>
                              <card.icon className="h-6 w-6" />
                           </div>
                           <div className="flex flex-col justify-center min-w-0">
                              <div className={`${isLong ? 'text-xl md:text-2xl' : 'text-3xl'} font-black text-slate-900 tracking-tight leading-none`}>
                                 {card.largeText}
                              </div>
                              <div className="text-slate-900 font-bold text-sm mt-1.5 leading-none">{card.title}</div>
                              <div className="text-[10px] text-slate-500 font-semibold mt-1 leading-none">{card.note}</div>
                           </div>
                        </div>
                     );
                  })}
               </div>
            </div>

            {/* MODALS SECTION (ANIMEPRESENCE / FRAMER MOTION PORTAL) */}
            <AnimatePresence>
               {/* Hero Edit Modal */}
               {editSection === 'hero' && (
                  <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[99] flex items-center justify-center p-4">
                     <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }} 
                        animate={{ opacity: 1, scale: 1 }} 
                        exit={{ opacity: 0, scale: 0.95 }} 
                        className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-8 w-full max-w-2xl max-h-[85vh] overflow-y-auto space-y-6"
                     >
                        <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                           <h3 className="text-2xl font-bold text-slate-900">Edit Hero Section</h3>
                           <button onClick={() => setEditSection(null)} className="p-2 text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
                        </div>
                        
                        <div className="space-y-4">
                           <div>
                              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2 ml-1">Hero Eyebrow Badge</label>
                              <input
                                 type="text"
                                 value={content.heroBadge}
                                 onChange={(e) => setContent({ ...content, heroBadge: e.target.value })}
                                 className="w-full px-5 py-4 bg-slate-50 border border-slate-100 focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all text-sm font-semibold text-slate-800"
                              />
                           </div>
                           <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                 <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2 ml-1">Title Line 1</label>
                                 <input
                                    type="text"
                                    value={content.heroTitleLine1}
                                    onChange={(e) => setContent({ ...content, heroTitleLine1: e.target.value })}
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all text-sm font-semibold text-slate-800"
                                 />
                              </div>
                              <div>
                                 <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2 ml-1">Highlight 1</label>
                                 <input
                                    type="text"
                                    value={content.heroTitleHighlight1}
                                    onChange={(e) => setContent({ ...content, heroTitleHighlight1: e.target.value })}
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all text-sm font-semibold text-slate-800"
                                 />
                              </div>
                           </div>
                           <div>
                              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2 ml-1">Highlight 2</label>
                              <input
                                 type="text"
                                 value={content.heroTitleHighlight2}
                                 onChange={(e) => setContent({ ...content, heroTitleHighlight2: e.target.value })}
                                 className="w-full px-5 py-4 bg-slate-50 border border-slate-100 focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all text-sm font-semibold text-slate-800"
                              />
                           </div>
                           <div>
                              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2 ml-1">Hero Description</label>
                              <textarea
                                 value={content.heroBody}
                                 onChange={(e) => setContent({ ...content, heroBody: e.target.value })}
                                 rows={4}
                                 className="w-full px-5 py-4 bg-slate-50 border border-slate-100 focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all text-sm font-semibold text-slate-800"
                              />
                           </div>
                           <div>
                              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2 ml-1">Footer Italics Note</label>
                              <input
                                 type="text"
                                 value={content.heroNote}
                                 onChange={(e) => setContent({ ...content, heroNote: e.target.value })}
                                 className="w-full px-5 py-4 bg-slate-50 border border-slate-100 focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all text-sm font-semibold text-slate-800"
                              />
                           </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-50">
                           <button onClick={() => setEditSection(null)} className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold tracking-wider uppercase bg-white">Cancel</button>
                           <button onClick={() => saveMainContent(content)} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold tracking-wider uppercase hover:bg-slate-800 transition-all flex items-center gap-2">
                              <Save className="h-4 w-4" /> Save Changes
                           </button>
                        </div>
                     </motion.div>
                  </div>
               )}

               {/* Ecosystem Edit Modal */}
               {editSection === 'ecosystem' && (
                  <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[99] flex items-center justify-center p-4">
                     <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }} 
                        animate={{ opacity: 1, scale: 1 }} 
                        exit={{ opacity: 0, scale: 0.95 }} 
                        className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-8 w-full max-w-xl space-y-6"
                     >
                        <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                           <h3 className="text-2xl font-bold text-slate-900">Edit Ecosystem Header</h3>
                           <button onClick={() => setEditSection(null)} className="p-2 text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
                        </div>
                        
                        <div className="space-y-4">
                           <div>
                              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2 ml-1">Eyebrow Heading</label>
                              <input
                                 type="text"
                                 value={content.ecosystemEyebrow}
                                 onChange={(e) => setContent({ ...content, ecosystemEyebrow: e.target.value })}
                                 className="w-full px-5 py-4 bg-slate-50 border border-slate-100 focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all text-sm font-semibold text-slate-800"
                              />
                           </div>
                           <div>
                              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2 ml-1">Main Heading</label>
                              <input
                                 type="text"
                                 value={content.ecosystemTitle}
                                 onChange={(e) => setContent({ ...content, ecosystemTitle: e.target.value })}
                                 className="w-full px-5 py-4 bg-slate-50 border border-slate-100 focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all text-sm font-semibold text-slate-800"
                              />
                           </div>
                           <div>
                              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2 ml-1">Description Subtitle</label>
                              <textarea
                                 value={content.ecosystemBody}
                                 onChange={(e) => setContent({ ...content, ecosystemBody: e.target.value })}
                                 rows={4}
                                 className="w-full px-5 py-4 bg-slate-50 border border-slate-100 focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all text-sm font-semibold text-slate-800"
                              />
                           </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-50">
                           <button onClick={() => setEditSection(null)} className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold tracking-wider uppercase bg-white">Cancel</button>
                           <button onClick={() => { setActiveTab('features'); setEditSection(null); }} className="px-5 py-2.5 border border-blue-200 text-blue-600 hover:bg-blue-50 rounded-xl text-xs font-bold tracking-wider uppercase bg-white flex items-center gap-1">Manage feature cards <ArrowRight className="h-3 w-3" /></button>
                           <button onClick={() => saveMainContent(content)} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold tracking-wider uppercase hover:bg-slate-800 transition-all flex items-center gap-2">
                              <Save className="h-4 w-4" /> Save Changes
                           </button>
                        </div>
                     </motion.div>
                  </div>
               )}

               {/* Pricing Section Edit Modal */}
               {editSection === 'pricing' && (
                  <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[99] flex items-center justify-center p-4">
                     <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }} 
                        animate={{ opacity: 1, scale: 1 }} 
                        exit={{ opacity: 0, scale: 0.95 }} 
                        className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-8 w-full max-w-xl space-y-6"
                     >
                        <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                           <h3 className="text-2xl font-bold text-slate-900">Edit Pricing Header</h3>
                           <button onClick={() => setEditSection(null)} className="p-2 text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
                        </div>
                        
                        <div className="space-y-4">
                           <div>
                              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2 ml-1">Eyebrow Heading</label>
                              <input
                                 type="text"
                                 value={content.pricingEyebrow}
                                 onChange={(e) => setContent({ ...content, pricingEyebrow: e.target.value })}
                                 className="w-full px-5 py-4 bg-slate-50 border border-slate-100 focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all text-sm font-semibold text-slate-800"
                              />
                           </div>
                           <div>
                              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2 ml-1">Main Heading</label>
                              <input
                                 type="text"
                                 value={content.pricingTitle}
                                 onChange={(e) => setContent({ ...content, pricingTitle: e.target.value })}
                                 className="w-full px-5 py-4 bg-slate-50 border border-slate-100 focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all text-sm font-semibold text-slate-800"
                              />
                           </div>
                           <div>
                              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2 ml-1">Description Subtitle</label>
                              <textarea
                                 value={content.pricingNote}
                                 onChange={(e) => setContent({ ...content, pricingNote: e.target.value })}
                                 rows={4}
                                 className="w-full px-5 py-4 bg-slate-50 border border-slate-100 focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all text-sm font-semibold text-slate-800"
                              />
                           </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-50">
                           <button onClick={() => setEditSection(null)} className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold tracking-wider uppercase bg-white">Cancel</button>
                           <button onClick={() => { setActiveTab('pricing'); setEditSection(null); }} className="px-5 py-2.5 border border-blue-200 text-blue-600 hover:bg-blue-50 rounded-xl text-xs font-bold tracking-wider uppercase bg-white flex items-center gap-1">Manage Pricing Tiers <ArrowRight className="h-3 w-3" /></button>
                           <button onClick={() => saveMainContent(content)} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold tracking-wider uppercase hover:bg-slate-800 transition-all flex items-center gap-2">
                              <Save className="h-4 w-4" /> Save Changes
                           </button>
                        </div>
                     </motion.div>
                  </div>
               )}

               {/* Growth Steps Edit Modal */}
               {editSection === 'growth' && (
                  <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[99] flex items-center justify-center p-4">
                     <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }} 
                        animate={{ opacity: 1, scale: 1 }} 
                        exit={{ opacity: 0, scale: 0.95 }} 
                        className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto space-y-6"
                     >
                        <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                           <h3 className="text-2xl font-bold text-slate-900">Edit Growth Steps (Facility Journey)</h3>
                           <button onClick={() => setEditSection(null)} className="p-2 text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
                        </div>
                        
                        <div className="space-y-6 divide-y divide-slate-100">
                           {(content.growthSteps || []).map((step, idx) => (
                              <div key={idx} className="pt-6 first:pt-0 space-y-4">
                                 <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Stage {step.step}</div>
                                 <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                       <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2 ml-1">Title</label>
                                       <input
                                          type="text"
                                          value={step.title}
                                          onChange={(e) => {
                                             let updatedSteps = [...content.growthSteps];
                                             updatedSteps[idx].title = e.target.value;
                                             setContent({ ...content, growthSteps: updatedSteps });
                                          }}
                                          className="w-full px-5 py-4 bg-slate-50 border border-slate-100 focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all text-sm font-semibold text-slate-800"
                                       />
                                    </div>
                                    <div>
                                       <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2 ml-1">Icon Name</label>
                                       <select
                                          value={step.icon}
                                          onChange={(e) => {
                                             let updatedSteps = [...content.growthSteps];
                                             updatedSteps[idx].icon = e.target.value;
                                             setContent({ ...content, growthSteps: updatedSteps });
                                          }}
                                          className="w-full px-5 py-4 bg-slate-50 border border-slate-100 focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all text-sm font-semibold text-slate-800"
                                       >
                                          {AVAILABLE_ICONS.map(ic => (
                                             <option key={ic} value={ic}>{ic}</option>
                                          ))}
                                       </select>
                                    </div>
                                 </div>
                                 <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2 ml-1">Description Body</label>
                                    <textarea
                                       value={step.body}
                                       onChange={(e) => {
                                          let updatedSteps = [...content.growthSteps];
                                          updatedSteps[idx].body = e.target.value;
                                          setContent({ ...content, growthSteps: updatedSteps });
                                       }}
                                       rows={3}
                                       className="w-full px-5 py-4 bg-slate-50 border border-slate-100 focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all text-sm font-semibold text-slate-800"
                                    />
                                 </div>
                              </div>
                           ))}
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                           <button onClick={() => setEditSection(null)} className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold tracking-wider uppercase bg-white">Cancel</button>
                           <button onClick={() => saveMainContent(content)} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold tracking-wider uppercase hover:bg-slate-800 transition-all flex items-center gap-2">
                              <Save className="h-4 w-4" /> Save Changes
                           </button>
                        </div>
                     </motion.div>
                  </div>
               )}

               {/* Feature Edit Form Modal */}
               {editFeatureIdx !== null && (
                  <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[99] flex items-center justify-center p-4">
                     <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }} 
                        animate={{ opacity: 1, scale: 1 }} 
                        exit={{ opacity: 0, scale: 0.95 }} 
                        className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-8 w-full max-w-xl space-y-6"
                     >
                        <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                           <h3 className="text-2xl font-bold text-slate-900">{editFeatureIdx === 'new' ? 'Add New Feature' : 'Edit Feature Card'}</h3>
                           <button onClick={() => setEditFeatureIdx(null)} className="p-2 text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
                        </div>

                        <div className="space-y-4">
                           <div>
                              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2 ml-1">Feature Title</label>
                              <input
                                 type="text"
                                 value={featureForm.title}
                                 onChange={(e) => setFeatureForm({ ...featureForm, title: e.target.value })}
                                 className="w-full px-5 py-4 bg-slate-50 border border-slate-100 focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all text-sm font-semibold text-slate-800"
                                 placeholder="e.g. Intelligent Scheduling"
                              />
                           </div>
                           
                           <div>
                              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2 ml-1">Icon Selection</label>
                              <div className="grid grid-cols-6 gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100 max-h-40 overflow-y-auto">
                                 {AVAILABLE_ICONS.map(iconName => (
                                    <button
                                       key={iconName}
                                       type="button"
                                       onClick={() => setFeatureForm({ ...featureForm, icon: iconName })}
                                       className={`h-12 rounded-xl flex items-center justify-center transition-all ${
                                          featureForm.icon === iconName 
                                          ? 'bg-blue-600 text-white shadow-md' 
                                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-100'
                                       }`}
                                       title={iconName}
                                    >
                                       <RenderIcon iconName={iconName} className="h-5 w-5" />
                                    </button>
                                 ))}
                              </div>
                           </div>

                           <div>
                              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2 ml-1">Description</label>
                              <textarea
                                 value={featureForm.description}
                                 onChange={(e) => setFeatureForm({ ...featureForm, description: e.target.value })}
                                 rows={4}
                                 className="w-full px-5 py-4 bg-slate-50 border border-slate-100 focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all text-sm font-semibold text-slate-800"
                                 placeholder="Provide a concise description of this modules capabilities..."
                              />
                           </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-50">
                           <button onClick={() => setEditFeatureIdx(null)} className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold tracking-wider uppercase bg-white">Cancel</button>
                           <button onClick={handleSaveFeature} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold tracking-wider uppercase hover:bg-slate-800 transition-all flex items-center gap-2">
                              <Save className="h-4 w-4" /> Save Feature
                           </button>
                        </div>
                     </motion.div>
                  </div>
               )}

               {/* Subscription Plan Edit Modal */}
               {editPlanId !== null && (
                  <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[99] flex items-center justify-center p-4">
                     <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }} 
                        animate={{ opacity: 1, scale: 1 }} 
                        exit={{ opacity: 0, scale: 0.95 }} 
                        className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-8 w-full max-w-xl space-y-6"
                     >
                        <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                           <h3 className="text-2xl font-bold text-slate-900">Edit Pricing Plan</h3>
                           <button onClick={() => setEditPlanId(null)} className="p-2 text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
                        </div>

                        <div className="space-y-4">
                           <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                 <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2 ml-1">Plan Name</label>
                                 <input
                                    type="text"
                                    value={planForm.name}
                                    onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all text-sm font-semibold text-slate-800"
                                 />
                              </div>
                              <div>
                                 <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2 ml-1">Price (KES / Month)</label>
                                 <input
                                    type="number"
                                    value={planForm.price}
                                    onChange={(e) => setPlanForm({ ...planForm, price: Number(e.target.value) })}
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all text-sm font-semibold text-slate-800"
                                 />
                              </div>
                           </div>
                           <div>
                              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2 ml-1">Subtitle</label>
                              <input
                                 type="text"
                                 value={planForm.subtitle}
                                 onChange={(e) => setPlanForm({ ...planForm, subtitle: e.target.value })}
                                 className="w-full px-5 py-4 bg-slate-50 border border-slate-100 focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all text-sm font-semibold text-slate-800"
                              />
                           </div>
                           <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                 <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2 ml-1">Max Staff Users</label>
                                 <input
                                    type="number"
                                    value={planForm.maxStaff}
                                    onChange={(e) => setPlanForm({ ...planForm, maxStaff: Number(e.target.value) })}
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all text-sm font-semibold text-slate-800"
                                 />
                              </div>
                              <div>
                                 <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2 ml-1">Max Locations</label>
                                 <input
                                    type="number"
                                    value={planForm.maxLocations}
                                    onChange={(e) => setPlanForm({ ...planForm, maxLocations: Number(e.target.value) })}
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all text-sm font-semibold text-slate-800"
                                 />
                              </div>
                           </div>

                           <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                              <div>
                                 <div className="text-sm font-bold text-slate-800">Featured Tag</div>
                                 <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Highlight this plan on the public landing page</div>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                 <input
                                    type="checkbox"
                                    checked={planForm.featured}
                                    onChange={(e) => setPlanForm({ ...planForm, featured: e.target.checked })}
                                    className="sr-only peer"
                                 />
                                 <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                              </label>
                           </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-50">
                           <button onClick={() => setEditPlanId(null)} className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold tracking-wider uppercase bg-white">Cancel</button>
                           <button onClick={handleSavePlan} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold tracking-wider uppercase hover:bg-slate-800 transition-all flex items-center gap-2">
                              <Save className="h-4 w-4" /> Save Plan
                           </button>
                        </div>
                     </motion.div>
                  </div>
               )}

               {/* FAQ Edit Modal */}
               {editFaqIdx !== null && (
                  <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[99] flex items-center justify-center p-4">
                     <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }} 
                        animate={{ opacity: 1, scale: 1 }} 
                        exit={{ opacity: 0, scale: 0.95 }} 
                        className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-8 w-full max-w-xl space-y-6"
                     >
                        <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                           <h3 className="text-2xl font-bold text-slate-900">{editFaqIdx === 'new' ? 'Add New FAQ' : 'Edit FAQ'}</h3>
                           <button onClick={() => setEditFaqIdx(null)} className="p-2 text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
                        </div>

                        <div className="space-y-4">
                           <div>
                              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2 ml-1">Question</label>
                              <input
                                 type="text"
                                 value={faqForm.question}
                                 onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                                 className="w-full px-5 py-4 bg-slate-50 border border-slate-100 focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all text-sm font-semibold text-slate-800"
                                 placeholder="e.g. Can I manage multiple branch locations?"
                              />
                           </div>
                           <div>
                              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2 ml-1">Answer</label>
                              <textarea
                                 value={faqForm.answer}
                                 onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                                 rows={5}
                                 className="w-full px-5 py-4 bg-slate-50 border border-slate-100 focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all text-sm font-semibold text-slate-800"
                                 placeholder="Provide a clear, detailed answer to the question..."
                              />
                           </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-50">
                           <button onClick={() => setEditFaqIdx(null)} className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold tracking-wider uppercase bg-white">Cancel</button>
                           <button onClick={handleSaveFaq} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold tracking-wider uppercase hover:bg-slate-800 transition-all flex items-center gap-2">
                              <Save className="h-4 w-4" /> Save FAQ
                           </button>
                        </div>
                     </motion.div>
                  </div>
               )}
            </AnimatePresence>
         </div>
      </DashboardLayout>
   );
}
