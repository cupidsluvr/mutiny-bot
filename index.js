const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

client.once('ready', () => {
  console.log(`✅ Mutiny Bot logged in as ${client.user.tag}`);
});

// 📦 CATEGORY DEFINITION
const categories = {
  GUNS: ['AK', 'Draco', 'MPX', 'Uzi', 'AP', 'Tec-9', 'Scorpions', 'Shotguns', 'Tommy', 'WM29', 'VP', 'PKM'],
  AMMO: ['762.54', '9MM', '762.39', '.45', '55.6'],
  EXPLOSIVES: ['Molly', 'C4']
};

// 🔍 Function to detect category
function getCategory(itemName) {
  const upperItem = itemName.toUpperCase();
  for (const [category, items] of Object.entries(categories)) {
    if (items.map(i => i.toUpperCase()).includes(upperItem)) {
      return category;
    }
  }
  return 'UNKNOWN';
}

// 📂 Save log to warehouse_logs.json
const logToFile = (entry) => {
  const logPath = './warehouse_logs.json';
  let logs = [];

  if (fs.existsSync(logPath)) {
    const data = fs.readFileSync(logPath);
    logs = JSON.parse(data);
  }

  logs.push(entry);
  fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));
};

// 🛠️ Command listener
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const args = message.content.trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === '!additem' || command === '!removeitem') {
    const itemName = args[0];
    const amount = parseInt(args[1]);

    if (!itemName || isNaN(amount)) {
      return message.reply(`⚠️ Usage: ${command} <item_name> <amount>`);
    }

    const category = getCategory(itemName);

    const logEntry = {
      action: command === '!additem' ? 'added' : 'removed',
      item: itemName,
      amount,
      category,
      user: `${message.author.tag}`,
      timestamp: new Date().toISOString(),
    };

    logToFile(logEntry);
    message.channel.send(`✅ ${message.author.username} ${logEntry.action} ${amount} ${itemName}(s) [${category}]`);
  }
});

client.login(process.env.TOKEN);
