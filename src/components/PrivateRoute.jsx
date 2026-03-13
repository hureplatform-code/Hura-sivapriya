import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AlertTriangle, Lock } from 'lucide-react';

export default function PrivateRoute({ children }) {
  const { currentUser, userData, subscriptionStatus, activeStaffCount, logout, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <p className="text-slate-500 font-medium animate-pulse">Authenticating Session...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // ROLE-BASED ROUTE GUARDS (Hard Blocks)
  if (userData?.role === 'superadmin') {
      const blockedForSuperadmin = [
          '/appointments', '/notes', '/clinical-forms', '/investigation', '/ward',
          '/pharmacy', '/master/patients', '/master/profile', '/master/branches'
      ];
      if (blockedForSuperadmin.some(p => location.pathname.startsWith(p))) {
           return <Navigate to="/" />;
      }
      return children;
  }

  // Prevent Clinical Ops / Admin access for receptionist
  if (userData?.role === 'receptionist') {
      const blockedForReceptionist = [
         '/notes', '/clinical-forms', '/investigation', '/ward', '/pharmacy', '/accounting', '/config', '/reports'
      ];
      // Note: /master/patients is allowed for receptionist. Custom /master check:
      if (blockedForReceptionist.some(p => location.pathname.startsWith(p)) || 
         (location.pathname.startsWith('/master') && !location.pathname.startsWith('/master/patients'))) {
           return <Navigate to="/" />;
      }
  }

  // Prevent Non-Pharmacist access to Pharmacy
  if (!['clinic_owner', 'pharmacist'].includes(userData?.role)) {
      if (location.pathname.startsWith('/pharmacy')) {
           return <Navigate to="/" />;
      }
  }

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
                    <h1 className="text-2xl font-semibold mb-2 tracking-tight">Access Suspended</h1>
                    <p className="text-slate-400 max-w-md">The subscription for this facility has expired. Please contact your administrator.</p>
                    <button onClick={logout} className="mt-8 px-6 py-3 bg-white text-slate-900 font-medium rounded-xl">Back to Login</button>
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
                            <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Plan Limit Exceeded</h2>
                            <p className="text-slate-500 mt-2 font-medium">
                                You have <strong>{activeStaffCount}</strong> active staff members, but your current plan only supports <strong>{subscriptionStatus.maxStaff}</strong>.
                            </p>
                            <p className="text-sm text-slate-400 mt-4">
                                Please deactivate {activeStaffCount - subscriptionStatus.maxStaff} user accounts or upgrade your plan to continue.
                            </p>
                            <div className="flex gap-3 mt-8 justify-center">
                                <button onClick={() => navigate('/master/users')} className="px-6 py-3 bg-slate-900 text-white font-medium rounded-xl">Manage Users</button>
                                <button onClick={() => navigate('/master/accounts')} className="px-6 py-3 bg-slate-100 text-slate-900 font-medium rounded-xl">View Plans</button>
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
                    <h1 className="text-2xl font-semibold mb-2 tracking-tight">Service Temporarily Paused</h1>
                    <p className="text-slate-500 max-w-md">This facility has exceeded its user license limit. Please contact your clinic administrator.</p>
                    <button onClick={logout} className="mt-8 px-6 py-3 bg-slate-900 text-white font-medium rounded-xl">Back to Login</button>
                </div>
             );
           }
      }
  }
  
  return children;
}
