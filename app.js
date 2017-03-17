const redis = require('redis');
const blessed = require('blessed');
const contrib = require('blessed-contrib');

const screen = blessed.screen();

const REDIS_URL = 'redis://localhost:6379/0';

const readClient = redis.createClient(REDIS_URL, {
  retry_strategy() {
    return 1000;
  },
});

// readClient.on('connect', () => console.log('readClient connected at ' + REDIS_URL));
// readClient.on('ready', () => console.log('readClient ready'));

const table = contrib.table({
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
screen.append(table);

const listenedKeys = {
  key1: 'list',
  key2: 'zset',
  key3: 'string',
  key4: 'hash',
};

const headers = ['Key name', 'Key type', 'Command', 'Key value'];

const commands = {
  zset: ['ZCOUNT', ['-inf', '+inf']],
  list: ['LLEN'],
  string: ['GET'],
  hash: ['HLEN'],
};

const keysNames = Object.keys(listenedKeys);

let displayArray;

function checkKeys() {
  const sentArray = keysNames.map((name) => {
    const keyType = listenedKeys[name];

    if (!commands[keyType]) {
      throw new Error(`Not valid key type: ${keyType}, valid are ${Object.keys(commands).join(', ')}`);
    }

    if (commands[keyType].length > 1) {
      return [commands[keyType][0], name, ...commands[keyType][1]];
    }

    return [commands[keyType][0], name];
  });

  readClient.batch(sentArray).exec((err, replies) => {
    displayArray = replies.map((reply, index) => {
      const keyName = keysNames[index];
      const keyType = listenedKeys[keyName];
      const command = commands[keyType][0];
      const response = reply || '[nil]';

      return [keyName, keyType, command, response];
    });

    table.setData({
      headers,
      data: displayArray,
    });

    screen.render();
  });
}

setInterval(checkKeys, 100);

screen.key(['escape', 'q', 'C-c'], function escape(ch, key) {
  return process.exit(0);
});

screen.render();
