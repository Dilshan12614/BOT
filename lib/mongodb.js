const fs = require('fs');
const path = require('path');

// Local database JSON file එක පිහිටි ස්ථානය
const dbPath = path.join(__dirname, '../local_database.json');

const defaultEnvVariables = [
    { key: 'ALIVE_IMG', value: 'https://telegra.ph' },
    { key: 'ALIVE_MSG', value: 'Hello , I am alive now!!' },
    { key: 'PREFIX', value: '.' },
    { key: 'AUTO_READ_STATUS', value: 'true' },
    { key: 'MODE', value: 'private' },
];

// බොට් එක එකදිගටම Loop වීම වැළැක්වීමට flag එකක් භාවිතය
let isConnected = false;

const connectDB = async () => {
    // දැනටමත් කනෙක්ට් වී ඇත්නම් නැවත ධාවනය නොකර කෙලින්ම return කරන්න
    if (isConnected) return;

    try {
        let dbData = {};

        if (fs.existsSync(dbPath)) {
            const fileContent = fs.readFileSync(dbPath, 'utf-8');
            dbData = JSON.parse(fileContent || '{}');
        }

        let updated = false;
        for (const envVar of defaultEnvVariables) {
            if (dbData[envVar.key] === undefined) {
                dbData[envVar.key] = envVar.value;
                updated = true;
            }
        }

        if (updated) {
            fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 4));
        }

        console.log('📂 Local JSON Database Connected ✅ (No MongoDB Required)');
        isConnected = true; // Connection එක සාර්ථක බව සලකුණු කරයි

    } catch (err) {
        console.error('❌ Database error:', err.message);
        // Error එකක් ආවත් බොට් එක නතර නොවී දිගටම කරගෙන යාමට ඉඩ දෙන්න
        isConnected = true; 
    }
};

module.exports = connectDB;
