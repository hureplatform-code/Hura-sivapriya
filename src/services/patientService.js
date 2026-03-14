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
      const patients = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (limitNum === null) return patients;
      return { patients, lastDoc: lastVisible };
    } catch (error) {
      console.error('Error fetching patients:', error);
      // Fallback: If orderBy fails (missing index), try without index
      if (error.code === 'failed-precondition') {
        try {
          const q = query(collection(db, this.collection), where('facilityId', '==', facilityId));
          const snap = await getDocs(q);
          return limitNum === null ? snap.docs.map(d => ({id: d.id, ...d.data()})) : { patients: snap.docs.map(d => ({id: d.id, ...d.data()})), lastDoc: null };
        } catch (inner) {
          return limitNum === null ? [] : { patients: [], lastDoc: null };
        }
      }
      return limitNum === null ? [] : { patients: [], lastDoc: null };
    }
  },

  async getPatientById(id) {
    return firestoreService.getById(this.collection, id);
  },

  async createPatient(patientData) {
    return firestoreService.create(this.collection, patientData);
  },

  async updatePatient(id, patientData) {
    return firestoreService.update(this.collection, id, patientData);
  },

  async deletePatient(id) {
    return firestoreService.delete(this.collection, id);
  }
};

export default patientService;
