const axios = require('axios');

async function testDraft() {
    try {
        console.log("Testing /api/generate-draft endpoint...");
        const response = await axios.post('http://localhost:3004/api/generate-draft', {
            prompt: "wish him a happy birthday",
            chatHistory: [] 
        });
        console.log("✅ Success! Response:", response.data);
    } catch (error) {
        console.error("❌ Failed!");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", error.response.data);
        } else {
            console.error("Error:", error.message);
        }
    }
}

testDraft();
