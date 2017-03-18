module.exports = {
  configTypes: {
    host: 'String',
    keys: 'Object',
    updateInterval: 'Number',
  },
  commands: {
    zset: ['ZCOUNT', ['-inf', '+inf']],
    list: ['LLEN'],
    string: ['GET'],
    hash: ['HLEN'],
    set: ['SCARD'],
  },
  tableHeaders: ['Key name', 'Key type', 'Command', 'Key value'],
  tableOptions: {
    keys: true,
    fg: 'white',
    selectedFg: 'white',
    selectedBg: 'blue',
    interactive: true,
    label: 'Monitored keys',
    width: '100%',
    height: '80%',
    border: { type: 'line', fg: 'blue' },
    columnSpacing: 10, // in chars,
    columnWidth: [20, 12, 12, 100], /* in chars */
  },
  logOptions: {
    fg: 'blue',
    selectedFg: 'blue',
    label: 'Redis log',
  },
};

