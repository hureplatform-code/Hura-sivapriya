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

const CurrencyContext = createContext({ currency: APP_CONFIG.CURRENCY });

export function useCurrency() {
  return useContext(CurrencyContext);
}

export function CurrencyProvider({ children }) {
  const { userData } = useAuth();
  const [currency, setCurrency] = useState(APP_CONFIG.CURRENCY); // Default: USD

  useEffect(() => {
    const loadCurrency = async () => {
      // Superadmin always sees USD (subscription billing currency)
      if (!userData || userData.role === 'superadmin') {
        setCurrency(APP_CONFIG.CURRENCY);
        return;
      }

      // Clinic users → read from their facility profile
      if (userData.facilityId) {
        try {
          const profile = await facilityService.getProfile(userData.facilityId);
          if (profile?.currency) {
            setCurrency(profile.currency);
          } else {
            setCurrency(APP_CONFIG.CURRENCY); // fallback to USD
          }
        } catch (err) {
          console.error('Failed to load facility currency:', err);
          setCurrency(APP_CONFIG.CURRENCY);
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
