import firestoreService from './firestoreService';

const medicalMasterService = {
  // Collection Mappings
  collections: {
    categories: firestoreService.collections.pharmacy_categories,
    pharma: firestoreService.collections.pharma_masters,
    nonPharma: firestoreService.collections.non_pharma_masters,
    icd: firestoreService.collections.icd_masters,
    labs: firestoreService.collections.lab_masters,
    imaging: firestoreService.collections.imaging_masters,
    practiceTypes: 'practice_types',
    specialties: 'medical_specialties',
    procedures: 'procedure_masters',
    noteTemplates: 'note_templates',
    dosages: 'dosage_frequencies',
    drugForms: 'drug_forms'
  },

  // Generic Master CRUD helpers
  async getAll(type) {
    const col = this.collections[type];
    if (!col) throw new Error(`Invalid master type: ${type}`);
    return firestoreService.getAll(col);
  },

  async getById(type, id) {
    const col = this.collections[type];
    return firestoreService.getById(col, id);
  },

  async create(type, data) {
    const col = this.collections[type];
    return firestoreService.create(col, data);
  },

  async update(type, id, data) {
    const col = this.collections[type];
    return firestoreService.update(col, id, data);
  },

  async delete(type, id) {
    const col = this.collections[type];
    return firestoreService.delete(col, id);
  }
};

export default medicalMasterService;
