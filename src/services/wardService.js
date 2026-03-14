import firestoreService from './firestoreService';
import { where } from 'firebase/firestore';

const wardService = {
  collection: firestoreService.collections.wards,

  async getAllWards(facilityId) {
    if (!facilityId) return [];
    return firestoreService.getAll(this.collection, [where('facilityId', '==', facilityId)]);
  },

  async updateBedStatus(wardId, bedId, status, patientData = null) {
    // Note: We bypass facility filter here since we are looking up by specific ward ID
    const ward = await firestoreService.getById(this.collection, wardId);
    if (!ward) return;

    const bedIndex = ward.beds.findIndex(b => b.id === bedId);
    if (bedIndex === -1) return;
    
    // Create admission ID if admitting
    const admissionId = status === 'occupied' ? `ADM_${Date.now()}` : null;

    ward.beds[bedIndex] = {
      ...ward.beds[bedIndex],
      status,
      patient: patientData?.name || null,
      patientId: patientData?.patientId || null,
      admissionId: admissionId || ward.beds[bedIndex].admissionId || null,
      admittedAt: patientData?.admittedAt || new Date().toLocaleDateString(),
      doctor: patientData?.doctor || null
    };

    return firestoreService.set(this.collection, wardId, ward);
  },

  async getBedDetails(wardId, bedId) {
    const ward = await firestoreService.getById(this.collection, wardId);
    if (!ward) return null;
    return ward.beds.find(b => b.id === bedId);
  },

  async createWard(name, facilityId) {
    if (!facilityId) throw new Error("Missing facility ID for ward creation.");
    const newWard = {
      name,
      facilityId,
      beds: [],
      createdAt: new Date().toISOString()
    };
    return firestoreService.create(this.collection, newWard);
  },

  async addBedToWard(wardId, bedName) {
    const ward = await firestoreService.getById(this.collection, wardId);
    if (!ward) return;

    const newBed = {
      id: `bed_${Date.now()}`,
      name: bedName,
      status: 'empty'
    };

    const updatedWard = {
      ...ward,
      beds: [...(ward.beds || []), newBed]
    };

    return firestoreService.set(this.collection, wardId, updatedWard);
  },

  async dischargePatient(wardId, bedId) {
    const ward = await firestoreService.getById(this.collection, wardId);
    if (!ward) return;

    const bedIndex = ward.beds.findIndex(b => b.id === bedId);
    if (bedIndex === -1) return;

    // Reset bed to empty/cleaning status
    ward.beds[bedIndex] = {
      ...ward.beds[bedIndex],
      status: 'empty',
      patient: null,
      patientId: null,
      admissionId: null,
      admittedAt: null,
      doctor: null,
    };

    return firestoreService.set(this.collection, wardId, ward);
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
