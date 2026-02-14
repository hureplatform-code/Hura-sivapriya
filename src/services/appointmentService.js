import firestoreService from './firestoreService';
import { where, orderBy } from 'firebase/firestore';

const appointmentService = {
  collection: firestoreService.collections.appointments,

  async getAllAppointments() {
    return firestoreService.getAll(this.collection);
  },

  async getRecentAppointments() {
    return firestoreService.getAll(this.collection, [
      orderBy('createdAt', 'desc'),
      limit(10)
    ]);
  },

  async bookAppointment(appointmentData) {
    return firestoreService.create(this.collection, {
      ...appointmentData,
      status: 'scheduled'
    });
  },

  async updateAppointmentStatus(id, status) {
    return firestoreService.update(this.collection, id, { status });
  },

  async getAppointmentsByDoctor(doctorId) {
    const q = [where('provider', '==', doctorId)];
    const results = await firestoreService.getAll(this.collection, q);
    return results.sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  async getArrivedAppointments() {
    const q = [where('status', '==', 'arrived')];
    const results = await firestoreService.getAll(this.collection, q);
    return results.sort((a, b) => new Date(b.date) - new Date(a.date));
  }
};

export default appointmentService;
