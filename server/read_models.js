const fs = require('fs');
    const content = fs.readFileSync('models.txt', 'utf16le');
    const lines = content.split('\n');
    lines.slice(0, 50).forEach(l => console.log(l));
