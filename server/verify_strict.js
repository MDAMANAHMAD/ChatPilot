require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testKeys() {
    console.log("--- Starting STRICT AI Key Verification ---");
    const k1 = process.env.GEMINI_API_KEY;
    const k2 = process.env.SECONDARY_GEMINI_KEY;
    const keys = [k1, k2].filter(k => k && k.length > 5);

    console.log(`Found ${keys.length} keys.`);

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        console.log(`\nTesting Key [${i+1}]: ...${key.slice(-4)}`);
        try {
            const genAI = new GoogleGenerativeAI(key);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await model.generateContent("Hello");
            const response = await result.response;
            console.log(`✅ SUCCESS! Output: ${response.text().trim()}`);
        } catch (e) {
            console.error(`❌ FAILED: ${e.message}`);
        }
    }
}

testKeys();
