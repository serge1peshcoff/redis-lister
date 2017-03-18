#! /usr/bin/env node

const redis = require('redis');
const path = require('path');
const fs = require('fs');
const moment = require('moment');
const blessed = require('blessed');
const contrib = require('blessed-contrib');

const constants = require('../lib/constants');

if (process.argv.length !== 3) {
  console.log('Usage: redis-lister path/to/config.json');
  process.exit(1);
}

let config;
try {
  const absoluteConfigPath = path.resolve(process.argv[2]);
  const fileContent = fs.readFileSync(absoluteConfigPath);
  config = JSON.parse(fileContent);
} catch (err) {
  console.log(`Error loading config file: ${err}`);
  process.exit(1);
}

// Checking if each field is presented and is the right type.
Object.keys(constants.configTypes).forEach((field) => {
  if (!config[field]) {
    console.log(`Parse config error: required field '${field} is missing.`);
    process.exit(1);
  }

  const fieldType = Object.prototype.toString.call(config[field]);
  const fieldTypeTrimmed = fieldType.substring(8, fieldType.length - 1);

  if (fieldTypeTrimmed !== constants.configTypes[field]) {
    console.log(`Parse config error: field '${field}' is of the type '${fieldTypeTrimmed}', \
but '${constants.configTypes[field]}' was expected.`);
    process.exit(1);
  }
});

Object.keys(config.keys).forEach((key) => {
  if (!constants.commands[config.keys[key]]) {
    console.log(`Parse config error: wrong key type '${config.keys[key]}' was passed, \
available types: ${Object.keys(constants.commands).join(', ')}`);
    process.exit(1);
  }
});

const screen = blessed.screen();
const grid = new contrib.grid({ rows: 4, cols: 1, screen });

const table = grid.set(0, 0, 3, 1, contrib.table, constants.tableOptions);
const log = grid.set(3, 0, 1, 1, contrib.log, constants.logOptions);

table.focus();
screen.render();

function addToLog(string) {
  const timestamp = moment().format('MMMM Do YYYY, HH:mm:ss');
  log.log(`${timestamp}  ${string}`);
}

const redisClient = redis.createClient(config.host, {
  retry_strategy() {
    return 1000;
  },
});

redisClient.on('connect', () => addToLog(`Redis client connected at ${config.host}`));
redisClient.on('ready', () => addToLog('Redis client ready'));
redisClient.on('error', err => addToLog(`{red-fg}Redis client error: ${err}{/red-fg}`));
redisClient.on('reconnecting', () => addToLog('{yellow-fg}Redis client reconnecting...{/yellow-fg}'));
redisClient.on('end', () => addToLog('{red-fg}Redis client ended.{/red-fg}'));

const keysNames = Object.keys(config.keys);
let displayArray;

function checkKeys() {
  const sentArray = keysNames.map((name) => {
    const keyType = config.keys[name];

    if (!constants.commands[keyType]) {
      throw new Error(`Not valid key type: ${keyType}, valid are ${Object.keys(constants.commands).join(', ')}`);
    }

    if (constants.commands[keyType].length > 1) {
      return [constants.commands[keyType][0], name, ...constants.commands[keyType][1]];
    }

    return [constants.commands[keyType][0], name];
  });

  redisClient.batch(sentArray).exec((err, replies) => {
    displayArray = replies.map((reply, index) => {
      const keyName = keysNames[index];
      const keyType = config.keys[keyName];
      const command = constants.commands[keyType][0];
      const response = (reply != undefined) ? reply : '[nil]';

      return [keyName, keyType, command, response];
    });

    table.setData({
      headers: constants.tableHeaders,
      data: displayArray,
    });

    screen.render();
  });
}

setInterval(checkKeys, config.updateInterval);

screen.key(['escape', 'q', 'C-c'], () => process.exit(0));
