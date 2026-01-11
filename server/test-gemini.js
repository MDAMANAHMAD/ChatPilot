require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
    console.log("1. Reading API Key...");
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("❌ No GEMINI_API_KEY found in .env");
        return;
    }
    console.log("   Key found: " + apiKey.substring(0, 8) + "...");
    
    const genAI = new GoogleGenerativeAI(apiKey.trim());
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    
    console.log("2. Sending request to Gemini 1.5 Flash...");
    try {
        const result = await model.generateContent("Hello! Are you online?");
        const response = await result.response;
        const text = response.text();
        console.log("✅ SUCCESS! Response received:");
        console.log(text);
    } catch (error) {
        console.error("❌ FAILED:");
        console.error(error.message);
    }
}

testGemini();
