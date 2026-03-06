import firestoreService from './firestoreService';
import { serverTimestamp, orderBy, limit, where, query, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const auditService = {
  collection: firestoreService.collections.audit_logs || 'audit_logs',

  /**
   * Logs an activity to the audit trail
   */
  async logActivity(logData) {
    try {
      const data = {
        ...logData,
        timestamp: serverTimestamp(),
      };
      return await firestoreService.create(this.collection, data);
    } catch (error) {
      console.error('Audit Log Error:', error);
    }
  },

  /**
   * Fetches recent audit logs for the dashboard feed
   * @param {number} limitNum 
   * @param {string|null} facilityId - If provided, filter by facility (Governance Rule)
   */
  async getRecentLogs(limitNum = 20, facilityId = null) {
    try {
      const constraints = [
        orderBy('timestamp', 'desc'),
        limit(limitNum)
      ];
      
      // If facilityId is provided, scoped to that clinic. 
      // If null, it's a Superadmin viewing GLOBAL audit trail.
      if (facilityId) {
        constraints.unshift(where('facilityId', '==', facilityId));
      }
      
      const q = query(collection(db, this.collection), ...constraints);
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return [];
    }
  }
};

export default auditService;
