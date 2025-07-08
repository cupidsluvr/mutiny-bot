const fs = require('fs');
const { Client, GatewayIntentBits } = require('discord.js');
const { getCloseMatches } = require('string-similarity');
require('dotenv').config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const PREFIX = '!';
const LOG_FILE = 'warehouse_logs.json';

// INVENTORY CATEGORIES
const categories = {
  GUNS: ["Tommy’s", "AKs", "Double Barrel Shotguns", "Uz]()


