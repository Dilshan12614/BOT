const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}
module.exports = {
SESSION_ID: process.env.SESSION_ID || "0V0zRBxQ#CL9kpxfWuRQ4qXJwq-GsH3KBLpJJZuTflx2eJHLqzPI",
MONGODB: process.env.MONGODB || "local"
};
