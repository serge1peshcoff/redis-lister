#! /usr/bin/env node

const redis = require('redis');
const path = require('path');
const fs = require('fs');
const blessed = require('blessed');
const contrib = require('blessed-contrib');

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

const configTypes = {
  host: 'String',
  keys: 'Object',
  updateInterval: 'Number',
};

// Checking if each field is presented and is the right type.
Object.keys(configTypes).forEach((field) => {
  if (!config[field]) {
    console.log(`Parse config error: required field '${field} is missing.`);
    process.exit(1);
  }

  const fieldType = Object.prototype.toString.call(config[field]);
  const fieldTypeTrimmed = fieldType.substring(8, fieldType.length - 1);

  if (fieldTypeTrimmed !== configTypes[field]) {
    console.log(`Parse config error: field '${field}' is of the type '${fieldTypeTrimmed}', \
but '${configTypes[field]}' was expected.`);
    process.exit(1);
  }
});

const commands = {
  zset: ['ZCOUNT', ['-inf', '+inf']],
  list: ['LLEN'],
  string: ['GET'],
  hash: ['HLEN'],
};

Object.keys(config.keys).forEach((key) => {
  if (!commands[config.keys[key]]) {
    console.log(`Parse config error: wrong key type '${config.keys[key]}' was passed, \
available types: ${Object.keys(commands).join(', ')}`);
    process.exit(1);
  }
});

const screen = blessed.screen();
const grid = new contrib.grid({ rows: 4, cols: 1, screen });

const table = grid.set(0, 0, 3, 1, contrib.table, {
  keys: true,
  fg: 'white',
  selectedFg: 'white',
  selectedBg: 'blue',
  interactive: true,
  label: 'Monitored keys',
  width: '100%',
  height: '80%',
  border: { type: 'line', fg: 'cyan' },
  columnSpacing: 10, // in chars,
  columnWidth: [20, 12, 12, 100], /* in chars */
});

table.focus();

const log = grid.set(3, 0, 1, 1, contrib.log, {
  fg: 'blue',
  selectedFg: 'blue',
  label: 'Redis log',
});

const redisClient = redis.createClient(config.host, {
  retry_strategy() {
    return 1000;
  },
});

redisClient.on('connect', () => log.log(`Redis client connected at ${config.host}`));
redisClient.on('ready', () => log.log('Redis client ready'));
redisClient.on('error', err => log.log(`{red-fg}Redis client error: ${err}{/red-fg}`));
redisClient.on('reconnecting', () => log.log('Redis client reconnecting...'));
redisClient.on('end', () => log.log('Redis client ended.'));

const headers = ['Key name', 'Key type', 'Command', 'Key value'];
const keysNames = Object.keys(config.keys);
let displayArray;

function checkKeys() {
  const sentArray = keysNames.map((name) => {
    const keyType = config.keys[name];

    if (!commands[keyType]) {
      throw new Error(`Not valid key type: ${keyType}, valid are ${Object.keys(commands).join(', ')}`);
    }

    if (commands[keyType].length > 1) {
      return [commands[keyType][0], name, ...commands[keyType][1]];
    }

    return [commands[keyType][0], name];
  });

  redisClient.batch(sentArray).exec((err, replies) => {
    displayArray = replies.map((reply, index) => {
      const keyName = keysNames[index];
      const keyType = config.keys[keyName];
      const command = commands[keyType][0];
      const response = (reply != undefined) ? reply : '[nil]';

      return [keyName, keyType, command, response];
    });

    table.setData({
      headers,
      data: displayArray,
    });

    screen.render();
  });
}

setInterval(checkKeys, config.updateInterval);

screen.key(['escape', 'q', 'C-c'], function escape(ch, key) {
  return process.exit(0);
});

screen.render();
