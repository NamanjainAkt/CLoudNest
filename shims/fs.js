module.exports = {
  stat: (_path, cb) => cb && cb(new Error('fs not supported on mobile')),
  statSync: () => { throw new Error('fs not supported on mobile'); },
  lstat: (_path, cb) => cb && cb(new Error('fs not supported on mobile')),
  lstatSync: () => { throw new Error('fs not supported on mobile'); },
  readFile: (_path, cb) => cb && cb(new Error('fs not supported on mobile')),
  readFileSync: () => { throw new Error('fs not supported on mobile'); },
  writeFile: (_path, _data, cb) => cb && cb(new Error('fs not supported on mobile')),
  writeFileSync: () => {},
  createReadStream: () => { throw new Error('fs not supported on mobile'); },
  createWriteStream: () => { throw new Error('fs not supported on mobile'); },
  existsSync: () => false,
  readdirSync: () => [],
  promises: {
    stat: async () => { throw new Error('fs not supported on mobile'); },
    readFile: async () => { throw new Error('fs not supported on mobile'); },
    writeFile: async () => {},
  },
};
