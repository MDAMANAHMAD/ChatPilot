require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testKeys() {
    try {
        console.log("--- Starting AI Key Verification ---");
        const key1 = process.env.GEMINI_API_KEY;
        // Check if verify_ai.js is reading .env correctly
        if (!key1) {
             console.error("❌ No GEMINI_API_KEY found in process.env");
             console.log("Current Directory:", process.cwd());
             return;
        }

        const keys = [process.env.GEMINI_API_KEY, process.env.SECONDARY_GEMINI_KEY].filter(k => k && k.length > 0);
        
        console.log(`Found ${keys.length} keys.`);

        for (const [index, key] of keys.entries()) {
            const masked = key.substring(0, 4) + "..." + key.slice(-4);
            console.log(`\n[${index + 1}] Testing Key: ${masked}`);
            
            try {
                const genAI = new GoogleGenerativeAI(key);
                // Use the NEW model name we fixed in index.js
                const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
                
                const result = await model.generateContent("Ping");
                const response = await result.response;
                console.log(`   ✅ Success! Reply: "${response.text().trim()}"`);
            } catch (err) {
                console.error(`   ❌ Failed: ${err.message}`);
            }
        }
    } catch (err) {
        console.error("Fatal Script Error:", err);
    }
}

testKeys().then(() => console.log("\n--- Done ---"));
