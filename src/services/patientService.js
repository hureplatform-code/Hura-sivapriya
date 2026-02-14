import firestoreService from './firestoreService';

const patientService = {
  collection: firestoreService.collections.patients || 'patients',

  async getAllPatients() {
    return firestoreService.getAll(this.collection);
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
