import firestoreService from './firestoreService';
import { serverTimestamp, orderBy, limit, where, query, collection, getDocs, startAfter } from 'firebase/firestore';
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
   * @param {any} lastDoc - For pagination
   */
  async getRecentLogs(limitNum = 20, facilityId = null, lastDoc = null) {
    try {
      const constraints = [
        orderBy('timestamp', 'desc'),
        limit(limitNum)
      ];
      
      if (lastDoc) {
        constraints.push(startAfter(lastDoc));
      }

      // If facilityId is provided, scoped to that clinic. 
      // If null, it's a Superadmin viewing GLOBAL audit trail.
      if (facilityId) {
        constraints.unshift(where('facilityId', '==', facilityId));
      }
      
      const q = query(collection(db, this.collection), ...constraints);
      const querySnapshot = await getDocs(q);
      
      const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
      const logs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      return { logs, lastDoc: lastVisible };
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return { logs: [], lastDoc: null };
    }
  }
};

export default auditService;
