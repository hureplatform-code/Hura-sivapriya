import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AlertTriangle, Lock } from 'lucide-react';

export default function PrivateRoute({ children }) {
  const { currentUser, userData, subscriptionStatus, activeStaffCount, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  // Give context a moment to load subscription data
  useEffect(() => {
    if (userData !== undefined) {
         setChecking(false);
    }
  }, [userData, subscriptionStatus]);

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  if (checking) return <div className="h-screen flex items-center justify-center bg-slate-50">Loading access rights...</div>;

  // SUPERADMIN SKIP
  if (userData?.role === 'superadmin') return children;

  if (userData?.facilityId && subscriptionStatus) {
      // 1. CHECK EXPIRY
      const isExpired = subscriptionStatus.status === 'expired' || 
                        (subscriptionStatus.expiryDate && new Date() > new Date(subscriptionStatus.expiryDate));

      if (isExpired) {
          if (userData.role === 'clinic_owner') {
             // Allow owner to access Billing/Accounts only
             const allowedPaths = ['/master/accounts', '/subscription/change', '/subscription/user-plan'];
             if (!allowedPaths.some(p => location.pathname.startsWith(p))) {
                 return <Navigate to="/master/accounts" state={{ warning: 'Your subscription has expired. Please renew to continue.' }} />;
             }
          } else {
             // Staff blocked
             return (
                <div className="h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-6 text-center">
                    <Lock className="h-16 w-16 text-red-500 mb-6" />
                    <h1 className="text-3xl font-black mb-2">Access Suspended</h1>
                    <p className="text-slate-400 max-w-md">The subscription for this facility has expired. Please contact your administrator.</p>
                    <button onClick={logout} className="mt-8 px-6 py-3 bg-white text-slate-900 font-bold rounded-xl">Back to Login</button>
                </div>
             );
          }
      }

      // 2. CHECK STAFF LIMITS (Downgrade Scenario)
      // Only strict if we are OVER limit
      if (activeStaffCount > (subscriptionStatus.maxStaff || 1)) {
           // Allow owner to fix it
           if (userData.role === 'clinic_owner') {
               const allowedPaths = ['/master/users', '/master/accounts', '/subscription/change'];
               if (!allowedPaths.some(p => location.pathname.startsWith(p))) {
                  return (
                    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white max-w-lg w-full p-8 rounded-3xl shadow-2xl text-center">
                            <div className="h-16 w-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle className="h-8 w-8" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900">Plan Limit Exceeded</h2>
                            <p className="text-slate-500 mt-2 font-medium">
                                You have <strong>{activeStaffCount}</strong> active staff members, but your current plan only supports <strong>{subscriptionStatus.maxStaff}</strong>.
                            </p>
                            <p className="text-sm text-slate-400 mt-4">
                                Please deactivate {activeStaffCount - subscriptionStatus.maxStaff} user accounts or upgrade your plan to continue.
                            </p>
                            <div className="flex gap-3 mt-8 justify-center">
                                <button onClick={() => navigate('/master/users')} className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl">Manage Users</button>
                                <button onClick={() => navigate('/master/accounts')} className="px-6 py-3 bg-slate-100 text-slate-900 font-bold rounded-xl">View Plans</button>
                            </div>
                        </div>
                    </div>
                  );
               }
           } else {
               // Staff blocked
               return (
                <div className="h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-900 p-6 text-center">
                    <AlertTriangle className="h-16 w-16 text-amber-500 mb-6" />
                    <h1 className="text-3xl font-black mb-2">Service Temporarily Paused</h1>
                    <p className="text-slate-500 max-w-md">This facility has exceeded its user license limit. Please contact your clinic administrator.</p>
                    <button onClick={logout} className="mt-8 px-6 py-3 bg-slate-900 text-white font-bold rounded-xl">Back to Login</button>
                </div>
             );
           }
      }
  }
  
  return children;
}
