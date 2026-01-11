const fs = require('fs');
try {
    const data = fs.readFileSync('check_output.txt', 'utf16le');
    console.log(data);
} catch (e) { console.error(e); }
