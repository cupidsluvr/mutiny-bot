const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const LOG_FILE = 'warehouse_logs.json';
const ALLOWED_ROLE_NAME = 'Leadership';
const LOG_CHANNEL_NAME = '📦warehouse-logs';

function logWarehouse(action, user, item, amount) {
    let data = fs.existsSync(LOG_FILE) ? JSON.parse(fs.readFileSync(LOG_FILE)) : [];
    data.push({ timestamp: new Date(), user, action, item, amount });
    fs.writeFileSync(LOG_FILE, JSON.stringify(data, null, 2));
}

client.once('ready', () => {
    console.log(`✅ Mutiny Bot logged in as ${client.user.tag}`);
});

client.on('messageCreate', message => {
    if (message.author.bot || !message.content.startsWith('!')) return;

    const roleCheck = message.member.roles.cache.some(role => role.name === ALLOWED_ROLE_NAME);
    if (!roleCheck) return message.reply("⛔ Only Leadership can use warehouse commands.");

    const args = message.content.slice(1).trim().split(/\s+/);
    const cmd = args.shift()?.toLowerCase();

    // STORE / REMOVE
    if (cmd === 'store' || cmd === 'remove') {
        const amount = args[0];
        const item = args.slice(1).join(' ');
        if (!amount || !item) {
            return message.reply('❗ Usage: !store <amount> <item> or !remove <amount> <item>');
        }

        logWarehouse(cmd, message.author.username, item, amount);
        const logChannel = message.guild.channels.cache.find(c => c.name === LOG_CHANNEL_NAME);
        if (logChannel) {
            logChannel.send(`📦 **${message.author.username}** ${cmd}d **${amount}** of **${item}**`);
        }
        return message.react('✅');
    }

    // LOGS
    if (cmd === 'logs') {
        let data = fs.existsSync(LOG_FILE) ? JSON.parse(fs.readFileSync(LOG_FILE)) : [];
        let recent = data.slice(-5).map(e => `${e.timestamp} - ${e.user} ${e.action} ${e.amount} of ${e.item}`);
        return message.reply("📑 Latest Logs:\n" + recent.join('\n'));
    }

    // CHECKITEM
    if (cmd === 'checkitem') {
        const item = args.join(' ');
        if (!item) return message.reply('❗ Usage: !checkitem <item>');

        let data = fs.existsSync(LOG_FILE) ? JSON.parse(fs.readFileSync(LOG_FILE)) : [];
        let total = 0;
        for (const log of data) {
            if (log.item.toLowerCase() === item.toLowerCase()) {
                total += log.action === 'store' ? parseInt(log.amount) : -parseInt(log.amount);
            }
        }
        return message.reply(`💼 Total ${item}s in warehouse: ${total}`);
    }

    // INVENTORY
    if (cmd === 'inventory') {
        let data = fs.existsSync(LOG_FILE) ? JSON.parse(fs.readFileSync(LOG_FILE)) : [];
        let totals = {};
        for (const log of data) {
            const key = log.item.toLowerCase();
            if (!totals[key]) totals[key] = 0;
            totals[key] += log.action === 'store' ? parseInt(log.amount) : -parseInt(log.amount);
        }
        if (Object.keys(totals).length === 0) return message.reply("📦 Inventory is empty.");
        let output = "💼 Current Warehouse Inventory:\n";
        for (const [item, amount] of Object.entries(totals)) {
            output += `- ${item.toUpperCase()}: ${amount}\n`;
        }
        return message.reply(output);
    }
});

client.login(process.env.TOKEN);