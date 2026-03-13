import firestoreService from './firestoreService';
import { where, orderBy, limit } from 'firebase/firestore';

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
    return firestoreService.create(this.collection, {
      ...appointmentData,
      status: 'scheduled'
    });
  },

  async getAppointmentsByFacility(facilityId) {
    const q = [where('facilityId', '==', facilityId), orderBy('date', 'desc')];
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
    const q = [where('status', '==', 'arrived')];
    if (facilityId) q.push(where('facilityId', '==', facilityId));
    const results = await firestoreService.getAll(this.collection, q);
    return results.sort((a, b) => new Date(b.date) - new Date(a.date));
  }
};

export default appointmentService;
