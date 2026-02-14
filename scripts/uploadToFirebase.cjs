const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// 1. Download your Service Account Key from Firebase Console
// 2. Save it as 'scripts/serviceAccountKey.json'
// 3. Update the databaseURL below
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://your-project-id.firebaseio.com"
});

const db = admin.firestore();
const payloadPath = path.join(__dirname, 'migration_payload.json');

async function uploadData() {
  try {
    const data = JSON.parse(fs.readFileSync(payloadPath, 'utf8'));
    console.log('Starting upload...');

    // Upload Users
    console.log(`Uploading ${data.users.length} users...`);
    for (const user of data.users) {
      await db.collection('users').add({
        ...user,
        migrated: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    // Upload Doctors
    console.log(`Uploading ${data.doctors.length} doctors...`);
    for (const doc of data.doctors) {
      await db.collection('doctors').add({
        ...doc,
        migrated: true
      });
    }

    // Upload Appointments
    console.log(`Uploading ${data.appointments.length} appointments...`);
    for (const appt of data.appointments) {
      await db.collection('appointments').add({
        ...appt,
        migrated: true
      });
    }

    console.log('\nMigration successful!');
    process.exit(0);
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.error('Error: scripts/serviceAccountKey.json not found.');
      console.log('Please download it from Firebase Console -> Project Settings -> Service Accounts');
    } else {
      console.error('Migration failed:', error);
    }
    process.exit(1);
  }
}

uploadData();
