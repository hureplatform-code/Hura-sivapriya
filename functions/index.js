/**
 * HURA Hospital Platform — Firebase Cloud Functions
 * 
 * Twilio SMS Notification System
 * 
 * TRIGGERS:
 * 1. sendAppointmentSms      → Fires on new appointment created in Firestore
 * 2. sendAppointmentUpdateSms → Fires when appointment status changes
 * 3. sendAppointmentSms (HTTP)→ HTTP endpoint for test SMS from admin panel
 *
 * SETUP:
 * 1. cd functions && npm install
 * 2. firebase deploy --only functions
 *
 * FIRESTORE CREDENTIALS LOCATION:
 * Collection: settings / Document: sms_{facilityId}
 * Fields: accountSid, authToken, fromNumber, enabled (bool)
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

/**
 * Load Twilio credentials from Firestore for a facility
 */
async function getTwilioConfig(facilityId) {
  const docId = facilityId ? `sms_${facilityId}` : 'sms_config';
  const snap = await db.collection('settings').doc(docId).get();
  if (!snap.exists) return null;
  const data = snap.data();
  if (!data.enabled || !data.accountSid || !data.authToken || !data.fromNumber) return null;
  return data;
}

/**
 * Build the SMS body from appointment data
 */
function buildSmsBody(appointment, clinicName) {
  const name = appointment.patient || 'there';
  const date = appointment.date || 'your scheduled date';
  const time = appointment.time || 'your scheduled time';
  const doctor = appointment.provider || 'your doctor';
  const clinic = clinicName || 'the clinic';
  return `Hi ${name}, your appointment is confirmed for ${date} at ${time} with Dr. ${doctor}. Reply CANCEL to cancel. – ${clinic}`;
}

/**
 * Build cancellation SMS
 */
function buildCancelSmsBody(appointment, clinicName) {
  const name = appointment.patient || 'there';
  const date = appointment.date || '';
  const clinic = clinicName || 'the clinic';
  return `Hi ${name}, your appointment on ${date} at ${clinicName} has been cancelled. Call us to rebook. – ${clinic}`;
}

/**
 * Send SMS using Twilio
 */
async function sendSms(config, to, body) {
  const twilio = require('twilio');
  const client = twilio(config.accountSid, config.authToken);
  const msg = await client.messages.create({
    body,
    from: config.fromNumber,
    to,
  });
  functions.logger.info(`SMS sent: ${msg.sid} → ${to}`);
  return msg.sid;
}

/**
 * Get facility name from Firestore
 */
async function getFacilityName(facilityId) {
  if (!facilityId) return 'HURA Clinic';
  try {
    const snap = await db.collection('hospital_profile').doc(facilityId).get();
    if (snap.exists) return snap.data().name || 'HURA Clinic';
  } catch (_) {}
  return 'HURA Clinic';
}

// ─────────────────────────────────────────────
// TRIGGER 1: New Appointment Created
// ─────────────────────────────────────────────

exports.onAppointmentCreated = functions.firestore
  .document('appointments/{appointmentId}')
  .onCreate(async (snap, context) => {
    const appointment = snap.data();
    const facilityId = appointment.facilityId;

    // Only send if patient has a phone number
    const phone = appointment.patientPhone || appointment.phone;
    if (!phone) {
      functions.logger.info('No phone number on appointment. Skipping SMS.');
      return null;
    }

    const config = await getTwilioConfig(facilityId);
    if (!config) {
      functions.logger.info('SMS not configured or disabled for this facility.');
      return null;
    }

    const clinicName = await getFacilityName(facilityId);
    const body = buildSmsBody(appointment, clinicName);

    try {
      const sid = await sendSms(config, phone, body);
      // Log SMS send to Firestore
      await db.collection('sms_logs').add({
        appointmentId: context.params.appointmentId,
        facilityId,
        to: phone,
        body,
        sid,
        type: 'confirmation',
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      functions.logger.error('Failed to send appointment SMS:', error);
    }

    return null;
  });

// ─────────────────────────────────────────────
// TRIGGER 2: Appointment Status Changed
// ─────────────────────────────────────────────

exports.onAppointmentUpdated = functions.firestore
  .document('appointments/{appointmentId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Only act when status changes
    if (before.status === after.status) return null;

    const facilityId = after.facilityId;
    const phone = after.patientPhone || after.phone;
    if (!phone) return null;

    const config = await getTwilioConfig(facilityId);
    if (!config) return null;

    const clinicName = await getFacilityName(facilityId);
    let body = null;

    if (after.status === 'cancelled') {
      body = buildCancelSmsBody(after, clinicName);
    } else if (after.status === 'rescheduled') {
      body = buildSmsBody(after, clinicName);
    } else if (after.status === 'completed') {
      // Thank-you message
      const name = after.patient || 'there';
      body = `Hi ${name}, thank you for visiting ${clinicName}. We hope you feel better soon! – ${clinicName}`;
    }

    if (!body) return null;

    try {
      const sid = await sendSms(config, phone, body);
      await db.collection('sms_logs').add({
        appointmentId: context.params.appointmentId,
        facilityId,
        to: phone,
        body,
        sid,
        type: `status_${after.status}`,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      functions.logger.error('Failed to send status update SMS:', error);
    }

    return null;
  });

// ─────────────────────────────────────────────
// HTTP ENDPOINT: Test SMS from Admin Panel
// ─────────────────────────────────────────────

exports.sendAppointmentSms = functions.https.onRequest(async (req, res) => {
  // Allow CORS from frontend
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed');
    return;
  }

  const { facilityId, to, body: customBody, test } = req.body;

  if (!to) {
    res.status(400).json({ error: 'Missing "to" phone number.' });
    return;
  }

  const config = await getTwilioConfig(facilityId);
  if (!config) {
    res.status(404).json({ error: 'SMS is not configured or is disabled for this facility.' });
    return;
  }

  const body = customBody || 'Test message from HURA platform. Your Twilio SMS integration is working correctly!';

  try {
    const sid = await sendSms(config, to, body);
    if (test) {
      await db.collection('sms_logs').add({
        facilityId,
        to,
        body,
        sid,
        type: 'test',
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    res.status(200).json({ success: true, sid });
  } catch (error) {
    functions.logger.error('HTTP SMS send failed:', error);
    res.status(500).json({ error: error.message });
  }
});
