require('dotenv').config();
async function check() {
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        data.models.forEach(m => console.log(m.name));
    } catch (e) {
        console.error(e);
    }
}
check();
