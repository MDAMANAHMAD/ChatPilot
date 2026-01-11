require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test(keyName) {
    const key = process.env[keyName];
    if (!key) { console.log(`${keyName} is missing`); return; }
    console.log(`Testing ${keyName}...`);
    try {
        const genAI = new GoogleGenerativeAI(key.trim());
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        const result = await model.generateContent("Hello");
        const response = await result.response;
        console.log(`✅ ${keyName} works: ${response.text().substring(0, 20)}`);
    } catch (e) {
        console.error(`❌ ${keyName} failed: ${e.message}`);
    }
}

async function run() {
    await test("GEMINI_API_KEY");
    await test("SECONDARY_GEMINI_KEY");
}
run();
