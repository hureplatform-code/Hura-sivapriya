import firestoreService from './firestoreService';
import auditService from './auditService';
import { where, query, collection, getDocs, orderBy, limit, startAfter } from 'firebase/firestore';
import { db } from '../firebase';

const medicalRecordService = {
  collection: firestoreService.collections.medical_records || 'medical_records',

  async getAllRecords(facilityId, limitNum = null, lastDoc = null) {
    try {
      const constraints = [
        orderBy('createdAt', 'desc')
      ];

      if (limitNum !== null) {
        constraints.push(limit(limitNum));
      }

      if (lastDoc) {
        constraints.push(startAfter(lastDoc));
      }

      if (facilityId) {
        constraints.unshift(where('facilityId', '==', facilityId));
      }

      const q = query(collection(db, this.collection), ...constraints);
      const snap = await getDocs(q);
      const lastVisible = snap.docs[snap.docs.length - 1];
      const records = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (limitNum === null) return records;
      return { records, lastDoc: lastVisible };
    } catch (error) {
      console.error('Error fetching medical records:', error);
      
      // Fallback for missing index: fetch without order and sort in-memory
      if (error.code === 'failed-precondition' || error.message?.includes('index')) {
        try {
          console.warn('Falling back to in-memory sorting for medical records (Index missing)');
          const constraints = [];
          if (facilityId) constraints.push(where('facilityId', '==', facilityId));
          const q = query(collection(db, this.collection), ...constraints);
          const snap = await getDocs(q);
          const allRecords = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          
          // Sort by createdAt desc
          const sorted = allRecords.sort((a, b) => {
            const dateA = a.createdAt?.seconds ? a.createdAt.seconds : 0;
            const dateB = b.createdAt?.seconds ? b.createdAt.seconds : 0;
            return dateB - dateA;
          });

          if (limitNum === null) return sorted;
          const paginated = sorted.slice(0, limitNum);
          return { records: paginated, lastDoc: snap.docs[paginated.length - 1] };
        } catch (innerError) {
          console.error('In-memory fallback failed:', innerError);
        }
      }
      
      return limitNum === null ? [] : { records: [], lastDoc: null };
    }
  },

  async getRecordsByPatient(patientId) {
    if (!patientId) return [];
    try {
      const q = [where('patientId', '==', patientId), orderBy('createdAt', 'desc')];
      return await firestoreService.getAll(this.collection, q);
    } catch (error) {
      console.warn("getRecordsByPatient fallback:", error);
      // Fallback: fetch without order and sort in-memory
      const q = [where('patientId', '==', patientId)];
      const records = await firestoreService.getAll(this.collection, q);
      return records.sort((a, b) => {
        const dateA = a.createdAt?.seconds ? a.createdAt.seconds : (a.createdAt instanceof Date ? a.createdAt.getTime() : 0);
        const dateB = b.createdAt?.seconds ? b.createdAt.seconds : (b.createdAt instanceof Date ? b.createdAt.getTime() : 0);
        return dateB - dateA;
      });
    }
  },

  async createRecord(recordData, userContext = { id: 'sys', name: 'System' }) {
    const record = await firestoreService.create(this.collection, recordData);
    await auditService.logActivity({
      userId: userContext.id,
      userName: userContext.name,
      action: 'CREATE_NOTE',
      module: 'CLINICAL',
      description: `Created clinical note for patient ${recordData.patientId}`,
      metadata: { patientId: recordData.patientId, recordId: record.id }
    });
    return record;
  },

  async updateRecord(id, recordData, userContext = { id: 'sys', name: 'System' }) {
    const result = await firestoreService.update(this.collection, id, recordData);
    await auditService.logActivity({
      userId: userContext.id,
      userName: userContext.name,
      action: 'UPDATE_NOTE',
      module: 'CLINICAL',
      description: `Updated clinical note ${id}`,
      metadata: { recordId: id }
    });
    return result;
  },

  async getRecordById(id) {
    return firestoreService.getById(this.collection, id);
  },

  async getRecordByAppointment(appointmentId) {
    if (!appointmentId) return null;
    try {
      const q = [
        where('appointmentId', '==', appointmentId),
        orderBy('createdAt', 'desc'),
        limit(1)
      ];
      const records = await firestoreService.getAll(this.collection, q);
      return records.length > 0 ? records[0] : null;
    } catch (error) {
      console.warn("getRecordByAppointment failed, falling back to basic query:", error);
      // Basic query without orderBy to avoid index requirement
      const q = [
        where('appointmentId', '==', appointmentId)
      ];
      const records = await firestoreService.getAll(this.collection, q);
      if (records.length === 0) return null;
      // Sort in-memory
      return records.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))[0];
    }
  }
};

export default medicalRecordService;
