import { db } from '../firebase';
import { collection, query, where, orderBy, limit, getDocs, doc, getDoc, updateDoc, increment, addDoc, serverTimestamp } from 'firebase/firestore';

const smsSettingsService = {

  /**
   * Get SMS Wallet and Preferences for a facility
   */
  async getWallet(facilityId) {
    if (!facilityId) return null;
    try {
      const snap = await getDoc(doc(db, 'facility_profile', facilityId));
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
      await updateDoc(doc(db, 'facility_profile', facilityId), {
        smsLanguage: language
      });
      return true;
    } catch (error) {
      console.error('Error updating SMS language:', error);
      throw error;
    }
  },

  /**
   * Create a Top-up Request (Notification to Admin)
   */
  async requestTopup(facilityId, bundle) {
    if (!facilityId) return false;
    try {
      const facilitySnap = await getDoc(doc(db, 'facility_profile', facilityId));
      const facilityName = facilitySnap.exists() ? facilitySnap.data().name : 'Unknown';

      await addDoc(collection(db, 'topup_requests'), {
        facilityId,
        facilityName,
        sms: bundle.sms,
        price: bundle.price,
        status: 'pending',
        createdAt: serverTimestamp(),
        bundleId: bundle.id
      });
      return true;
    } catch (error) {
      console.error('Error creating topup request:', error);
      throw error;
    }
  },

  /**
   * Fetch all topup requests (Superadmin)
   */
  async getTopupRequests() {
    try {
      const q = query(collection(db, 'topup_requests'), orderBy('createdAt', 'desc'), limit(50));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
      console.error('Error fetching topup requests:', error);
      return [];
    }
  },

  /**
   * Approve a topup request (Superadmin)
   */
  async approveTopupRequest(requestId) {
    try {
      const reqDoc = doc(db, 'topup_requests', requestId);
      const reqSnap = await getDoc(reqDoc);
      if (!reqSnap.exists()) throw new Error("Request not found");
      
      const { facilityId, sms } = reqSnap.data();
      
      // Update facility balance
      await updateDoc(doc(db, 'facility_profile', facilityId), {
        smsWalletBalance: increment(sms)
      });
      
      // Mark request as approved
      await updateDoc(reqDoc, {
        status: 'approved',
        approvedAt: serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error('Error approving topup request:', error);
      throw error;
    }
  },

  /**
   * Purchase SMS Bundle (Legacy/Direct)
   */
  async buyBundle(facilityId, amount) {
    if (!facilityId) return false;
    try {
      // In a real app, this would hit a payment gateway first.
      // For now, we instantly top-up the wallet.
      await updateDoc(doc(db, 'facility_profile', facilityId), {
        smsWalletBalance: increment(amount)
      });
      return true;
    } catch (error) {
      console.error('Error buying SMS bundle:', error);
      throw error;
    }
  },

  /**
   * Fetch recent SMS Logs (Clinic specific or all if null)
   */
  async getLogs(facilityId, num = 100) {
    try {
      let q;
      const logsRef = collection(db, 'sms_logs');
      
      if (facilityId && facilityId !== 'all') {
        q = query(
          logsRef,
          where('facilityId', '==', facilityId),
          orderBy('sentAt', 'desc'),
          limit(num)
        );
      } else {
        // Global view for Superadmin
        q = query(
          logsRef,
          orderBy('sentAt', 'desc'),
          limit(num)
        );
      }

      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
        // If sorting index is missing, fallback cleanly
        if (error.message.includes('index')) {
            console.warn("Index missing for sms_logs, falling back to un-ordered fetch");
            let q;
            const logsRef = collection(db, 'sms_logs');
            if (facilityId && facilityId !== 'all') {
                q = query(logsRef, where('facilityId', '==', facilityId), limit(num));
            } else {
                q = query(logsRef, limit(num));
            }
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
      let functionUrl = `https://us-central1-${projectId}.cloudfunctions.net/sendManualSms`;

      const res = await fetch(functionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facilityId, to: toPhone, message })
      });

      const data = await res.json();
      if (res.ok) {
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Test SMS failed:', error);
      return { success: false, error: "Network error or function not found. Did you deploy your functions?" };
    }
  },

  /**
   * Get the global Africa's Talking provider balance (Superadmin only)
   */
  async getAtBalance() {
    try {
      const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'huraplatform';
      let functionUrl = `https://us-central1-${projectId}.cloudfunctions.net/getAtBalance`;

      const res = await fetch(functionUrl);
      if (!res.ok) return null;
      const data = await res.json();
      // Africa's Talking returns keys in different casing depending on SDK version
      const userData = data.UserData || data.userData;
      return userData?.balance || 'Unknown';
    } catch (error) {
      console.error('Failed to fetch AT balance:', error);
      return null;
    }
  }
};

export default smsSettingsService;
