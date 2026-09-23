const fs = require('fs');
const path = require('path');

// Local database JSON file එක සකසන තැන
const dbPath = path.join(__dirname, '../local_database.json');

const defaultEnvVariables = [
    { key: 'ALIVE_IMG', value: 'https://telegra.ph/file/6d91fd79aab5663032b97.jpg' },
    { key: 'ALIVE_MSG', value: 'Hello , I am alive now!!' },
    { key: 'PREFIX', value: '.' },
    { key: 'AUTO_READ_STATUS', value: 'true' },
    { key: 'MODE', value: 'private' },
];

// Local JSON connection function
const connectDB = async () => {
    try {
        let dbData = {};

        // JSON file එක දැනටමත් තියෙනවාද කියා බැලීම
        if (fs.existsSync(dbPath)) {
            const fileContent = fs.readFileSync(dbPath, 'utf-8');
            dbData = JSON.parse(fileContent || '{}');
        }

        console.log('📂 Local JSON Database Connected ✅ (No MongoDB Required)');

        // Default පරිසර විචල්‍යයන් (env vars) පරීක්ෂා කර ඇතුළත් කිරීම
        let updated = false;
        for (const envVar of defaultEnvVariables) {
            if (!dbData[envVar.key]) {
                dbData[envVar.key] = envVar.value;
                console.log(`➕ Created default local env var: ${envVar.key}`);
                updated = true;
            }
        }

        // අලුතින් යමක් එකතු වූවා නම් file එක update කිරීම
        if (updated) {
            fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 4));
        }

    } catch (err) {
        console.error('❌ Database error:', err.message);
        process.exit(1);
    }
};

module.exports = connectDB;
