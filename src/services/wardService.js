import firestoreService from './firestoreService';

const wardService = {
  collection: firestoreService.collections.wards,

  async getAllWards() {
    return firestoreService.getAll(this.collection);
  },

  async updateBedStatus(wardId, bedId, status, patientData = null) {
    const wards = await this.getAllWards();
    const wardIndex = wards.findIndex(w => w.id === wardId);
    if (wardIndex === -1) return;

    const bedIndex = wards[wardIndex].beds.findIndex(b => b.id === bedId);
    if (bedIndex === -1) return;

    wards[wardIndex].beds[bedIndex] = {
      ...wards[wardIndex].beds[bedIndex],
      status,
      patient: patientData?.name || null,
      patientId: patientData?.patientId || null,
      admittedAt: patientData?.admittedAt || new Date().toLocaleDateString(),
      doctor: patientData?.doctor || null
    };

    return firestoreService.set(this.collection, wardId, wards[wardIndex]);
  },

  async createWard(name) {
    const newWard = {
      name,
      beds: [],
      createdAt: new Date().toISOString()
    };
    return firestoreService.create(this.collection, newWard);
  },

  async addBedToWard(wardId, bedName) {
    const wards = await this.getAllWards();
    const wardIndex = wards.findIndex(w => w.id === wardId);
    if (wardIndex === -1) return;

    const newBed = {
      id: `bed_${Date.now()}`,
      name: bedName,
      status: 'empty'
    };

    const updatedWard = {
      ...wards[wardIndex],
      beds: [...(wards[wardIndex].beds || []), newBed]
    };

    return firestoreService.set(this.collection, wardId, updatedWard);
  },

  async dischargePatient(wardId, bedId) {
    const wards = await this.getAllWards();
    const wardIndex = wards.findIndex(w => w.id === wardId);
    if (wardIndex === -1) return;

    const bedIndex = wards[wardIndex].beds.findIndex(b => b.id === bedId);
    if (bedIndex === -1) return;

    // Reset bed to cleaning status (Legacy parity: beds often need cleaning after discharge)
    wards[wardIndex].beds[bedIndex] = {
      ...wards[wardIndex].beds[bedIndex],
      status: 'empty',
      patient: null,
      patientId: null,
      admittedAt: null,
      doctor: null,
      dischargedAt: new Date().toLocaleDateString()
    };

    return firestoreService.set(this.collection, wardId, wards[wardIndex]);
  }
};

export default wardService;

