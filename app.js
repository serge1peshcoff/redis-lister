const redis = require('redis');
const nconf = require('nconf');
const blessed = require('blessed')
const contrib = require('blessed-contrib')
const screen = blessed.screen()

const REDIS_URL = nconf.get('REDIS_URL') || 'redis://91.121.45.250:6379/1';

const readClient = redis.createClient(REDIS_URL, {
  retry_strategy() {
    return 1000;
  },
});

//readClient.on('connect', () => console.log('readClient connected at ' + REDIS_URL));
//readClient.on('ready', () => console.log('readClient ready'));

const table = contrib.table({
  keys: true,
  fg: 'white',
  selectedFg: 'white',
  selectedBg: 'blue',
  interactive: true,
  label: 'Monitored keys',
  width: '100%',
  height: '100%',
  border: { type: 'line', fg: 'cyan' },
  columnSpacing: 10, //in chars,
  columnWidth: [20, 12, 12] /*in chars*/
});

table.focus();
screen.append(table);

const listenedKeys = {
  'waiting.general': 'list',
  'waiting.fcm': 'list',
  'waiting.apns': 'list',
  'waiting.sms': 'list',
  'sent.fcm': 'sset',
  'sent.apns': 'sset',
  'sent.sms': 'sset',
  'delivered.fcm': 'list',
  'delivered.apns': 'list',
  'delivered.sms': 'list',
  'delivered.success': 'list',
  'delivered.failure': 'list',
  'delivered.queue': 'sset',
}

const headers = ['Key name', 'Key type', 'Key length'];

const keysNames = Object.keys(listenedKeys);

let displayArray;

function checkKeys() {
  const sentArray = keysNames.map(name => {
    if (listenedKeys[name] === 'list')
      return ['llen', name]
    else if (listenedKeys[name] === 'sset')
      return ['zcount', name, '-inf', '+inf']
    else
      throw new Error('wtf? ' + name)
  })

  readClient.batch(sentArray).exec((err, replies) => {
    displayArray = replies.map((reply, index) => {
      return [keysNames[index], listenedKeys[keysNames[index]], reply]
    })

    table.setData({
      headers: headers,
      data: displayArray,
    })

    screen.render()
  })
}

setInterval(checkKeys, 100)

screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});

screen.render()