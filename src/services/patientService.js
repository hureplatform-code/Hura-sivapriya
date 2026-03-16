import firestoreService from './firestoreService';
import { where, query, collection, getDocs, orderBy, limit, startAfter } from 'firebase/firestore';
import { db } from '../firebase';

const patientService = {
  collection: firestoreService.collections.patients || 'patients',

  async getAllPatients(facilityId, limitNum = null, lastDoc = null) {
    try {
      const constraints = [];

      if (facilityId) {
        constraints.push(where('facilityId', '==', facilityId));
      }

      // Add ordering if needed, but simple query first to ensure it works
      constraints.push(orderBy('createdAt', 'desc'));

      if (limitNum !== null) {
        constraints.push(limit(limitNum));
      }

      if (lastDoc) {
        constraints.push(startAfter(lastDoc));
      }

      const q = query(collection(db, this.collection), ...constraints);
      const snap = await getDocs(q);
      const lastVisible = snap.docs[snap.docs.length - 1];
      const patients = snap.docs.map(doc => ({ ...doc.data(), docId: doc.id }));

      if (limitNum === null) return patients;
      return { patients, lastDoc: lastVisible };
    } catch (error) {
      console.error('Error fetching patients:', error);
      // Fallback: If index missing, try without orderBy
      if (error.code === 'failed-precondition' || error.message?.includes('index')) {
        try {
          const q = query(collection(db, this.collection), where('facilityId', '==', facilityId));
          const snap = await getDocs(q);
          const patients = snap.docs.map(d => ({ ...d.data(), docId: d.id }));
          return limitNum === null ? patients : { patients, lastDoc: null };
        } catch (inner) {
          return limitNum === null ? [] : { patients: [], lastDoc: null };
        }
      }
      return limitNum === null ? [] : { patients: [], lastDoc: null };
    }
  },

  async getPatientById(id) {
    if (!id) return null;
    // 1. Try fetching by Document ID
    const byDocId = await firestoreService.getById(this.collection, id);
    if (byDocId) return { ...byDocId, docId: byDocId.id };

    // 2. Try fetching by patient id fields (id or patientId)
    const q1 = query(collection(db, this.collection), where('id', '==', id), limit(1));
    const snap1 = await getDocs(q1);
    if (!snap1.empty) {
      const doc = snap1.docs[0];
      return { ...doc.data(), docId: doc.id };
    }

    const q2 = query(collection(db, this.collection), where('patientId', '==', id), limit(1));
    const snap2 = await getDocs(q2);
    if (!snap2.empty) {
      const doc = snap2.docs[0];
      return { ...doc.data(), docId: doc.id };
    }
    
    return null;
  },

  async createPatient(patientData) {
    return firestoreService.create(this.collection, patientData);
  },

  async updatePatient(id, patientData) {
    return firestoreService.update(this.collection, id, patientData);
  },

  async deletePatient(id) {
    return firestoreService.delete(this.collection, id);
  },

  async searchPatients(facilityId, searchTerm) {
    if (!facilityId || !searchTerm) return [];
    try {
      const termLower = searchTerm.toLowerCase();
      // Firestore limited queries - we fetch by facility and filter local for better UX with partial match
      const q = query(
        collection(db, this.collection), 
        where('facilityId', '==', facilityId)
      );
      const snap = await getDocs(q);
      const patients = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      return patients.filter(p => 
        p.id?.toLowerCase().includes(termLower) || 
        p.name?.toLowerCase().includes(termLower) || 
        p.phoneNumber?.toLowerCase().includes(termLower)
      ).slice(0, 10);
    } catch (error) {
      console.error('Error searching patients:', error);
      return [];
    }
  }
};

export default patientService;
