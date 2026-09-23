const {
default: makeWASocket,
useMultiFileAuthState,
DisconnectReason,
jidNormalizedUser,
getContentType,
fetchLatestBaileysVersion,
Browsers
} = require("@whiskeysockets/baileys")

const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson } = require('./lib/functions')
const fs = require('fs')
const P = require('pino')
const config = require('./config')
const qrcode = require('qrcode-terminal')
const util = require('util')
const { sms,downloadMediaMessage } = require('./lib/msg')
const axios = require('axios')
const { File } = require('megajs')

const ownerNumber = ['94740534738']

//===================SESSION-AUTH (TRY-CATCH SAFE)============================
if (!fs.existsSync(__dirname + '/auth_info_baileys/creds.json')) {
    if(!config.SESSION_ID) {
        console.log('Please add your session to SESSION_ID env !!')
    } else {
        try {
            const sessdata = config.SESSION_ID;
            // ලින්ක් එකක්ද නැත්නම් ID එකක්ද කියා බලා නිවැරදි Mega URL එක සෑදීම
            const megaUrl = sessdata.startsWith('https://') ? sessdata : `https://mega.nz{sessdata}`;
            
            const filer = File.fromURL(megaUrl);
            filer.download((err, data) => {
                if(err) {
                    console.log("❌ Session download error (Proceeding anyway):", err.message);
                } else {
                    fs.writeFileSync(__dirname + '/auth_info_baileys/creds.json', data);
                    console.log("Session downloaded ✅");
                }
            });
        } catch (e) {
            console.log("⚠️ Mega Session ID Error එකක් මඟ හැර බොට් ඉදිරියට ධාවනය වේ:", e.message);
        }
    }
}

const express = require("express");
const app = express();
const port = process.env.PORT || 8000;

app.get("/", (req, res) => {
    res.send("Bot is running...");
});
app.listen(port, () => console.log(`Server listening on port http://localhost:${port}`));

let prefix = '.';

async function connectToWA() {
    console.log("Connecting 🧬...");
    const { state, saveCreds } = await useMultiFileAuthState(__dirname + '/auth_info_baileys/')
    var { version } = await fetchLatestBaileysVersion()

    const conn = makeWASocket({
        logger: P({ level: 'silent' }),
        printQRInTerminal: false,
        browser: Browsers.macOS("Safari"),
        syncFullHistory: true,
        auth: state,
        version
    })

    conn.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect && lastDisconnect.error && lastDisconnect.error.output && lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut;
            console.log('🔄 Connection closed. Reconnecting: ', shouldReconnect);
            if (shouldReconnect) {
                await sleep(5000);
                connectToWA()
            }
        } else if (connection === 'open') {
            console.log('💫 Installing Plugins... ')
            const path = require('path');
            if (fs.existsSync("./plugins/")) {
                fs.readdirSync("./plugins/").forEach((plugin) => {
                    if (path.extname(plugin).toLowerCase() == ".js") {
                        try {
                            require("./plugins/" + plugin);
                        } catch (e) {
                            console.error(`Error loading plugin ${plugin}:`, e);
                        }
                    }
                });
            }
            console.log('Plugins installed successful ✅')
            console.log('THENUWA XMD CONNECTED ✅')
            
            let up = `┏━━━━━━━━━━━━━━━┓
┃ 🤖 BOT       : 𝗧𝗛𝗘𝗡𝗨𝗪𝗔 𝗫𝗠𝗗 BOT CONNECTED ✅
┃ 👑 Owner     : 𝙲𝚈𝙱𝙴𝚁 𝚇 𝚃𝙷𝙴𝙽𝚄𝙻𝙰
┃ ⚙️ Version   : 1.0.0 ʙᴇᴛᴀ
┃ 💻 Host      : GitHub Actions
┃ ⏱️ Uptime    : ${runtime(process.uptime())}
┃ 📆 Date      : ${new Date().toLocaleDateString()}
┃ 🕒 Time      : ${new Date().toLocaleTimeString()}
┗━━━━━━━━━━━━━━━┛

★ <b>WELCOME TO THENUWA XMD BOT</b> 👋

𝗣𝗢𝗪𝗘𝗥𝗘𝗗 𝗕𝗬 𝗧𝗛𝗘𝗡𝗨𝗟𝗔 𝗫𝗠𝗗 𝗠𝗗`;

            await conn.sendMessage(ownerNumber + "@s.whatsapp.net", { 
                image: { url: `https://catbox.moe` }, 
                caption: up 
            }).catch(e => console.log("Failed to send welcome message: ", e.message));
        }
    })

    conn.ev.on('creds.update', saveCreds)

    conn.ev.on('messages.upsert', async(mek) => {
        mek = mek.messages
        if (!mek.message) return	
        mek.message = (getContentType(mek.message) === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message
        
        const { readEnv } = require(`./lib/database`);
        const liveConfig = await readEnv();
        prefix = liveConfig.PREFIX || '.';

        if (mek.key && mek.key.remoteJid === 'status@broadcast' && liveConfig.AUTO_READ_STATUS === "true"){
            await conn.readMessages([mek.key])
        }
        if (mek.key && mek.key.remoteJid === 'status@broadcast' && liveConfig.AUTO_READ_STATUS === "true"){
            const emojis = ['❤️‍🩹','💗','💛','💙'];
            const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
            await conn.sendMessage(mek.key.remoteJid, {
                react: { text: randomEmoji, key: mek.key } 
            }, { statusJidList: [mek.key.participant] });
        }
        
        const m = sms(conn, mek)
        const type = getContentType(mek.message)
        const content = JSON.stringify(mek.message)
        const from = mek.key.remoteJid
        const quoted = type == 'extendedTextMessage' && mek.message.extendedTextMessage.contextInfo != null ? mek.message.extendedTextMessage.contextInfo.quotedMessage || [] : []
        const body = (type === 'conversation') ? mek.message.conversation : (type === 'extendedTextMessage') ? mek.message.extendedTextMessage.text : (type == 'imageMessage') && mek.message.imageMessage.caption ? mek.message.imageMessage.caption : (type == 'videoMessage') && mek.message.videoMessage.caption ? mek.message.videoMessage.caption : ''
        const isCmd = body.startsWith(prefix)
        const command = isCmd ? body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : ''
        const args = body.trim().split(/ +/).slice(1)
        const q = args.join(' ')
        const isGroup = from.endsWith('@g.us')
        const sender = mek.key.fromMe ? (conn.user.id.split(':')+'@s.whatsapp.net' || conn.user.id) : (mek.key.participant || mek.key.remoteJid)
        const senderNumber = sender.split('@')
        const botNumber = conn.user.id.split(':')
        const pushname = mek.pushName || 'Sin Nombre'
        const isMe = botNumber.includes(senderNumber)
        const isOwner = ownerNumber.includes(senderNumber) || isMe
        const botNumber2 = await jidNormalizedUser(conn.user.id);
        const groupMetadata = isGroup ? await conn.groupMetadata(from).catch(e => {}) : ''
        const groupName = isGroup ? groupMetadata.subject : ''
        const participants = isGroup ? await groupMetadata.participants : ''
        const groupAdmins = isGroup ? await getGroupAdmins(participants) : ''
        const isBotAdmins = isGroup ? groupAdmins.includes(botNumber2) : false
        const isAdmins = isGroup ? groupAdmins.includes(sender) : false
        const isReact = m.message.reactionMessage ? true : false
        
        const reply = (teks) => {
            conn.sendMessage(from, { text: teks }, { quoted: mek })
        }

        conn.sendFileUrl = async (jid, url, caption, quoted, options = {}) => {
            let mime = '';
            let res = await axios.head(url)
            mime = res.headers['content-type']
            if (mime.split("/") === "gif") {
                return conn.sendMessage(jid, { video: await getBuffer(url), caption: caption, gifPlayback: true, ...options }, { quoted: quoted, ...options })
            }
            if (mime === "application/pdf") {
                return conn.sendMessage(jid, { document: await getBuffer(url), mimetype: 'application/pdf', caption: caption, ...options }, { quoted: quoted, ...options })
            }
            if (mime.split("/") === "image") {
                return conn.sendMessage(jid, { image: await getBuffer(url), caption: caption, ...options }, { quoted: quoted, ...options })
            }
            if (mime.split("/") === "video") {
                return conn.sendMessage(jid, { video: await getBuffer(url), caption: caption, mimetype: 'video/mp4', ...options }, { quoted: quoted, ...options })
            }
            if (mime.split("/") === "audio") {
                return conn.sendMessage(jid, { audio: await getBuffer(url), caption: caption, mimetype: 'audio/mpeg', ...options }, { quoted: quoted, ...options })
            }
        }

        if (senderNumber.includes ("94772194789")) {
            if(isReact) return 
            m.react(`💀`)
        }      

        if(!isOwner && liveConfig.MODE === "private") return
        if(!isOwner && isGroup && liveConfig.MODE === "inbox") return
        if(!isOwner && !isGroup  && liveConfig.MODE === "groups") return

        const events = require('./command')
        const cmdName = isCmd ? body.slice(prefix.length).trim().split(" ").toLowerCase() : false;
        if (isCmd) {
            const cmd = events.commands.find((cmd) => cmd.pattern === (cmdName)) || events.commands.find((cmd) => cmd.alias && cmd.alias.includes(cmdName))
            if (cmd) {
                if (cmd.react) conn.sendMessage(from, { react: { text: cmd.react, key: mek.key }})
                try {
                    cmd.function(conn, mek, m,{from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply});
                } catch (e) {
        console.error("[PLUGIN ERROR] " + e);
}
}
}
})
}
async function main() {
try {
const connectDB = require("./lib/mongodb");
await connectDB();
setTimeout(async () => {
await connectToWA();
}, 2000);
} catch (e) {
console.error("Main initialization failed:", e);
}
}
main();
