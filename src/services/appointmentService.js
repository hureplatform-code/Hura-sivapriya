import firestoreService from './firestoreService';
import { where, orderBy, limit } from 'firebase/firestore';
import smsSettingsService from './smsSettingsService';

const appointmentService = {
  collection: firestoreService.collections.appointments,

  async getAllAppointments(facilityId) {
    const q = facilityId ? [where('facilityId', '==', facilityId)] : [];
    return firestoreService.getAll(this.collection, q);
  },

  async getRecentAppointments(facilityId) {
    const q = [orderBy('createdAt', 'desc'), limit(10)];
    if (facilityId) q.push(where('facilityId', '==', facilityId));
    return firestoreService.getAll(this.collection, q);
  },

  async bookAppointment(appointmentData) {
    try {
      // 1. Generate sequential token number for this doctor on this date
      const q = [
        where('facilityId', '==', appointmentData.facilityId),
        where('provider', '==', appointmentData.provider),
        where('date', '==', appointmentData.date)
      ];
      const existing = await firestoreService.getAll(this.collection, q);
      const token = (existing || []).length + 1;

      // 2. Create Appointment with token and status
      const result = await firestoreService.create(this.collection, {
        ...appointmentData,
        tokenNumber: token,
        status: 'scheduled'
      });

      // 3. Automatically send SMS confirmation if patient phone exists
      if (appointmentData.patientPhone && appointmentData.facilityId) {
        // Fire and forget, don't block the UI
        smsSettingsService.sendAppointmentConfirmation(appointmentData.facilityId, {
          ...appointmentData,
          tokenNumber: token,
          id: result.id
        }).catch(err => console.error("Auto-SMS failed:", err));
      }

      return result;
    } catch (error) {
      console.error("Error booking appointment:", error);
      throw error;
    }
  },

  async getAppointmentsByFacility(facilityId, limitNum = 200) {
    try {
      const q = [where('facilityId', '==', facilityId), orderBy('date', 'desc'), limit(limitNum)];
      return await firestoreService.getAll(this.collection, q);
    } catch (error) {
      console.error("Error with indexed appointments query:", error);
      if (error.code === 'failed-precondition') {
        const q = [where('facilityId', '==', facilityId)];
        const results = await firestoreService.getAll(this.collection, q);
        return results.sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, limitNum);
      }
      return [];
    }
  },

  async getPatientLatestVisit(patientId) {
    const q = [where('patientId', '==', patientId), orderBy('date', 'desc'), limit(1)];
    return firestoreService.getAll(this.collection, q);
  },

  async updateAppointmentStatus(id, status) {
    return firestoreService.update(this.collection, id, { status });
  },

  async updateAppointment(id, data) {
    return firestoreService.update(this.collection, id, data);
  },

  async deleteAppointment(id) {
    return firestoreService.delete(this.collection, id);
  },

  async getAppointmentsByDoctor(doctorId, facilityId) {
    const q = [where('provider', '==', doctorId), where('facilityId', '==', facilityId)];
    const results = await firestoreService.getAll(this.collection, q);
    return results.sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  async getArrivedAppointments(facilityId) {
    // Include arrived, triage, calling, and in-session for doctor's queue
    const q = [where('status', 'in', ['arrived', 'triage', 'calling', 'in-session'])];
    if (facilityId) q.push(where('facilityId', '==', facilityId));
    const results = await firestoreService.getAll(this.collection, q);
    return results.sort((a, b) => new Date(a.date) - new Date(a.date) || (a.time || '00:00').localeCompare(b.time || '00:00'));
  }
};

export default appointmentService;
