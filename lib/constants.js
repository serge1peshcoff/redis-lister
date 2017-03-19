module.exports = {
  requiredFields: {
    host: 'String',
    keys: 'Object',
    updateInterval: 'Number',
  },
  commands: {
    zcount: 'ZCOUNT %name% -inf +inf',
    llen: 'LLEN %name%',
    get: 'GET %name%',
    hlen: 'HLEN %name%',
    scard: 'SCARD %name%',
  },
  tableHeaders: ['Key name', 'Command keyword', 'Command', 'Key value'],
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
    columnWidth: [20, 10, 25, 100], /* in chars */
  },
  logOptions: {
    fg: 'blue',
    selectedFg: 'blue',
    label: 'Redis log',
  },
};

