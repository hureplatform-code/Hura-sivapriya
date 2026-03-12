import { db } from '../firebase';
import { collection, query, where, orderBy, limit, getDocs, doc, getDoc, updateDoc, increment, addDoc, serverTimestamp } from 'firebase/firestore';

const smsSettingsService = {

  /**
   * Get SMS Wallet and Preferences for a facility
   */
  async getWallet(facilityId) {
    if (!facilityId) return null;
    try {
      const snap = await getDoc(doc(db, 'hospital_profile', facilityId));
      if (!snap.exists()) return null;
      const data = snap.data();
      return {
        balance: data.smsWalletBalance || 0,
        language: data.smsLanguage || 'English'
      };
    } catch (error) {
      console.error('Error fetching SMS wallet:', error);
      return null;
    }
  },

  /**
   * Update SMS Language Preference
   */
  async updateLanguage(facilityId, language) {
    if (!facilityId) return false;
    try {
      await updateDoc(doc(db, 'hospital_profile', facilityId), {
        smsLanguage: language
      });
      return true;
    } catch (error) {
      console.error('Error updating SMS language:', error);
      throw error;
    }
  },

  /**
   * Purchase SMS Bundle
   */
  async buyBundle(facilityId, amount) {
    if (!facilityId) return false;
    try {
      // In a real app, this would hit a payment gateway first.
      // For now, we instantly top-up the wallet.
      await updateDoc(doc(db, 'hospital_profile', facilityId), {
        smsWalletBalance: increment(amount)
      });
      return true;
    } catch (error) {
      console.error('Error buying SMS bundle:', error);
      throw error;
    }
  },

  /**
   * Fetch recent SMS Logs for a facility
   */
  async getLogs(facilityId, num = 50) {
    if (!facilityId) return [];
    try {
      const q = query(
        collection(db, 'sms_logs'),
        where('facilityId', '==', facilityId),
        orderBy('sentAt', 'desc'),
        limit(num)
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
        // If sorting index is missing, fallback cleanly
        if (error.message.includes('index')) {
            console.warn("Index missing for sms_logs, falling back to un-ordered fetch");
            const q = query(collection(db, 'sms_logs'), where('facilityId', '==', facilityId), limit(num));
            const snap = await getDocs(q);
            return snap.docs.map(d => ({ id: d.id, ...d.data() }));
        }
      console.error('Error fetching SMS logs:', error);
      return [];
    }
  },

  /**
   * Send a test SMS via the Cloud Function endpoint
   */
  async sendTestSms(facilityId, toPhone, message = "Test message from HURA platform. Africa's Talking API is working!") {
    try {
      const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'huraplatform';
      // In production, get dynamic region. Assuming us-central1 default.
      const functionUrl = `https://us-central1-${projectId}.cloudfunctions.net/sendManualSms`;
      
      const res = await fetch(functionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facilityId, to: toPhone, message })
      });
      return res.ok;
    } catch (error) {
      console.error('Test SMS failed:', error);
      return false;
    }
  }
};

export default smsSettingsService;
