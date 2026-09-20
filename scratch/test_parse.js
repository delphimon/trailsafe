const fs = require('fs');
const { parseStoredData, initialData } = require('./build/src/lib/persistence.js') || require('./dist/src/lib/persistence.js') || {};
