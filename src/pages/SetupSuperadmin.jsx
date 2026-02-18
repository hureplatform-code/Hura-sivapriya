import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ShieldCheck, AlertCircle } from 'lucide-react';

export default function SetupSuperadmin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    const checkExisting = async () => {
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'superadmin'), limit(1));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          setIsSetupComplete(true);
        }
      } catch (e) {
        console.error("Setup check error:", e);
      } finally {
        setChecking(false);
      }
    };
    checkExisting();
  }, []);

  if (checking) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">Checking system status...</div>;

  if (isSetupComplete) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
            <div className="bg-white max-w-md w-full p-8 rounded-3xl shadow-2xl text-center">
                <div className="h-16 w-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="h-8 w-8" />
                </div>
                <h1 className="text-2xl font-black text-slate-900">System Already Initialized</h1>
                <p className="text-slate-500 mt-4 font-medium">
                    A Super Administrator account already exists. For security reasons, multiple superadmins cannot be created via this public setup page.
                </p>
                <button 
                    onClick={() => navigate('/login')}
                    className="mt-8 px-8 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all"
                >
                    Return to Login
                </button>
            </div>
        </div>
      );
  }

  async function handleSetup(e) {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      
      const res = await createUserWithEmailAndPassword(auth, email, password);
      const user = res.user;

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: email,
        name: name,
        role: 'superadmin',
        facilityId: 'SYSTEM', // Special ID for superadmin
        createdAt: new Date(),
        status: 'active'
      });

      // Also create a default "Main Organization" profile for them? (Optional)
      
      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="bg-white max-w-md w-full p-8 rounded-3xl shadow-2xl">
        <div className="text-center mb-8">
            <div className="h-16 w-16 bg-primary-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-200">
                <ShieldCheck className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-black text-slate-900">Setup Super Admin</h1>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-2">Initialize System Access</p>
        </div>

        {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold mb-6 flex items-center gap-2 border border-red-100">
                <AlertCircle className="h-5 w-5" /> {error}
            </div>
        )}

        <form onSubmit={handleSetup} className="space-y-4">
            <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Display Name</label>
                <input 
                    type="text" 
                    required 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    className="w-full p-3 bg-slate-50 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                    placeholder="System Administrator" 
                />
            </div>
            <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Email Address</label>
                <input 
                    type="email" 
                    required 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="w-full p-3 bg-slate-50 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                    placeholder="admin@hurecare.com" 
                />
            </div>
            <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Password</label>
                <input 
                    type="password" 
                    required 
                    minLength={6} 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    className="w-full p-3 bg-slate-50 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                    placeholder="Roughly secure password" 
                />
            </div>
            <button 
                disabled={loading}
                className="w-full py-4 bg-primary-600 text-white font-black uppercase text-sm tracking-widest rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-200 disabled:opacity-50 mt-4"
            >
                {loading ? 'Creating...' : 'Create Super Admin'}
            </button>
        </form>
      </div>
    </div>
  );
}
