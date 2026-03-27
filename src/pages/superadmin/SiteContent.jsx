import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import {
  Save,
  RotateCcw,
  Globe,
  Type,
  Tag,
  FileText,
  Layout,
  CreditCard,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import siteContentService from '../../services/siteContentService';
import { useToast } from '../../contexts/ToastContext';

const initialContent = {
  heroBadge: "Patient care management, done right",
  heroTitleLine1: "Streamline your",
  heroTitleHighlight1: "patient care",
  heroTitleHighlight2: "operations",
  heroBody:
    "HURE Care is the modern operating system for healthcare facility operations, built to help facilities manage appointments, patient records, visit documentation, billing, and daily front-desk-to-provider coordination in one secure system.",
  heroNote: "Experience how modern EMR should feel.",
  pricingEyebrow: "FLEXIBLE PRICING",
  pricingTitle: "Simple, transparent plans",
  pricingNote:
    "Choose the plan that fits your facility's growth. All plans include full EMR workflow access. Scaling is limited only by staff and locations.",
  faqEyebrow: "SUPPORT",
  faqTitle: "Frequently Asked Questions",
  faqBody: "Can't find the answer you're looking for? Reach out to our specialist team.",
  footerBlurb:
    "HURE Care: The intelligent operating system empowering healthcare facilities with streamlined workflows and data-driven coordination.",
};

export default function SiteContent() {
  const [content, setContent] = useState(initialContent);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {
    const loadContent = async () => {
      try {
        const dbContent = await siteContentService.getContent();
        if (dbContent) {
          setContent(prev => ({ ...prev, ...dbContent }));
        }
      } catch (err) {
        console.error("Failed to load content:", err);
      } finally {
        setLoading(false);
      }
    };
    loadContent();
  }, []);

  const handleChange = (key, value) => {
    setContent(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await siteContentService.updateContent(content);
      success("Marketing content updated successfully!");
    } catch (err) {
      error("Failed to update marketing content.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset to defaults? This will not save until you click Save.")) {
      setContent(initialContent);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    );
  }

  const sections = [
    {
      id: 'hero',
      title: 'Hero Section',
      icon: Layout,
      fields: [
        { key: 'heroBadge', label: 'Hero Badge', type: 'text' },
        { key: 'heroTitleLine1', label: 'Title Line 1', type: 'text' },
        { key: 'heroTitleHighlight1', label: 'Title Highlight', type: 'text' },
        { key: 'heroBody', label: 'Description', type: 'textarea' },
        { key: 'heroNote', label: 'Footer Note', type: 'text' },
      ]
    },
    {
      id: 'pricing',
      title: 'Pricing Header',
      icon: CreditCard,
      fields: [
        { key: 'pricingEyebrow', label: 'Eyebrow', type: 'text' },
        { key: 'pricingTitle', label: 'Heading', type: 'text' },
        { key: 'pricingNote', label: 'Sub-description', type: 'textarea' },
      ]
    },
    {
      id: 'faqs',
      title: 'FAQ Header',
      icon: HelpCircle,
      fields: [
        { key: 'faqEyebrow', label: 'Eyebrow', type: 'text' },
        { key: 'faqTitle', label: 'Heading', type: 'text' },
        { key: 'faqBody', label: 'Description', type: 'textarea' },
      ]
    },
    {
      id: 'footer',
      title: 'Global Footer',
      icon: Globe,
      fields: [
        { key: 'footerBlurb', label: 'Company Blurb', type: 'textarea' },
      ]
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Marketing Site Content</h1>
            <p className="text-slate-500 text-sm mt-1">Manage public-facing text and information from one place.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all"
            >
              <RotateCcw className="h-4 w-4" /> Reset
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 disabled:opacity-50"
            >
              {saving ? 'Saving...' : <><Save className="h-4 w-4" /> Save Changes</>}
            </button>
          </div>
        </header>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {sections.map(section => (
              <div key={section.id} className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm">
                <div className="flex items-center gap-4 mb-8 border-b border-slate-50 pb-6">
                  <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center text-teal-600">
                    <section.icon className="h-6 w-6" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">{section.title}</h2>
                </div>

                <div className="space-y-6">
                  {section.fields.map(field => (
                    <div key={field.key} className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">{field.label}</label>
                      {field.type === 'textarea' ? (
                        <textarea
                          value={content[field.key]}
                          onChange={(e) => handleChange(field.key, e.target.value)}
                          rows={4}
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-100 focus:border-teal-500 focus:bg-white rounded-2xl outline-none transition-all text-sm font-medium text-slate-800"
                        />
                      ) : (
                        <input
                          type="text"
                          value={content[field.key]}
                          onChange={(e) => handleChange(field.key, e.target.value)}
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-100 focus:border-teal-500 focus:bg-white rounded-2xl outline-none transition-all text-sm font-medium text-slate-800"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-8 text-center bg-teal-600 rounded-[2.5rem] p-10 text-white">
            <div className="h-16 w-16 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Globe className="h-8 w-8" />
            </div>
            <h3 className="text-2xl font-bold tracking-tight">Live Updates</h3>
            <p className="text-teal-50 leading-relaxed text-sm">
              Changes made here are applied instantly to the public landing page. Be sure to verify all spelling and information before saving.
            </p>
            <div className="pt-8 border-t border-white/10 mt-8">
              <div className="flex items-center justify-between text-xs font-bold tracking-widest uppercase opacity-70 mb-4">
                <span>Current Domain</span>
                <AlertCircle className="h-4 w-4" />
              </div>
              <div className="bg-black/20 p-4 rounded-2xl font-mono text-sm break-all">
                care.gethure.com
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
