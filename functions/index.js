const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });
admin.initializeApp();

const db = admin.firestore();

// Africa's Talking Configuration
const AT_USERNAME = 'hure';
const AT_API_KEY = 'atsk_a86f99355b2b1943463d11410cb99009381a7250917f9d4f7a27779cf96929c29b8878b9';

const AfricasTalking = require('africastalking')({
    apiKey: AT_API_KEY,
    username: AT_USERNAME
});
const smsProvider = AfricasTalking.SMS;

// ─────────────────────────────────────────────
// SMS HELPER & WALLET SYSTEM
// ─────────────────────────────────────────────

async function deductWalletBalance(facilityId, count = 1) {
    const profileRef = db.collection('hospital_profile').doc(facilityId);
    return db.runTransaction(async (transaction) => {
        const doc = await transaction.get(profileRef);
        if (!doc.exists) throw new Error("Facility not found");
        
        let currentBalance = doc.data().smsWalletBalance || 0;
        if (currentBalance < count) {
            throw new Error(`Insufficient SMS Balance. Current: ${currentBalance}`);
        }
        
        transaction.update(profileRef, {
            smsWalletBalance: currentBalance - count
        });
    });
}

function getReminderTemplate(language, clinicName, date, time) {
    const eng = `${clinicName}: This is a reminder that your appointment is scheduled on ${date} at ${time}. Reply YES to confirm or NO to reschedule.`;
    const swa = `${clinicName}: Hii ni ukumbusho kwamba miadi yako imepangwa tarehe ${date} saa ${time}. Jibu YES kuthibitisha au NO kubadilisha muda.`;

    if (language === 'Swahili') return `HURECARE\n${swa}`;
    if (language === 'Both') return `HURECARE\n${eng}\n\n${clinicName}: Hii ni ukumbusho kwamba miadi yako imepangwa tarehe ${date} saa ${time}. Jibu YES kuthibitisha au NO kubadilisha muda.`;
    
    // Default English
    return `HURECARE\n${eng}`;
}

async function sendSmsLogic(facilityId, phone, message, type = 'reminder', meta = {}) {
    try {
        // 1. Check & Deduct Wallet Balance
        await deductWalletBalance(facilityId, 1);
        
        // 2. Format phone number (Africa's talking requires +254... format mostly)
        // Ensure phone starts with +
        let toPhone = phone.trim();
        if (!toPhone.startsWith('+')) {
            // Assume Kenyan default if no plus
            if (toPhone.startsWith('0')) toPhone = '+254' + toPhone.substring(1);
            else toPhone = '+' + toPhone;
        }

        // 3. Send SMS via Africa's Talking
        const options = {
            to: [toPhone],
            message: message,
            // from: 'HURECARE' // To use this, you need an approved sender ID
        };
        const response = await smsProvider.send(options);
        
        // 4. Log to Firestore
        const msgData = response.SMSMessageData;
        const recipient = msgData.Recipients[0];
        
        const logEntry = {
            facilityId,
            to: toPhone,
            body: message,
            type,
            provider_message_id: recipient.messageId || 'unknown',
            cost: recipient.cost || '0',
            delivery_status: recipient.status || 'Sent',  // 'Success' / 'Sent' / 'Failed'
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
            patientId: meta.patientId || null,
            appointmentId: meta.appointmentId || null,
            retried: false
        };

        await db.collection('sms_logs').add(logEntry);
        functions.logger.info(`SMS Sent via AT to ${toPhone}. MsgId: ${recipient.messageId}`);
        return { success: true, messageId: recipient.messageId };

    } catch (err) {
        functions.logger.error(`SMS send failed for ${facilityId} to ${phone}:`, err);
        // Log the failure
        await db.collection('sms_logs').add({
            facilityId,
            to: phone,
            body: message,
            type,
            delivery_status: 'Failed',
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
            error: err.message,
            patientId: meta.patientId || null,
            appointmentId: meta.appointmentId || null,
            retried: false
        });
        return { success: false, error: err.message };
    }
}

// ─────────────────────────────────────────────
// HTTP: Manually trigger an SMS (used by internal dashboard)
// ─────────────────────────────────────────────

exports.sendManualSms = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
        const { facilityId, to, message } = req.body;
        
        if (!facilityId || !to || !message) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const result = await sendSmsLogic(facilityId, to, message, 'manual');
        if (result.success) {
            return res.status(200).json(result);
        } else {
            return res.status(500).json(result);
        }
    });
});

// ─────────────────────────────────────────────
// TRIGGER: On Appointment Created (Immediate Confirmation)
// ─────────────────────────────────────────────

exports.onAppointmentCreated = functions.firestore
    .document('appointments/{appointmentId}')
    .onCreate(async (snap, context) => {
        const apt = snap.data();
        const facilityId = apt.facilityId;

        const phone = apt.patientPhone || apt.phone;
        if (!phone) return null;

        try {
            const facDoc = await db.collection('hospital_profile').doc(facilityId).get();
            const facility = facDoc.exists ? facDoc.data() : { name: 'HURE Clinic', smsLanguage: 'English' };

            const lang = facility.smsLanguage || 'English';
            const clName = facility.name || 'HURE Clinic';
            const { date, time } = apt;

            let msg = '';
            const eng = `Hi ${apt.patient || 'there'}, your appointment at ${clName} is booked for ${date} at ${time}. We will send you a reminder before the date.`;
            const swa = `Hujambo ${apt.patient || ''}, miadi yako katika ${clName} imethibitishwa tarehe ${date} saa ${time}. Tutakutumia ukumbusho kabla ya tarehe.`;

            if (lang === 'Swahili') msg = `HURECARE\n${swa}`;
            else if (lang === 'Both') msg = `HURECARE\n${eng}\n\n${swa}`;
            else msg = `HURECARE\n${eng}`;

            await sendSmsLogic(facilityId, phone, msg, 'booking_confirmation', {
                appointmentId: snap.id,
                patientId: apt.patientId || null
            });
            
        } catch (error) {
            functions.logger.error("Error sending booking confirmation SMS:", error);
        }
        return null;
    });

// ─────────────────────────────────────────────
// CRON: 8:00 AM EAT Scheduled Reminders
// ─────────────────────────────────────────────

exports.scheduledMorningReminders = functions.pubsub
    .schedule('0 8 * * *')
    .timeZone('Africa/Nairobi')
    .onRun(async (context) => {
        functions.logger.info("Running 8:00 AM Morning Reminders...");
        
        // Target dates: Today (Morning of), Tomorrow (1-day before), Day-after (2-days before)
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        const twoDaysOut = new Date();
        twoDaysOut.setDate(today.getDate() + 2);
        const twoDaysOutStr = twoDaysOut.toISOString().split('T')[0];

        // Fetch target appointments
        const snap = await db.collection('appointments').where('date', 'in', [todayStr, tomorrowStr, twoDaysOutStr]).get();
        if (snap.empty) {
            functions.logger.info("No appointments to remind.");
            return null;
        }

        const facilitiesCache = {};

        for (const doc of snap.docs) {
            const apt = doc.data();
            // Skip already confirmed or cancelled apps
            if (apt.status === 'cancelled' || apt.status === 'completed') continue;
            
            // For today and tomorrow: only send if NOT confirmed
            if ((apt.date === tomorrowStr || apt.date === todayStr) && apt.status === 'confirmed') continue;

            const phone = apt.patientPhone || apt.phone;
            if (!phone) continue;

            // Load facility settings
            if (!facilitiesCache[apt.facilityId]) {
                const facDoc = await db.collection('hospital_profile').doc(apt.facilityId).get();
                facilitiesCache[apt.facilityId] = facDoc.exists ? facDoc.data() : { name: 'HURE Clinic', smsLanguage: 'English' };
            }
            const facility = facilitiesCache[apt.facilityId];
            
            const msg = getReminderTemplate(facility.smsLanguage || 'English', facility.name, apt.date, apt.time);
            
            // Send
            await sendSmsLogic(apt.facilityId, phone, msg, 'reminder', {
                appointmentId: doc.id,
                patientId: apt.patientId
            });
        }
        return null;
    });

// ─────────────────────────────────────────────
// CRON: 1:00 PM EAT Unconfirmed Appointments Mark
// ─────────────────────────────────────────────

exports.scheduledUnconfirmedMarker = functions.pubsub
    .schedule('0 13 * * *')
    .timeZone('Africa/Nairobi')
    .onRun(async (context) => {
        functions.logger.info("Running 1:00 PM Unconfirmed Marker...");
        
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        // Find appointments for tomorrow that are still 'scheduled' (not explicitly confirmed)
        const snap = await db.collection('appointments')
            .where('date', '==', tomorrowStr)
            .where('status', '==', 'scheduled')
            .get();

        const batch = db.batch();
        snap.docs.forEach(doc => {
            batch.update(doc.ref, { status: 'not_confirmed' });
        });

        if (!snap.empty) {
            await batch.commit();
            functions.logger.info(`Marked ${snap.size} appointments as not_confirmed`);
        }
        return null;
    });


// ─────────────────────────────────────────────
// WEBHOOK: Patient Reply Logic (Incoming SMS)
// ─────────────────────────────────────────────

exports.smsReplyWebhook = functions.https.onRequest(async (req, res) => {
    // SMS provider POSTs to this endpoint
    const { from, to, text, date, id } = req.body;
    
    if (!from || !text) {
        return res.status(200).send("Ignored");
    }

    const replyBody = text.trim().toUpperCase();
    
    // 1. Find the latest appointment for this phone number
    // Formats vary, so we'll do a simple match if possible or we query appointments
    // Given the difficulty of matching raw phone numbers, we'll strip the leading `+`
    const cleanPhone = from.startsWith('+') ? from.substring(1) : from;

    try {
        const aptQuery = await db.collection('appointments')
            // This assumes patientPhone is stored cleanly. In production, an exact match might require formatting normalized numbers.
            .where('status', 'in', ['scheduled', 'not_confirmed'])
            .get();
        
        // Find appointment matching phone
        let targetAptDoc = null;
        for (let doc of aptQuery.docs) {
            const apt = doc.data();
            const dbPhone = (apt.patientPhone || apt.phone || '').replace('+', '');
            if (dbPhone === cleanPhone) {
                targetAptDoc = doc;
                break;
            }
        }

        if (targetAptDoc) {
            const aptData = targetAptDoc.data();
            let newStatus = aptData.status;

            if (replyBody === 'YES') {
                newStatus = 'confirmed';
            } else if (replyBody === 'NO') {
                newStatus = 'reschedule_requested';
            } else {
                newStatus = 'needs_review';
            }

            // Update appointment
            await targetAptDoc.ref.update({
                status: newStatus,
                lastSmsReply: text,
                lastSmsReplyAt: admin.firestore.FieldValue.serverTimestamp()
            });

            functions.logger.info(`Updated appt ${targetAptDoc.id} status to ${newStatus} based on SMS reply from ${from}`);
        } else {
            functions.logger.info(`Received SMS reply from ${from} but found no matching active appointment.`);
        }

        // Always log incoming SMS
        await db.collection('sms_logs').add({
            type: 'incoming',
            from: from,
            body: text,
            provider_message_id: id,
            receivedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(200).send("Success");
    } catch (err) {
        functions.logger.error("Error processing SMS reply webhook", err);
        res.status(500).send("Error");
    }
});


// ─────────────────────────────────────────────
// WEBHOOK: SMS Delivery Reports
// ─────────────────────────────────────────────

exports.smsDeliveryWebhook = functions.https.onRequest(async (req, res) => {
    const { id, status, failureReason } = req.body;
    
    if (!id || !status) return res.status(200).send("Ignored");

    try {
        // Find the log
        const logsRef = db.collection('sms_logs');
        const snap = await logsRef.where('provider_message_id', '==', id).limit(1).get();

        if (!snap.empty) {
            const logDoc = snap.docs[0];
            const logData = logDoc.data();

            await logDoc.ref.update({
                delivery_status: status,
                failureReason: failureReason || null,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            // RETRY LOGIC (Failed & not retried)
            if (status === 'Failed' && !logData.retried) {
                functions.logger.info(`Message ${id} failed. Queueing retry...`);
                
                // Mark as retried
                await logDoc.ref.update({ retried: true });

                // We can't use setTimeout accurately in Serverless. 
                // A Pub/Sub or Cloud Tasks is better, but as a basic approach for "after 10 minutes",
                // we'll schedule a write to a 'sms_retry_queue' collection which another 10m CRON job can pick up.
                await db.collection('sms_retry_queue').add({
                    facilityId: logData.facilityId,
                    phone: logData.to,
                    message: logData.body,
                    type: logData.type,
                    patientId: logData.patientId || null,
                    appointmentId: logData.appointmentId || null,
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                });
            }
        }
        
        res.status(200).send("Success");
    } catch (err) {
        functions.logger.error("Error in delivery webhook", err);
        res.status(500).send("Error");
    }
});

// ─────────────────────────────────────────────
// CRON: Process Retry Queue Every 10 Mins
// ─────────────────────────────────────────────

exports.processSmsRetryQueue = functions.pubsub
    .schedule('every 10 minutes')
    .onRun(async (context) => {
        const snap = await db.collection('sms_retry_queue').get();
        if (snap.empty) return null;

        const batchArray = [];
        let batch = db.batch();
        let i = 0;

        for (const doc of snap.docs) {
            const q = doc.data();
            
            // Re-send logic (bypass deduction if already paid for initially? 
            // The requirement doesn't specify if retries cost SMS. We will deduct again via sendSmsLogic, 
            // or we could skip deduction. Let's assume AT deducts only on success)
            await sendSmsLogic(q.facilityId, q.phone, q.message, `${q.type}_retry`, {
                appointmentId: q.appointmentId,
                patientId: q.patientId
            });

            batch.delete(doc.ref);
            i++;

            if (i === 500) {
                batchArray.push(batch.commit());
                batch = db.batch();
                i = 0;
            }
        }

        if (i > 0) batchArray.push(batch.commit());
        await Promise.all(batchArray);

        functions.logger.info(`Processed ${snap.size} retries.`);
        return null;
    });
