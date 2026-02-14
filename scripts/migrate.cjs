const fs = require('fs');
const path = require('path');

const sqlFilePath = path.join(__dirname, '../../hospitalerp-1.sql');

function parseSql(content) {
  const tables = {
    users: [],
    doctors: [],
    appointments: []
  };

  // Simple regex-based parsing for demo/base migration
  // Note: Real production migration would use a proper SQL parser
  
  // Extract INSERT INTO statements
  const insertRegex = /INSERT INTO `(\w+)` \((.*?)\) VALUES\s*([\s\S]*?);/g;
  let match;

  while ((match = insertRegex.exec(content)) !== null) {
    const tableName = match[1];
    const columns = match[2].split(',').map(c => c.trim().replace(/`/g, ''));
    const entries = match[3].split('),').map(e => e.trim().replace(/^\(|\)$/g, ''));

    entries.forEach(entry => {
      // Split by comma but ignore commas inside quotes
      const values = entry.match(/('([^']|'')*'|[^,]+)/g).map(v => v.trim().replace(/^'|'$/g, ''));
      const obj = {};
      columns.forEach((col, i) => {
        obj[col] = values[i];
      });

      if (tableName === 'admin') {
        tables.users.push({
          name: obj.name,
          username: obj.username,
          email: obj.email_id,
          role: obj.role === '1' ? 'superadmin' : obj.role === '2' ? 'doctor' : 'clinic_owner',
          status: obj.admin_status === '1' ? 'active' : 'inactive'
        });
      } else if (tableName === 'acc_agent_group' && obj.acc_agent_id !== '1') {
        tables.doctors.push({
          name: obj.acc_agent_name,
          email: obj.acc_email,
          mobile: obj.acc_mobile,
          address: obj.acc_agent_address,
          status: obj.status === '0' ? 'active' : 'inactive'
        });
      } else if (tableName === 'appointment') {
        tables.appointments.push({
          patientName: obj.app_patient_name,
          date: obj.app_date,
          time: obj.app_time,
          reason: obj.app_reason,
          status: 'scheduled'
        });
      }
    });
  }

  return tables;
}

try {
  const content = fs.readFileSync(sqlFilePath, 'utf8');
  const data = parseSql(content);
  console.log('Migration Data Prepared:');
  console.log(`- Users: ${data.users.length}`);
  console.log(`- Doctors: ${data.doctors.length}`);
  console.log(`- Appointments: ${data.appointments.length}`);
  
  fs.writeFileSync(path.join(__dirname, 'migration_payload.json'), JSON.stringify(data, null, 2));
  console.log('\nPayload saved to scripts/migration_payload.json');
} catch (error) {
  console.error('Migration failed:', error);
}
