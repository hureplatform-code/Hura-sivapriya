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
    
    // Create admission ID if admitting
    const admissionId = status === 'occupied' ? `ADM_${Date.now()}` : null;

    wards[wardIndex].beds[bedIndex] = {
      ...wards[wardIndex].beds[bedIndex],
      status,
      patient: patientData?.name || null,
      patientId: patientData?.patientId || null,
      admissionId: admissionId || wards[wardIndex].beds[bedIndex].admissionId || null,
      admittedAt: patientData?.admittedAt || new Date().toLocaleDateString(),
      doctor: patientData?.doctor || null
    };

    return firestoreService.set(this.collection, wardId, wards[wardIndex]);
  },

  async getBedDetails(wardId, bedId) {
    const wards = await this.getAllWards();
    const ward = wards.find(w => w.id === wardId);
    if (!ward) return null;
    return ward.beds.find(b => b.id === bedId);
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

    // Reset bed to cleaning status
    wards[wardIndex].beds[bedIndex] = {
      ...wards[wardIndex].beds[bedIndex],
      status: 'empty',
      patient: null,
      patientId: null,
      admissionId: null,
      admittedAt: null,
      doctor: null,
    };

    return firestoreService.set(this.collection, wardId, wards[wardIndex]);
  },

  // ─────────────────────────────────────────────
  // INPATIENT CHART (Vitals, Notes, MAR)
  // ─────────────────────────────────────────────

  async getChartRecords(patientId) {
    if(!patientId) return [];
    try {
        const records = await firestoreService.getAll('inpatient_charts');
        // Client-side filtering as this is a mock wrapper over generic 'getAll' right now
        // A production generic would use a proper query
        return records.filter(r => r.patientId === patientId).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch(e) {
        return [];
    }
  },

  async addChartRecord(patientId, admissionId, type, data, user) {
      if(!patientId) throw new Error("Missing patient ID");
      const record = {
          patientId,
          admissionId,
          type, // 'vital', 'note', 'mar_given', 'mar_order', 'discharge'
          data,
          recordedBy: user?.name || 'System',
          role: user?.role || 'staff',
          timestamp: new Date().toISOString()
      };
      return firestoreService.create('inpatient_charts', record);
  }
};

export default wardService;
