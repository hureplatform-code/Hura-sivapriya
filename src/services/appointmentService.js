import firestoreService from './firestoreService';
import { where, orderBy, limit } from 'firebase/firestore';
import smsSettingsService from './smsSettingsService';

const appointmentService = {
  collection: firestoreService.collections.appointments,

  async getAllAppointments(facilityId) {
    const q = facilityId ? [where('facilityId', '==', facilityId)] : [];
    return firestoreService.getAll(this.collection, q);
  },

  async getAppointmentById(id) {
    if (!id) return null;
    return firestoreService.getById(this.collection, id);
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
    return results.sort((a, b) => new Date(a.date) - new Date(b.date) || (a.time || '00:00').localeCompare(b.time || '00:00'));
  },

  async getPharmacyQueue(facilityId) {
    const q = [where('status', '==', 'awaiting-pharmacy')];
    if (facilityId) q.push(where('facilityId', '==', facilityId));
    const results = await firestoreService.getAll(this.collection, q);
    return results.sort((a, b) => new Date(a.date) - new Date(b.date) || (a.time || '00:00').localeCompare(b.time || '00:00'));
  },

  async getPharmacyData(facilityId) {
    if (!facilityId) return [];
    
    // 1. Fetch pending pharmacy requests
    const qPending = [where('status', '==', 'awaiting-pharmacy'), where('facilityId', '==', facilityId)];
    
    // 2. Fetch processed pharmacy requests (routed to billing, completed, or paid)
    const qProcessed = [where('status', 'in', ['completed', 'awaiting-billing', 'billed', 'paid']), where('facilityId', '==', facilityId), limit(300)];
    
    const [pending, processed] = await Promise.all([
      firestoreService.getAll(this.collection, qPending),
      firestoreService.getAll(this.collection, qProcessed)
    ]);
    
    const all = [...pending, ...processed];

    return all.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      if (dateB - dateA !== 0) return dateB - dateA;
      return (b.time || '00:00').localeCompare(a.time || '00:00');
    });
  },

  async getLaboratoryQueue(facilityId) {
    const q = [where('status', '==', 'awaiting-lab')];
    if (facilityId) q.push(where('facilityId', '==', facilityId));
    const results = await firestoreService.getAll(this.collection, q);
    return results.sort((a, b) => new Date(a.date) - new Date(b.date) || (a.time || '00:00').localeCompare(a.time || '00:00'));
  },

  async getLaboratoryData(facilityId) {
    if (!facilityId) return [];
    
    // Fetch pending lab requests
    const qPending = [where('status', '==', 'awaiting-lab'), where('facilityId', '==', facilityId)];
    
    // Fetch completed lab requests (including those sent to billing or finalized)
    const qProcessed = [where('status', 'in', ['completed', 'awaiting-billing', 'billed', 'paid', 'awaiting-pharmacy']), where('facilityId', '==', facilityId), limit(300)];
    
    // Fetch patients who were returned to clinical queue after lab (status 'arrived')
    const qReturned = [where('status', 'in', ['arrived', 'calling', 'in-session', 'triage', 'awaiting-nurse']), where('facilityId', '==', facilityId), limit(300)];
    
    const [pending, processed, returned] = await Promise.all([
      firestoreService.getAll(this.collection, qPending),
      firestoreService.getAll(this.collection, qProcessed),
      firestoreService.getAll(this.collection, qReturned)
    ]);
    
    // Combine and Filter returned to only include those that HAVE lab data
    const validReturned = returned.filter(a => a.labResults || a.structuredResults?.length > 0 || a.labCompletedAt);

    const all = [...pending, ...processed, ...validReturned];

    // Sort by date (desc) and then time (desc) to ensure newest is always first
    return all.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      if (dateB - dateA !== 0) return dateB - dateA;
      
      const timeA = a.time || '00:00';
      const timeB = b.time || '00:00';
      return timeB.localeCompare(timeA);
    });
  },

  async getBillingQueue(facilityId) {
    const q = [where('status', 'in', ['awaiting-billing', 'billed', 'paid'])];
    if (facilityId) q.push(where('facilityId', '==', facilityId));
    const results = await firestoreService.getAll(this.collection, q);
    return results.sort((a, b) => new Date(b.date) - new Date(a.date) || (b.time || '00:00').localeCompare(a.time || '00:00'));
  },

  async getNursingQueue(facilityId) {
    const q = [where('status', '==', 'awaiting-nurse')];
    if (facilityId) q.push(where('facilityId', '==', facilityId));
    const results = await firestoreService.getAll(this.collection, q);
    return results.sort((a, b) => new Date(a.date) - new Date(b.date) || (a.time || '00:00').localeCompare(b.time || '00:00'));
  }
};

export default appointmentService;
