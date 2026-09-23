const fs = require('fs');
const path = require('path');

// Local database JSON file එක පිහිටි ස්ථානය
const dbPath = path.join(__dirname, '../local_database.json');

// JSON ගොනුව කියවීමේ සහ ලිවීමේ උපකාරක ශ්‍රිත (Helper Functions)
const readDB = () => {
    try {
        if (!fs.existsSync(dbPath)) return {};
        const content = fs.readFileSync(dbPath, 'utf-8');
        return JSON.parse(content || '{}');
    } catch (e) {
        console.error("❌ Local DB කියවීමේ දෝෂයක්:", e.message);
        return {};
    }
};

const writeDB = (data) => {
    try {
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 4));
    } catch (e) {
        console.error("❌ Local DB ලිවීමේ දෝෂයක්:", e.message);
    }
};

// MongoDB Mongoose ශ්‍රිතයන් Local JSON එකට ගැළපෙන සේ අනුකරණය කිරීම (Mock Object)
const EnvVar = {
    // දත්තයක් සෙවීම සඳහා (උදා: EnvVar.findOne({ key: 'PREFIX' }))
    findOne: async (query) => {
        const db = readDB();
        const key = query.key;
        if (db[key] !== undefined) {
            return { key: key, value: db[key] };
        }
        return null; // දත්තය නැත්නම් null ලබා දෙයි
    },

    // අලුතින් දත්තයක් ඇතුළත් කිරීම සඳහා
    create: async (data) => {
        const db = readDB();
        db[data.key] = data.value;
        writeDB(db);
        return { key: data.key, value: data.value };
    },

    // දැනට පවතින දත්තයක් යාවත්කාලීන කිරීම සඳහා
    updateOne: async (query, updateData) => {
        const db = readDB();
        const key = query.key;
        
        // $set ක්‍රමයට හෝ කෙලින්ම අගය එවා ඇත්නම් එය ලබා ගැනීම
        const newValue = updateData.$set ? updateData.$set.value : updateData.value;
        
        if (db[key] !== undefined && newValue !== undefined) {
            db[key] = newValue;
            writeDB(db);
            return { acknowledged: true, modifiedCount: 1 };
        }
        return { acknowledged: true, modifiedCount: 0 };
    }
};

module.exports = EnvVar;
