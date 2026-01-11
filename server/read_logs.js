const fs = require('fs');
try {
    const data = fs.readFileSync('server_log.txt', 'utf16le');
    console.log(data.split('\n').slice(-50).join('\n'));
} catch (e) {
    console.error(e);
}
