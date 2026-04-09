import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import siteContentService from "../../services/siteContentService";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  ChevronDown,
  Layout,
  Calendar,
  FileText,
  CreditCard,
  Globe,
  ShieldCheck,
  ArrowRight,
  User,
  Activity,
  TrendingUp,
  Plus,
  Twitter,
  Linkedin,
  Facebook,
  Instagram
} from "lucide-react";

const initialContent = {
  heroBadge: "Patient care management, done right",
  heroTitleLine1: "Streamline your",
  heroTitleHighlight1: "patient care",
  heroTitleHighlight2: "operations",
  heroBody:
    "HURE Care is the modern operating system for healthcare facility operations, built to help facilities manage appointments, patient records, visit documentation, billing, and daily front-desk-to-provider coordination in one secure system.",
  heroNote: "Experience how modern EMR should feel.",
  pricingIntroTitle: "Ready to modernize your patient care operations?",
  pricingIntroBody:
    "Start your 10-day free trial and experience the full HURE Care workflow across appointments, patient records, and billing coordination.",
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

const featureCards = [
  {
    icon: User,
    title: "Patient Administration",
    description:
      "Centralized patient records, visit history, and care documentation secured with enterprise-grade encryption.",
    span: "lg:col-span-2",
  },
  {
    icon: Calendar,
    title: "Intelligent Scheduling",
    description:
      "Optimize provider calendars and patient flow across single or multi-branch facility operations.",
    span: "lg:col-span-1",
  },
  {
    icon: FileText,
    title: "Clinical Documentation",
    description:
      "Structured SOAP notes and treatment plans designed for clinical speed and precision.",
    span: "lg:col-span-1",
  },
  {
    icon: CreditCard,
    title: "Revenue Cycle",
    description:
      "Automated billing, charges, and payment tracking linked directly to the clinical encounter.",
    span: "lg:col-span-2",
  },
  {
    icon: Globe,
    title: "Multi-Location Control",
    description:
      "Manage branch-level operations with centralized administrative oversight and secure access.",
    span: "lg:col-span-1",
  },
  {
    icon: ShieldCheck,
    title: "Audit & Governance",
    description:
      "Role-based access controls and immutable audit logs to protect sensitive health information.",
    span: "lg:col-span-2",
  },
];

const plans = [
  {
    name: "Essential",
    subtitle: "For boutique clinics starting out",
    price: "Ksh 10,000",
    priceNote: "/ month",
    features: ["Single location", "Up to 10 staff users", "Full EMR workflow"],
    cta: "Start Free Trial",
    featured: false,
  },
  {
    name: "Professional",
    subtitle: "For growing multi-provider teams",
    price: "Ksh 18,000",
    priceNote: "/ month",
    features: ["Up to 2 locations", "Up to 30 staff users", "Full EMR workflow"],
    cta: "Start Free Trial",
    featured: true,
  },
  {
    name: "Enterprise",
    subtitle: "For scaling healthcare networks",
    price: "Ksh 30,000",
    priceNote: "/ month",
    features: ["Up to 5 locations", "Up to 75 staff users", "Full EMR workflow"],
    cta: "Contact Sales",
    featured: false,
  },
];

const faqs = [
  {
    question: "How long does system onboarding take?",
    answer:
      "Most facilities are fully operational within 24 hours. Our intuitive setup allows you to add providers and begin documentation immediately.",
  },
  {
    question: "Can I manage decentralized branch locations?",
    answer:
      "Yes. HURE Care was engineered for centralization, allowing you to manage multiple branches from a single administrative account.",
  },
  {
    question: "What modules are included in the base plan?",
    answer:
      "Every plan includes the core patient care OS: Triage, Clinical Documentation, Appointments, Pharmacy, Lab tracking, and Billing.",
  },
  {
    question: "How does the evaluation period work?",
    answer:
      "The 10-day trial gives you unrestricted access to all features so your clinical team can validate the workflow.",
  },
];

export default function LandingPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeFaq, setActiveFaq] = useState(0);
  const [content, setContent] = useState(initialContent);

  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard');
    }
    const loadContent = async () => {
      const dbContent = await siteContentService.getContent();
      if (dbContent) {
        setContent(prev => ({ ...prev, ...dbContent }));
      }
    };
    loadContent();
  }, [currentUser, navigate]);

  const handleStartTrial = (planName) => {
    navigate(`/signup?plan=${planName}`);
  };

  return (
    <div className="min-h-screen bg-white font-['Inter'] text-slate-800 selection:bg-teal-100 selection:text-teal-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="h-10 w-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center shadow-lg shadow-slate-200/50 group-hover:scale-105 transition-transform overflow-hidden">
              <img src="/logo.png" alt="Logo" className="h-full w-full object-contain p-1.5" />
            </div>
            <div>
              <div className="text-xl font-semibold tracking-tight text-slate-900 italic">
                HURE <span className="text-teal-600">Care</span>
              </div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-medium -mt-1">Patient Care OS</div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-12 text-sm font-medium text-slate-500">
            <a href="#features" className="hover:text-teal-600 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-teal-600 transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-teal-600 transition-colors">Support</a>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={() => navigate('/login')} className="text-sm font-semibold text-slate-600 hover:text-teal-600 transition-colors">Sign in</button>
            <button
              onClick={() => navigate('/signup')}
              className="px-6 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-bold shadow-xl shadow-teal-100 hover:bg-teal-700 hover:shadow-teal-200 transition-all active:scale-95"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative px-6 py-24 lg:py-32 overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[800px] h-[800px] bg-teal-50 rounded-full blur-3xl opacity-50" />
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-50 rounded-full blur-3xl opacity-50" />
          </div>

          <div className="mx-auto max-w-7xl">
            <div className="lg:grid lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-100 text-teal-700 text-xs font-bold uppercase tracking-widest mb-8">
                  <Activity className="h-3 w-3" />
                  {content.heroBadge}
                </div>
                <h1 className="text-5xl lg:text-7xl font-medium tracking-tight text-slate-900 leading-[1.05] mb-8">
                  {content.heroTitleLine1} <br />
                  <span className="text-teal-600 relative inline-block px-2">
                    {content.heroTitleHighlight1}
                    <div className="absolute -bottom-2 left-0 w-full h-3 bg-teal-50 -z-10 rounded-lg" />
                    <div className="absolute -bottom-1 left-0 w-full h-1 bg-teal-200/50 -rotate-1" />
                  </span> {content.heroTitleHighlight2}.
                </h1>
                <p className="text-xl text-slate-500 leading-relaxed max-w-xl mb-12">
                  {content.heroBody}
                </p>
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={() => handleStartTrial('Essential')}
                    className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center gap-3 shadow-2xl shadow-slate-200 hover:bg-slate-800 transition-all group"
                  >
                    Start 10-Day Free Trial
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <a
                    href="#pricing"
                    className="px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all"
                  >
                    Explore Plans
                  </a>
                </div>
                <p className="mt-8 text-sm font-medium text-slate-400 italic flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-teal-400" />
                  {content.heroNote}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.2 }}
                className="mt-16 lg:mt-0 relative"
              >
                {/* Mesh Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-tr from-teal-100/40 to-blue-100/40 rounded-[3rem] blur-2xl -rotate-6 scale-110" />

                <div className="relative h-[500px] w-full bg-white/40 backdrop-blur-sm rounded-[3rem] border border-white/60 shadow-2xl overflow-hidden p-8">
                  {/* Floating UI Elements */}
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-10 left-10 right-10 bg-white rounded-2xl shadow-xl border border-slate-100 p-6 z-10"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-teal-500 rounded-lg" />
                        <div className="h-2 w-24 bg-slate-100 rounded-full" />
                      </div>
                      <div className="h-6 w-16 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold flex items-center justify-center">ACTIVE</div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 w-full bg-slate-50 rounded-full" />
                      <div className="h-2 w-3/4 bg-slate-50 rounded-full" />
                    </div>
                  </motion.div>

                  <motion.div
                    animate={{ y: [0, 15, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                    className="absolute bottom-12 left-8 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 z-20"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="h-10 w-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white">
                        <Activity className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-400">VITALS CHECK</div>
                        <div className="text-xl font-bold text-slate-900 tracking-tight">Normal</div>
                      </div>
                    </div>
                    <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full w-2/3 bg-indigo-500" />
                    </div>
                  </motion.div>

                  <motion.div
                    animate={{ x: [0, 10, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute top-40 right-4 w-48 bg-slate-900 text-white rounded-2xl shadow-2xl p-5 z-20"
                  >
                    <div className="text-[8px] font-bold text-teal-400 tracking-[0.2em] mb-2 uppercase">Live Queue</div>
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="h-5 w-5 rounded-full bg-white/10" />
                          <div className={`h-1.5 bg-white/10 rounded-full ${i === 1 ? 'w-16' : 'w-12'}`} />
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Background Decorative Circles */}
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-teal-200/20 rounded-full blur-2xl" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 border border-slate-100/50 rounded-full" />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="px-6 py-24 bg-slate-50/50">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl mb-20">
              <div className="text-teal-600 text-sm font-bold uppercase tracking-[0.2em] mb-4">Core Ecosystem</div>
              <h2 className="text-4xl lg:text-5xl font-medium tracking-tight text-slate-900 mb-6">Built for precision. Designed for clinical flow.</h2>
              <p className="text-lg text-slate-500 leading-relaxed">Everything your medical team needs to transition from manual bottlenecks to digital excellence.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-4">
              {featureCards.map((feature, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ y: -4, x: 4, scale: 1.01 }}
                  className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-2xl hover:shadow-teal-100/40 group relative overflow-hidden flex items-center gap-8"
                >
                  {/* Action Badge */}
                  <div className="absolute top-6 right-8 text-[8px] font-black text-slate-200 tracking-[0.3em] uppercase group-hover:text-teal-400 transition-colors">
                    HURE-MOD-{(idx + 1).toString().padStart(2, '0')}
                  </div>

                  <div className="shrink-0 h-24 w-24 bg-slate-50 rounded-[1.5rem] flex items-center justify-center text-teal-600 border border-slate-100 group-hover:bg-teal-600 group-hover:text-white transition-all duration-500 shadow-inner group-hover:rotate-6">
                    <feature.icon className="h-10 w-10" />
                  </div>
                  
                  <div className="flex-1 pr-12">
                    <h3 className="text-xl font-bold tracking-tight text-slate-900 mb-2 group-hover:text-teal-700 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed font-medium">
                      {feature.description}
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-[10px] font-black text-teal-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0">
                       Learn More <ArrowRight className="h-3 w-3" />
                    </div>
                  </div>

                  {/* Subtle Background Mesh */}
                  <div className="absolute top-0 right-0 w-32 h-full bg-slate-50/30 -z-0 translate-x-12 skew-x-12 group-hover:bg-teal-50/50 transition-colors" />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="px-6 py-24">
          <div className="mx-auto max-w-7xl text-center">
            <div className="text-teal-600 text-sm font-bold uppercase tracking-[0.2em] mb-4">{content.pricingEyebrow}</div>
            <h2 className="text-4xl lg:text-5xl font-medium tracking-tight text-slate-900 mb-6">{content.pricingTitle}</h2>
            <p className="text-lg text-slate-500 leading-relaxed max-w-2xl mx-auto mb-16">{content.pricingNote}</p>

            <div className="grid lg:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
              {plans.map((plan, idx) => (
                <div
                  key={idx}
                  className={`relative p-10 rounded-[2.5rem] border flex flex-col transition-all duration-300 ${plan.featured
                    ? "bg-slate-950 text-white border-slate-900 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.25)] scale-105"
                    : "bg-white text-slate-800 border-slate-100 shadow-sm"
                    }`}
                >
                  {plan.featured && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-teal-500 text-white text-[10px] font-bold tracking-[0.2em] rounded-full">
                      RECOMMENDED
                    </div>
                  )}
                  <div className="mb-8">
                    <h4 className="text-2xl font-medium tracking-tight mb-2">{plan.name}</h4>
                    <p className={`text-sm ${plan.featured ? "text-slate-400" : "text-slate-500"}`}>{plan.subtitle}</p>
                  </div>
                  <div className="flex items-baseline gap-2 mb-10">
                    <span className="text-5xl font-medium tracking-tighter">{plan.price}</span>
                    <span className={`text-sm ${plan.featured ? "text-slate-500" : "text-slate-400"}`}>{plan.priceNote}</span>
                  </div>
                  <div className="space-y-4 mb-12 flex-1">
                    {plan.features.map((f, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <CheckCircle2 className={`h-5 w-5 ${plan.featured ? "text-teal-400" : "text-teal-600"}`} />
                        <span className="text-sm font-medium">{f}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => handleStartTrial(plan.name)}
                    className={`w-full py-4 rounded-xl font-bold transition-all active:scale-95 ${plan.featured
                      ? "bg-teal-500 text-white hover:bg-teal-400"
                      : "bg-slate-100 text-slate-900 hover:bg-slate-200"
                      }`}
                  >
                    {plan.cta}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Facility Journey Section */}
        <section className="px-6 py-24 bg-white relative overflow-hidden">
          <div className="mx-auto max-w-7xl">
            <div className="text-center mb-20">
              <div className="text-teal-600 text-sm font-bold uppercase tracking-[0.2em] mb-4">Onboarding Journey</div>
              <h2 className="text-4xl lg:text-5xl font-medium tracking-tight text-slate-900 mb-6">Your growth, simplified.</h2>
              <p className="text-lg text-slate-500 max-w-2xl mx-auto">From clinical evaluation to verified excellence. We partner with you at every stage.</p>
            </div>

            <div className="relative grid md:grid-cols-3 gap-12">
              {/* Connecting Line */}
              <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-100 -translate-y-1/2 hidden md:block -z-10" />

              {[
                {
                  step: "01",
                  title: "10-Day Evaluation",
                  body: "Experience the full HURE Care workflow across triage, clinical notes, and billing with zero restrictions.",
                  icon: Activity,
                  color: "bg-teal-50 text-teal-600"
                },
                {
                  step: "02",
                  title: "Document Verification",
                  body: "Submit your facility licensing for our compliance review to ensure secure, uninterrupted access.",
                  icon: ShieldCheck,
                  color: "bg-blue-50 text-blue-600"
                },
                {
                  step: "03",
                  title: "Unrestricted Growth",
                  body: "Activate your preferred plan and scale your facility with a verified professional operating system.",
                  icon: TrendingUp,
                  color: "bg-indigo-50 text-indigo-600"
                }
              ].map((item, idx) => (
                <div key={idx} className="bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-sm relative group hover:shadow-xl hover:shadow-slate-100 transition-all">
                  <div className="text-[10px] font-black text-slate-200 tracking-[0.5em] mb-6 group-hover:text-teal-100 transition-colors">STEP {item.step}</div>
                  <div className={`h-16 w-16 ${item.color} rounded-2xl flex items-center justify-center mb-6 shadow-sm`}>
                    <item.icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-4">{item.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* FAQ Section */}
        <section id="faq" className="px-6 py-24 bg-slate-50/50">
          <div className="mx-auto max-w-4xl">
            <div className="text-center mb-16">
              <div className="text-teal-600 text-sm font-bold uppercase tracking-[0.2em] mb-4">{content.faqEyebrow}</div>
              <h2 className="text-4xl font-medium tracking-tight text-slate-900 mb-6">{content.faqTitle}</h2>
              <p className="text-lg text-slate-500 leading-relaxed">{content.faqBody}</p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm"
                >
                  <button
                    onClick={() => setActiveFaq(activeFaq === idx ? -1 : idx)}
                    className="w-full px-8 py-6 flex items-center justify-between text-left group"
                  >
                    <span className="text-lg font-medium text-slate-900 group-hover:text-teal-600 transition-colors">{faq.question}</span>
                    <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${activeFaq === idx ? "rotate-180 text-teal-600" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {activeFaq === idx && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="px-8 pb-8 text-slate-500 leading-relaxed text-lg">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#030712] py-24 px-6 relative overflow-hidden">
        <div className="mx-auto max-w-7xl relative z-10">
          <div className="grid md:grid-cols-4 gap-16 mb-24">
            <div className="md:col-span-2">
              <div className="flex items-center gap-4 mb-8">
                <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center p-2 shadow-lg shadow-white/5 overflow-hidden">
                  <img src="/logo.png" alt="Logo" className="h-full w-auto object-contain" />
                </div>
                <div className="text-2xl font-bold tracking-tight text-white italic">
                  HURE <span className="text-teal-400">Care</span>
                </div>
              </div>
              <p className="max-w-md text-slate-400 leading-relaxed font-medium text-lg">
                {content.footerBlurb}
              </p>
            </div>

            <div>
              <h5 className="font-bold text-xl text-white mb-8">Product</h5>
              <ul className="space-y-4 text-slate-400 font-medium">
                <li><a href="#features" className="hover:text-teal-400 transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-teal-400 transition-colors">Pricing</a></li>
                <li><a href="#faq" className="hover:text-teal-400 transition-colors">FAQ</a></li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold text-xl text-white mb-8">Legal</h5>
              <ul className="space-y-4 text-slate-400 font-medium">
                <li><Link to="/privacy" className="hover:text-teal-400 transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-teal-400 transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">
                © {new Date().getFullYear()} HURE CARE TECHNOLOGY. ALL RIGHTS RESERVED.
              </p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                Developed by <a href="https://justrise.bh" target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:text-teal-300 transition-colors">justrise.bh</a> just rise technologies wll
              </p>
            </div>
            <div className="flex gap-10">
              {[
                { label: 'Privacy', path: '/privacy' },
                { label: 'Terms', path: '/terms' },
                { label: 'Security', path: '/security' }
              ].map(item => (
                <Link
                  key={item.label}
                  to={item.path}
                  className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] hover:text-teal-400 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
