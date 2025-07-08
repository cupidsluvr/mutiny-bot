require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const stringSimilarity = require('string-similarity');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const inventoryPath = path.join(__dirname, 'warehouse_logs.json');

// Define categories
const categories = {
  GUNS: ["Tommy's", "AKs", "Double Barrel Shotguns", "Uzis", "MPX", "Tec", "WMs", "VPs"],
  EXPLOSIVES: ["Molly's", "C4's"],
  AMMO: ["7.62X54", "7.62X39", "9MM", ".45", "12 Gauge Shells"],
  ACCESSORIES: ["Pistol Suppressor", "SMG Suppressor", "Rifle Suppressor"]
};

// Load inventory
let inventory = {};
if (fs.existsSync(inventoryPath)) {
  inventory = JSON.parse(fs.readFileSync(inventoryPath));
}

// Save inventory
function saveInventory() {
  fs.writeFileSync(inventoryPath, JSON.stringify(inventory, null, 2));
}

// Find closest match using fuzzy matching
function findClosestMatch(item) {
  const allItems = Object.values(categories).flat();
  const match = stringSimilarity.findBestMatch(item.toLowerCase(), allItems.map(i => i.toLowerCase()));
  const index = allItems.map(i => i.toLowerCase()).indexOf(match.bestMatch.target);
  return allItems[index];
}

// Get category for item
function getCategory(item) {
  for (const [category, items] of Object.entries(categories)) {
    if (items.includes(item)) return category;
  }
  return 'Other';
}

// Command handler
client.on('messageCreate', async (message) => {
  if (!message.content.startsWith('!') || message.author.bot) return;
  const args = message.content.slice(1).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === 'add') {
    const nameRaw = args.slice(0, -1).join(' ');
    const quantity = parseInt(args.slice(-1)[0]);
    if (isNaN(quantity)) return message.reply('❌ Please provide a valid quantity.');

    const item = findClosestMatch(nameRaw);
    inventory[item] = (inventory[item] || 0) + quantity;
    saveInventory();
    return message.reply(`✅ Added ${quantity} ${item} to inventory.`);
  }

  if (command === 'clear') {
    inventory = {};
    saveInventory();
    return message.reply('🧹 Inventory has been cleared.');
  }

  if (command === 'inventory') {
    if (Object.keys(inventory).length === 0) return message.reply('📦 Warehouse is empty.');

    const sorted = {};
    for (const [item, count] of Object.entries(inventory)) {
      const category = getCategory(item);
      if (!sorted[category]) sorted[category] = [];
      sorted[category].push(`${item}: ${count}`);
    }

    const display = Object.entries(sorted).map(([category, lines]) =>
      `**${category}:**\n${lines.join('\n')}`
    ).join('\n\n');

    return message.reply({ content: `📦 **Warehouse Inventory:**\n\n${display}` });
  }
});

client.login(process.env.TOKEN);
