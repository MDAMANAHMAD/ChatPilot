/**
 * CHATPILOT BACKEND - MAIN ENTRY POINT
 * 
 * This file handles the Express server setup, MongoDB connection, 
 * Socket.io real-time engine, and Google Gemini AI integrations.
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const authRoutes = require('./routes/auth');
require('dotenv').config();

// Native Models for DB Interactions
const Message = require('./models/Message');
const User = require('./models/User');
const Conversation = require('./models/Conversation');

// Security Utilities for Data Encryption
const { encrypt, decrypt } = require('./utils/encryption');

const app = express();

/**
 * MIDDLEWARE SETUP
 * - CORS: Allows the frontend (different port/domain) to communicate with the backend.
 * - JSON: Parses incoming requests with JSON payloads.
 */
app.use(cors());
app.use(express.json());

// ROUTE REGISTRATION
// Custom authentication routes (Login/Signup)
app.use('/api/auth', authRoutes);

/**
 * HEALTH CHECK ENDPOINT
 * Used to verify if the backend is online and which version is running.
 */
app.get('/', (req, res) => {
    res.json({
        status: "alive",
        version: "2.2.0",
        buildTime: "Jan 11 20:53",
        message: "ChatPilot Backend Online"
    });
});

/**
 * AI DEBUG ENDPOINT
 * Tests the Gemini API integration to ensure the key and model are functional.
 */
app.get('/api/debug/test-ai', async (req, res) => {
    try {
        const key = process.env.GEMINI_API_KEY;
        if (!key) return res.json({ error: "No key found" });

        const testGenAI = new GoogleGenerativeAI(key.trim());
        const testModel = testGenAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await testModel.generateContent("Test");
        const response = await result.response;
        res.json({ success: true, text: response.text() });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message,
            stack: err.stack,
            name: err.name
        });
    }
});

/**
 * AI STATUS ENDPOINT
 * Simple check to see if AI keys are present in the environment variables.
 */
app.get('/api/debug/ai', (req, res) => {
    res.json({
        hasKey: !!process.env.GEMINI_API_KEY,
        keyPrefix: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 10) : "missing",
        hasSecondaryKey: !!process.env.SECONDARY_GEMINI_KEY,
        nodeVersion: process.version
    });
});

/**
 * HTTP SERVER & SOCKET.IO INITIALIZATION
 * Socket.io is used for real-time, bi-directional communication (chat and AI events).
 */
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // In production, restrict this to the frontend URL
        methods: ["GET", "POST"]
    }
});

/**
 * GEMINI AI CONFIGURATION
 * We use a primary and secondary key for failover/redundancy.
 * The model "gemini-2.0-flash" is chosen for its speed and low latency.
 */
const GEMINI_API_KEY = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : null;
const SECONDARY_GEMINI_KEY = process.env.SECONDARY_GEMINI_KEY ? process.env.SECONDARY_GEMINI_KEY.trim() : null;

let genAI;
if (GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
}

// Utility to create a specific model instance with a given key
const getModel = (key = GEMINI_API_KEY) => {
    if (!key) return null;
    const client = new GoogleGenerativeAI(key);
    return client.getGenerativeModel({ model: "gemini-2.0-flash" });
}

const model = getModel();

/**
 * SOCKET.IO REAL-TIME LOGIC
 * Handles connections, room management, and message broadcasting.
 */
io.on('connection', (socket) => {
    console.log('User Connected:', socket.id);

    // Register user to their unique internal room (based on MongoDB User ID)
    socket.on('register_user', (userId) => {
        socket.join(userId);
        console.log(`User ${socket.id} registered as ${userId}`);
    });

    // Join a specific chat room (e.g., user1ID_user2ID)
    socket.on('join_room', (room) => {
        socket.join(room);
        console.log(`User ${socket.id} joined room ${room}`);
    });

    /**
     * SEND MESSAGE HANDLER
     * 1. Saves message to DB (auto-encrypted via Mongoose getters/setters).
     * 2. Updates conversation status and 'lastMessage'.
     * 3. Broadcasts the message to the room and the specific receiver.
     * 4. Triggers AI Bot logic if the receiver is the Pilot Bot.
     */
    socket.on('send_message', async (data) => {
        try {
            // STEP 1: Save the new message to MongoDB
            const newMessage = new Message(data);
            await newMessage.save();

            // STEP 2: Manage the Conversation abstraction
            let conv = await Conversation.findOne({
                participants: { $all: [data.senderId, data.receiverId] }
            });

            if (!conv) {
                // If first interaction, create a new conversation
                conv = await Conversation.create({
                    participants: [data.senderId, data.receiverId],
                    status: 'pending',
                    initiatedBy: data.senderId,
                    lastMessage: { ...data, content: encrypt(data.content) }
                });
            } else {
                // Update existing conversation with new activity
                conv.lastMessage = { ...data, content: encrypt(data.content) };
                conv.updatedAt = new Date();
                await conv.save();
            }

            const messageToEmit = { ...newMessage.toObject(), room: data.room };

            // STEP 3: Real-time broadcast
            socket.to(data.room).emit('receive_message', messageToEmit);
            socket.to(data.receiverId).emit('receive_message', messageToEmit);

            /**
             * --- PILOT BOT LOGIC ---
             * If receiving user is the official bot, trigger automated AI response.
             */
            const receiverUser = await User.findById(data.receiverId);
            if (receiverUser && receiverUser.email === 'bot@chatpilot.ai') {
                console.log("🤖 Pilot Bot is thinking...");

                // Notify client that bot is typing immediately via Socket events
                io.to(data.room).emit('bot_typing', { room: data.room, senderId: data.receiverId });
                io.to(data.senderId).emit('bot_typing', { room: data.room, senderId: data.receiverId });

                // Simulate slight thinking delay for a more 'human' feel
                setTimeout(async () => {
                    let botReplyText = "I'm currently processing your frequency. Standby for link calibration. (AI temporarily unavailable)";
                    let success = false;

                    try {
                        const keys = [GEMINI_API_KEY, SECONDARY_GEMINI_KEY].filter(Boolean);

                        // Failover logic for AI requests
                        for (const key of keys) {
                            if (success) break;
                            try {
                                const currentKey = key.trim();
                                const tempGenAI = new GoogleGenerativeAI(currentKey);
                                const botModel = tempGenAI.getGenerativeModel({ model: "gemini-2.0-flash" });
                                
                                // Call Gemini 1.5/2.0 for response generation
                                const result = await botModel.generateContent(`
                                    You are "Pilot Bot", a helpful AI assistant in the ChatPilot app.
                                    User just said: "${data.content}"
                                    Reply normally as a helpful assistant. Keep it concise (under 2 sentences).
                                `);
                                const response = await result.response;
                                botReplyText = response.text().trim();
                                success = true;
                                console.log(`🤖 Chat Bot Success with key ending in: ...${currentKey.substring(currentKey.length - 4)}`);
                            } catch (err) {
                                console.warn(`🤖 Bot AI Attempt failed with key starting ${key.substring(0, 5)}: ${err.message}`);
                            }
                        }
                    } catch (botErr) {
                        console.error("Bot Reply Logic Fatal Error:", botErr);
                    }

                    // Stop typing indicator on client
                    io.to(data.room).emit('bot_stop_typing', { room: data.room, senderId: data.receiverId });
                    io.to(data.senderId).emit('bot_stop_typing', { room: data.room, senderId: data.receiverId });

                    // Construction of the bot message object
                    const botMsgData = {
                        room: data.room,
                        senderId: data.receiverId,
                        receiverId: data.senderId,
                        content: botReplyText,
                        timestamp: new Date(),
                        isAiGenerated: true
                    };

                    // Save Bot reply to database
                    const botMessage = new Message(botMsgData);
                    await botMessage.save();

                    // Update Conversation state
                    conv.lastMessage = { ...botMsgData, content: encrypt(botMsgData.content) };
                    conv.updatedAt = new Date();
                    await conv.save();

                    // Emit the bot's final reply
                    const botEmit = { ...botMessage.toObject(), room: data.room };
                    io.to(data.room).emit('receive_message', botEmit);
                    io.to(data.senderId).emit('receive_message', botEmit);

                }, 2000);
            }
        } catch (err) {
            console.error('Error saving message:', err);
        }
    });

    // Listener for contact/link requests being accepted
    socket.on('accept_request', (data) => {
        socket.to(data.receiverId).emit('request_accepted', data);
    });

    socket.on('disconnect', () => {
        console.log('User Disconnected', socket.id);
    });
});

/**
 * DEMO AUTH ENDPOINT
 * Creates a unique guest user session and establishes an initial conversation with Pilot Bot.
 * This is useful for reviewers to quickly test the app without manual signup.
 */
app.post('/api/auth/demo', async (req, res) => {
    try {
        let botUser = await User.findOne({ email: 'bot@chatpilot.ai' });
        if (!botUser) {
            botUser = new User({
                username: 'Pilot Bot',
                email: 'bot@chatpilot.ai',
                phoneNumber: '0000000000',
                password: 'bot_password_secure',
            });
            await botUser.save();
        }

        const randomId = Math.floor(Math.random() * 10000);
        const guestUser = new User({
            username: `Guest Pilot ${randomId}`,
            email: `guest${randomId}@demo.com`,
            phoneNumber: `99${randomId.toString().padStart(8, '0')}`,
            password: 'demo_password'
        });
        await guestUser.save();

        const conv = await Conversation.create({
            participants: [guestUser._id, botUser._id],
            status: 'accepted',
            initiatedBy: botUser._id,
            lastMessage: {
                content: "Welcome to ChatPilot! I'm your AI assistant. How can I help you?",
                senderId: botUser._id,
                timestamp: new Date()
            }
        });

        const { password, ...userData } = guestUser._doc;
        res.json(userData);

    } catch (err) {
        console.error("Demo Login Error:", err);
        res.status(500).json({ error: "Failed to create demo session" });
    }
});

/**
 * AI SUGGESTIONS ENDPOINT
 * Analyzes chat history and generates:
 * 1. (Auto-Pilot OFF): 3 distinct reply suggestions for the user to click.
 * 2. (Auto-Pilot ON): A single reply with a confidence score for automatic sending.
 */
app.post('/api/generate-suggestions', async (req, res) => {
    let autoMode = false;
    try {
        const { chatHistory, autoMode: mode } = req.body;
        autoMode = mode;

        let prompt = "";
        
        // Dynamic prompt selection based on user's Auto-Pilot setting
        if (autoMode) {
            prompt = `You are a smart personal assistant helping a user reply to a chat.
        CONTEXT: The provided JSON contains the recent chat history. The LAST message in the list is the one you MUST reply to.
        INSTRUCTION: Generate a single, perfect response to the LAST message. Use previous messages only for context/style.
        If the last message is a question (e.g., "capital of India"), your reply MUST answer it directly (e.g., "New Delhi").
        Return ONLY a JSON object. No markdown.
        Format: { "reply": "string", "confidence_score": number (0-100) }
        Chat History: ${JSON.stringify(chatHistory)}`;
        } else {
            prompt = `You are a smart AI suggestion engine for a chat app.
        CONTEXT: The provided JSON is the chat history. The LAST message (at the end of the list) is what the user just received.
        INSTRUCTION: Provide 3 distinct, short, and natural reply suggestions to that LAST message.
        - If the last message is a question, at least one suggestion MUST be the correct answer.
        - Keep other suggestions casual or conversational.
        Return ONLY a JSON array of 3 strings. No markdown.
        Example: ["New Delhi", "It's New Delhi.", "Not sure, let me check."]
        Chat History: ${JSON.stringify(chatHistory)}`;
        }

        const keys = [GEMINI_API_KEY, SECONDARY_GEMINI_KEY].filter(Boolean);
        let text = "";
        let success = false;
        let lastError = null;

        if (keys.length === 0) throw new Error("No API keys configured");

        // KEY ROTATION AND RETRY LOGIC
        for (const key of keys) {
            if (success) break;
            const currentKey = key.trim();
            const tempGenAI = new GoogleGenerativeAI(currentKey);
            const tempModel = tempGenAI.getGenerativeModel({ model: "gemini-2.0-flash" });

            for (let attempt = 1; attempt <= 2; attempt++) {
                try {
                    const result = await tempModel.generateContent(prompt);
                    const response = await result.response;
                    text = response.text().trim();
                    success = true;
                    break;
                } catch (err) {
                    lastError = err;
                    if (err.message.includes('429') || err.message.includes('API_KEY_INVALID')) break;
                    if (attempt === 2) break;
                    await new Promise(r => setTimeout(r, 2000));
                }
            }
        }

        if (!success) throw new Error("All AI keys exhausted or failed.");

        /**
         * CLEANING AI OUTPUT
         * LLMs often return markdown blocks. We strip these to ensure 
         * we only have valid JSON text for parsing.
         */
        let cleanText = text;
        if (text.includes('```')) {
            const matches = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            if (matches) cleanText = matches[1];
        }
        cleanText = cleanText.trim();

        // Ensure we start with { or [ if the LLM added prefix text
        if (!cleanText.startsWith('{') && !cleanText.startsWith('[')) {
            const firstBrace = cleanText.indexOf('{');
            const firstBracket = cleanText.indexOf('[');
            if (autoMode && firstBrace !== -1) {
                cleanText = cleanText.substring(firstBrace, cleanText.lastIndexOf('}') + 1);
            } else if (!autoMode && firstBracket !== -1) {
                cleanText = cleanText.substring(firstBracket, cleanText.lastIndexOf(']') + 1);
            }
        }

        try {
            const parsed = JSON.parse(cleanText);
            res.json(parsed);
        } catch (parseError) {
            // REGEX FALLBACK: Attempt last-resort parsing if JSON.parse fails
            if (autoMode) {
                const replyMatch = cleanText.match(/"reply":\s*"([^"]*)"/);
                if (replyMatch) return res.json({ reply: replyMatch[1], confidence_score: 85 });
            } else {
                const strings = cleanText.match(/"([^"]+)"/g);
                if (strings && strings.length >= 3) {
                    return res.json(strings.slice(0, 3).map(s => s.replace(/"/g, '')));
                }
            }
            res.status(500).json({ error: "Failed to parse AI response" });
        }
    } catch (error) {
        // ERROR HANDLING: Return system messages if AI is overloaded or down
        let errorMsg = "AI Pilot Unavailable";
        const fallbackSuggestions = ["(System: " + errorMsg + ")"];
        if (autoMode) res.json({ reply: `[SYSTEM ALERT: ${errorMsg}]`, confidence_score: 0 });
        else res.json(fallbackSuggestions);
    }
});

/**
 * AI DRAFT/COMPOSER ENDPOINT
 * Takes a rough idea (e.g., "ask them for pizza") and turns it into 
 * a natural WhatsApp-style message.
 */
app.post('/api/generate-draft', async (req, res) => {
    try {
        const { prompt: userPrompt } = req.body;
        if (!userPrompt) return res.status(400).json({ error: "Prompt required" });

        const keys = [GEMINI_API_KEY, SECONDARY_GEMINI_KEY].filter(Boolean);
        let text = "";
        let success = false;
        let lastError = null;

        for (const key of keys) {
            if (success) break;
            const activeKey = key.trim();
            const draftGenAI = new GoogleGenerativeAI(activeKey);
            const draftModel = draftGenAI.getGenerativeModel({ model: "gemini-2.0-flash" });

            const systemPrompt = `You are an AI writing assistant for a chat app. 
            TASK: Rewrite the user's raw instruction into a natural, casual message.
            STYLE: Short, human, minimal punctuation, maybe 1 emoji. No quotes.
            User Instruction: "${userPrompt}"
            Output only the message text.`;

            for (let attempt = 1; attempt <= 2; attempt++) {
                try {
                    const result = await draftModel.generateContent(systemPrompt);
                    const response = await result.response;
                    text = response.text().trim().replace(/^"|"$/g, '');
                    success = true;
                    break;
                } catch (err) {
                    lastError = err;
                    if (attempt === 2) break;
                    await new Promise(r => setTimeout(r, 1000));
                }
            }
        }
        res.json({ draft: text });
    } catch (error) {
        res.status(500).json({ error: "Failed to generate draft" });
    }
});

/**
 * CONVERSATION STATUS ENDPOINT
 * Checks whether a conversation between two IDs exists or what its status is.
 */
app.get('/api/conversation/status/:id1/:id2', async (req, res) => {
    try {
        const { id1, id2 } = req.params;
        const conv = await Conversation.findOne({
            participants: { $all: [id1, id2] }
        });
        if (!conv) return res.json({ status: 'new' });
        res.json(conv);
    } catch (err) {
        res.status(500).json(err);
    }
});

/**
 * UPDATE STATUS ENDPOINT
 * Accepts or Blocks conversations based on user interaction.
 */
app.post('/api/conversation/update', async (req, res) => {
    try {
        const { conversationId, status } = req.body;
        const conv = await Conversation.findByIdAndUpdate(conversationId, { status }, { new: true });
        res.json(conv);
    } catch (err) {
        res.status(500).json(err);
    }
});

/**
 * MESSAGE RETRIEVAL ENDPOINT
 * Fetches all messaged exchanged in a specific room (defined by participant ID pair).
 */
app.get('/api/messages/:room', async (req, res) => {
    try {
        const [id1, id2] = req.params.room.split('_');
        const messages = await Message.find({
            $or: [
                { senderId: id1, receiverId: id2 },
                { senderId: id2, receiverId: id1 }
            ]
        }).sort({ timestamp: 1 });
        res.json(messages);
    } catch (err) {
        res.status(500).json(err);
    }
});

/**
 * USER CONVERSATIONS ENDPOINT
 * Fetches all conversations for a specific user, populates participant details,
 * and decrypts the 'lastMessage' for UI display purposes.
 */
app.get('/api/conversations/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const conversations = await Conversation.find({
            participants: { $in: [userId] }
        })
            .populate('participants', '-password') 
            .sort({ updatedAt: -1 });

        const contacts = conversations.map(conv => {
            const otherUser = conv.participants.find(p => p._id.toString() !== userId);
            
            // Explicit Decryption of the last message chunk for the sidebar/list view
            const lastMsg = conv.lastMessage ? { 
                ...conv.lastMessage, 
                content: decrypt(conv.lastMessage.content) 
            } : null;

            return {
                ...otherUser._doc,
                conversationId: conv._id,
                status: conv.status,
                lastMessage: lastMsg,
                updatedAt: conv.updatedAt
            };
        });

        res.json(contacts);
    } catch (err) {
        res.status(500).json(err);
    }
});

/**
 * DB CONNECTION & SERVER LAUNCH
 */
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/chatpilot';
mongoose.connect(mongoUri)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
