import firestoreService from './firestoreService';
import { where } from 'firebase/firestore';

const patientService = {
  collection: firestoreService.collections.patients || 'patients',

  async getAllPatients(facilityId) {
    const q = facilityId ? [where('facilityId', '==', facilityId)] : [];
    return firestoreService.getAll(this.collection, q);
  },

  async getPatientById(id) {
    return firestoreService.getById(this.collection, id);
  },

  async createPatient(patientData) {
    return firestoreService.create(this.collection, patientData);
  },

  async updatePatient(id, patientData) {
    return firestoreService.update(this.collection, id, patientData);
  }
};

export default patientService;
