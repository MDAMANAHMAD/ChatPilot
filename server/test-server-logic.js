require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : null;
const SECONDARY_GEMINI_KEY = process.env.SECONDARY_GEMINI_KEY ? process.env.SECONDARY_GEMINI_KEY.trim() : null;

async function testLogic() {
    console.log("Keys:", { primary: !!GEMINI_API_KEY, secondary: !!SECONDARY_GEMINI_KEY });
    
    const prompt = "Provide 3 distinct, short, and natural reply suggestions to 'hello'";
    const keys = [GEMINI_API_KEY, SECONDARY_GEMINI_KEY].filter(Boolean);
    
    let text = "";
    let success = false;
    
    for (const key of keys) {
        if (success) break;
        const currentKey = key.trim();
        console.log(`Trying key ending in ...${currentKey.substring(currentKey.length - 4)}`);
        const tempGenAI = new GoogleGenerativeAI(currentKey);
        const tempModel = tempGenAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        try {
            const result = await tempModel.generateContent(prompt);
            const response = await result.response;
            text = response.text().trim();
            success = true;
            console.log("✅ Success!");
            console.log("Response:", text);
        } catch (err) {
            console.error(`❌ Failed: ${err.message}`);
        }
    }
}

testLogic();
