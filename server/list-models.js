require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);
    console.log("Checking available models...");
    
    try {
        // Unfortunately the Node SDK doesn't expose listModels directly on the main class easily in all versions.
        // But we can try the model directly.
        // Let's try 'gemini-1.5-flash' again, but cleaner.
        
        // Actually, let's try a direct fetch to the REST API to see the raw error or list.
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.models) {
            console.log("✅ API IS WORKING! Available Models:");
            data.models.forEach(m => console.log(` - ${m.name}`));
        } else {
            console.error("❌ Listing failed. Response:", JSON.stringify(data, null, 2));
        }
        
    } catch (error) {
        console.error("❌ Network Error:", error.message);
    }
}

listModels();
