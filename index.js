const fs = require('fs');
const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const PREFIX = '!';
const LOG_FILE = 'warehouse_logs.json';

const getCategory = (itemName) => {
  const guns = ['AK', 'AKS', 'PKM', 'M4', 'UZI', 'GLOCK', 'SHOTGUN'];
  const ammo = ['9MM', '5.56', '7.62', 'AMMO'];
  const explosives = ['GRENADE', 'C4', 'MOLOTOV', 'BOMB'];

  itemName = itemName.toUpperCase();

  if (guns.includes(itemName)) return 'GUNS';
  if (ammo.includes(itemName)) return 'AMMO';
  if (explosives.includes(itemName)) return 'EXPLOSIVES';
  return 'UNKNOWN';
};

const logTransaction = (action, item, amount, user) => {
  const log = {
    action,
    item,
    amount,
    user,
    timestamp: new Date().toISOString()
  };

  let logs = [];
  if (fs.existsSync(LOG_FILE)) {
    logs = JSON.parse(fs.readFileSync(LOG_FILE));
  }
  logs.push(log);
  fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
};

client.on('ready', () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
});

client.on('messageCreate', (message) => {
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // ADD COMMAND
  if (command === 'add') {
    const [item, amountStr] = args;
    const amount = parseInt(amountStr);

    if (!item || isNaN(amount)) {
      return message.reply('❌ Usage: `!add <item> <amount>`');
    }

    logTransaction('added', item, amount, message.author.username);
    return message.reply(`✅ Added ${amount} ${item.toUpperCase()} to inventory.`);
  }

  // REMOVE COMMAND
  if (command === 'remove') {
    const [item, amountStr] = args;
    const amount = parseInt(amountStr);

    if (!item || isNaN(amount)) {
      return message.reply('❌ Usage: `!remove <item> <amount>`');
    }

    logTransaction('removed', item, amount, message.author.username);
    return message.reply(`✅ Removed ${amount} ${item.toUpperCase()} from inventory.`);
  }

  // INVENTORY COMMAND
  if (command === 'inventory') {
    if (!fs.existsSync(LOG_FILE)) {
      return message.reply('📭 No inventory log found yet.');
    }

    const logs = JSON.parse(fs.readFileSync(LOG_FILE));
    const totals = {};

    logs.forEach(entry => {
      const key = entry.item.toUpperCase();
      if (!totals[key]) totals[key] = 0;
      totals[key] += (entry.action === 'added' ? entry.amount : -entry.amount);
    });

    const categorized = {
      GUNS: [],
      AMMO: [],
      EXPLOSIVES: [],
      UNKNOWN: []
    };

    for (const [item, count] of Object.entries(totals)) {
      const category = getCategory(item);
      categorized[category].push(`${item}: ${count}`);
    }

    let output = '📦 **Warehouse Inventory:**\n\n';

    for (const [category, items] of Object.entries(categorized)) {
      if (items.length > 0) {
        const emoji = category === 'GUNS' ? '🔫' :
                      category === 'AMMO' ? '🔋' :
                      category === 'EXPLOSIVES' ? '💣' :
                      '❓';

        output += `**${emoji} ${category}**\n${items.join('\n')}\n\n`;
      }
    }

    message.channel.send(output.trim());
  }

  // CLEAR COMMAND
  if (command === 'clear') {
    if (!fs.existsSync(LOG_FILE)) {
      return message.reply('⚠️ Inventory is already empty.');
    }

    fs.writeFileSync(LOG_FILE, '[]');
    return message.reply('🗑️ Warehouse inventory has been cleared.');
  }
});

client.login(process.env.TOKEN);
