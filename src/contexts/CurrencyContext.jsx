/**
 * CurrencyContext
 * 
 * Provides a per-clinic `currency` value throughout the app.
 * 
 * Rules:
 * - superadmin → always USD (subscription platform currency stays fixed)
 * - clinic users → loads `currency` from their facility's Firestore profile
 * - Default fallback → USD
 * 
 * Usage:
 *   import { useCurrency } from '../contexts/CurrencyContext';
 *   const { currency } = useCurrency();
 *   // e.g. currency = 'MVR', 'USD', 'SGD', etc.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import facilityService from '../services/facilityService';
import { APP_CONFIG } from '../config';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const CurrencyContext = createContext({ currency: APP_CONFIG.CURRENCY });

export function useCurrency() {
  return useContext(CurrencyContext);
}

export function CurrencyProvider({ children }) {
  const { userData } = useAuth();
  const [currency, setCurrency] = useState(APP_CONFIG.CURRENCY);

  useEffect(() => {
    const loadCurrency = async () => {
      let platformCurrency = APP_CONFIG.CURRENCY;
      
      try {
          const platformDoc = await getDoc(doc(db, 'platform_settings', 'main'));
          if (platformDoc.exists() && platformDoc.data().baseCurrency) {
              platformCurrency = platformDoc.data().baseCurrency;
          }
      } catch (e) {
          console.warn("Global settings fetch failed, using config default:", e);
      }

      // Superadmin always sees Platform-level currency
      if (!userData || userData.role === 'superadmin') {
        setCurrency(platformCurrency);
        return;
      }

      // Clinic users → read from their facility profile
      if (userData.facilityId) {
        try {
          const profile = await facilityService.getProfile(userData.facilityId);
          if (profile?.currency) {
            setCurrency(profile.currency);
          } else {
            setCurrency(platformCurrency); // fallback to platform default
          }
        } catch (err) {
          console.error('Failed to load facility currency:', err);
          setCurrency(platformCurrency);
        }
      }
    };

    loadCurrency();
  }, [userData]);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}
