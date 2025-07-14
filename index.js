
const fs = require('fs');
const { Client, GatewayIntentBits } = require('discord.js');
const stringSimilarity = require('string-similarity');
require('dotenv').config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

const inventoryFile = './inventory.json';

const CATEGORIES = {
  GUNS: ["Tommy's", "AKs", "Double Barrel Shotguns", "Uzis", "MPX", "Tec", "WMs","APS", "SPS", "DRACOS", "VPs", "SCORPIONS", "PKMS" ],
  EXPLOSIVES: ["Molly's", "C4's", "EMP", "THERMITE"],
  DRUGS: ["TUSI", "DEATH METH", "COCAINE", "HEROIN", "MDMA"]
  AMMO: ["7.62X54", "7.62X39", "9MM", ".45", "12 Gauge Shells"],
  ACCESSORIES: ["Pistol Suppressor", "SMG Suppressor", "Rifle Suppressor", "OBD", "TRANSCEIVERS"]
};

function loadInventory() {
  if (fs.existsSync(inventoryFile)) {
    return JSON.parse(fs.readFileSync(inventoryFile));
  }
  return {};
}

function saveInventory(inv) {
  fs.writeFileSync(inventoryFile, JSON.stringify(inv, null, 2));
}

function findClosestItem(itemName) {
  const allItems = Object.values(CATEGORIES).flat();
  const match = stringSimilarity.findBestMatch(itemName, allItems).bestMatch;
  return match.rating >= 0.5 ? match.target : null;
}

function getCategoryForItem(itemName) {
  for (const [category, items] of Object.entries(CATEGORIES)) {
    if (items.includes(itemName)) return category;
  }
  return 'UNCATEGORIZED';
}

function formatInventory(inv) {
  let formatted = '📦 **Warehouse Inventory:**\n';
  for (const [category, items] of Object.entries(CATEGORIES)) {
    formatted += `\n**${category}**\n`;
    let found = false;
    for (const item of items) {
      if (inv[item] !== undefined) {
        formatted += `${item}: ${inv[item]}\n`;
        found = true;
      }
    }
    if (!found) {
      formatted += '_No items in this category._\n';
    }
  }
  return formatted;
}

client.on('ready', () => {
  console.log(`Bot logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (msg) => {
  if (msg.author.bot) return;
  const args = msg.content.trim().split(/ +/);
  const command = args.shift().toLowerCase();
  const inventory = loadInventory();

  if (command === '!inventory') {
    msg.channel.send(formatInventory(inventory));
  }

  if (command === '!add' || command === '!remove') {
    if (args.length < 2) {
      return msg.channel.send('Usage: !add <item> <amount>');
    }

    const inputName = args.slice(0, -1).join(' ');
    const amount = parseInt(args[args.length - 1]);

    if (isNaN(amount)) {
      return msg.channel.send('Amount must be a number.');
    }

    const matchedItem = findClosestItem(inputName);
    if (!matchedItem) {
      return msg.channel.send('Item not recognized.');
    }

    inventory[matchedItem] = inventory[matchedItem] || 0;
    if (command === '!add') {
      inventory[matchedItem] += amount;
      msg.channel.send(`✅ Added ${amount} ${matchedItem} to inventory.`);
    } else {
      inventory[matchedItem] -= amount;
      msg.channel.send(`🗑️ Removed ${amount} ${matchedItem} from inventory.`);
    }

    saveInventory(inventory);
  }

  if (command === '!clear') {
    saveInventory({});
    msg.channel.send('🧹 Inventory cleared.');
  }
});

client.login(process.env.TOKEN);
