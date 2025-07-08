const fs = require('fs');
const { Client, GatewayIntentBits } = require('discord.js');
const { getCloseMatches } = require('string-similarity');
require('dotenv').config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const PREFIX = '!';
const LOG_FILE = 'warehouse_logs.json';

const categories = {
  GUNS: ["Tommy's", "AKs", "Double Barrel Shotguns", "Uzis", "MPX", "Tec", "WMs", "VPs"],
  EXPLOSIVES: ["Molly's", "C4's"],
  AMMO: ["7.62X54", "7.62X39", "9MM", ".45", "12 Gauge Shells"],
  ACCESSORIES: ["Pistol Suppressor", "SMG Suppressor", "Rifle Suppressor"]
};
