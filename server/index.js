const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const authRoutes = require('./routes/auth');
require('dotenv').config();

const Message = require('./models/Message');
const User = require('./models/User');
const Conversation = require('./models/Conversation');

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Gemini Config 
console.log("🔑 Checking AI Key:", process.env.GEMINI_API_KEY ? "Found" : "Missing");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Used gemini-flash-latest as verified by model listing
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

// Socket.io Logic
// Socket.io Logic
io.on('connection', (socket) => {
    // ...
    console.log('User Connected:', socket.id);

    socket.on('register_user', (userId) => {
        socket.join(userId);
        console.log(`User ${socket.id} registered as ${userId}`);
    });

    socket.on('join_room', (room) => {
        socket.join(room);
        console.log(`User ${socket.id} joined room ${room}`);
    });

    socket.on('send_message', async (data) => {
        try {
            // 1. Save Message
            const newMessage = new Message(data);
            await newMessage.save();

            // 2. Update/Create Conversation
            let conv = await Conversation.findOne({
                participants: { $all: [data.senderId, data.receiverId] }
            });

            if (!conv) {
                conv = await Conversation.create({
                    participants: [data.senderId, data.receiverId],
                    status: 'pending',
                    initiatedBy: data.senderId,
                    lastMessage: data
                });
            } else {
                conv.lastMessage = data;
                conv.updatedAt = new Date();
                await conv.save();
            }

            const messageToEmit = { ...newMessage._doc, room: data.room };

            // Broadcast
            socket.to(data.room).emit('receive_message', messageToEmit);
            socket.to(data.receiverId).emit('receive_message', messageToEmit);

            // --- BOT LOGIC ---
            // If the receiver is the Pilot Bot, reply automatically
            const receiverUser = await User.findById(data.receiverId);
            if (receiverUser && receiverUser.email === 'bot@chatpilot.ai') {
                console.log("🤖 Message received by Pilot Bot. Generating reply...");
                
                // Simulate thinking delay
                setTimeout(async () => {
                    try {
                        const keys = [process.env.GEMINI_API_KEY, process.env.SECONDARY_GEMINI_KEY].filter(Boolean);
                        let botReplyText = "";
                        let success = false;

                        for (const key of keys) {
                            if (success) break;
                            try {
                                const tempGenAI = new GoogleGenerativeAI(key);
                                const botModel = tempGenAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                                const result = await botModel.generateContent(`
                                    You are "Pilot Bot", a helpful AI assistant in the ChatPilot app.
                                    User just said: "${data.content}"
                                    
                                    Reply normally as a helpful assistant. Keep it concise (under 2 sentences).
                                `);
                                const response = await result.response;
                                botReplyText = response.text().trim();
                                success = true;
                            } catch (err) {
                                console.warn(`🤖 Bot Key fallback trigger: ${err.message}`);
                            }
                        }

                        if (!success) throw new Error("Bot AI failed");

                        const botMsgData = {
                            room: data.room,
                            senderId: data.receiverId, // Bot sends
                            receiverId: data.senderId, // User receives
                            content: botReplyText,
                            timestamp: new Date(),
                            isAiGenerated: true
                        };


                        // Save Bot Message
                        const botMessage = new Message(botMsgData);
                        await botMessage.save();

                        // Update Conversation
                        conv.lastMessage = botMsgData;
                        conv.updatedAt = new Date();
                        await conv.save();

                        // Emit Bot Reply
                        const botEmit = { ...botMessage._doc, room: data.room };
                        io.to(data.room).emit('receive_message', botEmit);
                        io.to(data.senderId).emit('receive_message', botEmit); // Notify user

                    } catch (botErr) {
                        console.error("Bot Reply Error:", botErr);
                    }
                }, 1500);
            }
            // ----------------

        } catch (err) {
            console.error('Error saving message:', err);
        }
    });

    socket.on('accept_request', (data) => {
        socket.to(data.receiverId).emit('request_accepted', data);
    });

    socket.on('disconnect', () => {
        console.log('User Disconnected', socket.id);
    });
});

// Demo Auth Endpoint
app.post('/api/auth/demo', async (req, res) => {
    try {
        // 1. Ensure Bot Exists
        let botUser = await User.findOne({ email: 'bot@chatpilot.ai' });
        if (!botUser) {
            // Create Bot if doesn't exist
            botUser = new User({
                username: 'Pilot Bot',
                email: 'bot@chatpilot.ai',
                phoneNumber: '0000000000',
                password: 'bot_password_secure', // Not used really
            });
            await botUser.save();
        }

        // 2. Create Guest User
        const randomId = Math.floor(Math.random() * 10000);
        const guestUser = new User({
            username: `Guest Pilot ${randomId}`,
            email: `guest${randomId}@demo.com`,
            phoneNumber: `99${randomId.toString().padStart(8, '0')}`,
            password: 'demo_password' 
        });
        await guestUser.save();

        // 3. Create Conversation between Guest and Bot
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
        
        // Return Guest User Data (Simulate Login)
        // Note: Ideally we return a JWT, but for now filtering password is enough if using same structure
        const { password, ...userData } = guestUser._doc;
        res.json(userData);

    } catch (err) {
        console.error("Demo Login Error:", err);
        res.status(500).json({ error: "Failed to create demo session" });
    }
});


// AI Suggestions Endpoint
app.post('/api/generate-suggestions', async (req, res) => {
    let autoMode = false;
    try {
        const { chatHistory, autoMode: mode } = req.body;
        autoMode = mode;
        
        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "YOUR_API_KEY_HERE") {
            console.error("CRITICAL: GEMINI_API_KEY is missing or invalid in .env");
            return res.status(500).json({ error: "AI configuration missing." });
        }

        let prompt = "";
// ... (prompts remain the same) ...
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
        - Ignore older topics if the conversation has shifted.
        
        Return ONLY a JSON array of 3 strings. No markdown.
        Example: ["New Delhi", "It's New Delhi.", "Not sure, let me check."]
        
        Chat History: ${JSON.stringify(chatHistory)}`;
        }

        console.log("🤖 Requesting Gemini 1.5 Flash for prompt...");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Use stable model version

        const keys = [process.env.GEMINI_API_KEY, process.env.SECONDARY_GEMINI_KEY].filter(Boolean);
        let text = "";
        let success = false;

        for (const key of keys) {
            if (success) break;
            const tempGenAI = new GoogleGenerativeAI(key);
            const tempModel = tempGenAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            for (let attempt = 1; attempt <= 2; attempt++) {
                try {
                    const result = await tempModel.generateContent(prompt);
                    const response = await result.response;
                    text = response.text().trim();
                    success = true;
                    break;
                } catch (err) {
                    console.warn(`⚠️ Key ${key.substring(0, 10)}... Attempt ${attempt} failed: ${err.message}`);
                    if (err.message.includes('429') || err.message.includes('API_KEY_INVALID')) {
                        // Rate limit or invalid key -> Move to next key immediately
                        break; 
                    }
                    if (attempt === 2) break; 
                    await new Promise(r => setTimeout(r, 2000));
                }
            }
        }
        
        if (!success) throw new Error("All AI keys exhausted or failed.");

        
        console.log("📡 Raw AI Output:", text);

        // Improved JSON extraction logic
        let cleanText = text;
        
        // Remove markdown code blocks if present
        if (text.includes('```')) {
            const matches = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            if (matches) {
                cleanText = matches[1];
            }
        }
        cleanText = cleanText.trim();

        // If it's still not looking like JSON, try to find the first [ or {
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
            console.log("✅ Successfully parsed AI response:", parsed);
            res.json(parsed);
        } catch (parseError) {
            console.error("❌ AI returned unparseable text after cleaning:", cleanText);
            
            // Critical Fallback: Try regex for specific fields
            if (autoMode) {
                const replyMatch = cleanText.match(/"reply":\s*"([^"]*)"/);
                if (replyMatch) {
                    res.json({ reply: replyMatch[1], confidence_score: 85 });
                    return;
                }
            } else {
                // Try to find anything that looks like a quoted string in a list-like format
                const strings = cleanText.match(/"([^"]+)"/g);
                if (strings && strings.length >= 3) {
                    const suggestions = strings.slice(0, 3).map(s => s.replace(/"/g, ''));
                    res.json(suggestions);
                    return;
                }
            }
            res.status(500).json({ error: "Failed to parse AI response", raw: text });
        }
    } catch (error) {
        console.error("🛑 GEMINI API ERROR:", error.message);
        
        let errorMsg = "AI Pilot Unavailable";
        
        if (error.message.includes('503') || error.message.includes('overloaded')) {
            errorMsg = "AI Server Overloaded - Try Again";
        } else if (error.message.includes('429')) {
             errorMsg = "AI Traffic High - Standby";
        }

        // Fallback Mechanism
        // Return a structured error response that the frontend can display gracefully
        const fallbackSuggestions = [
             "(System: " + errorMsg + ")"
        ];
        
        if (autoMode) {
            res.json({ reply: `[SYSTEM ALERT: ${errorMsg}]`, confidence_score: 0 });
        } else {
            res.json(fallbackSuggestions);
        }
    }
});

// AI Draft/Composer Endpoint
app.post('/api/generate-draft', async (req, res) => {
    try {
        const { prompt: userPrompt, chatHistory } = req.body;
        
        if (!userPrompt) return res.status(400).json({ error: "Prompt required" });

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const systemPrompt = `You are an AI writing assistant for a chat app. 
        TASK: Rewrite the user's raw instruction into a natural, casual WhatsApp-style message.
        STYLE: Short, human, minimal punctuation, maybe 1 emoji. No quotes.
        
        User Instruction: "${userPrompt}"
        
        Output only the message text.`;

        let text = "";
        // Retry Logic
        for (let attempt = 1; attempt <= 2; attempt++) {
            try {
                const result = await model.generateContent(systemPrompt);
                const response = await result.response;
                text = response.text().trim().replace(/^"|"$/g, '');
                break;
            } catch (err) {
                console.warn(`⚠️ Draft Attempt ${attempt} failed: ${err.message}`);
                if (attempt === 2) throw err;
                await new Promise(r => setTimeout(r, 2000));
            }
        }
        
        res.json({ draft: text });
    } catch (error) {
        console.error("AI Draft Error:", error);
        res.status(500).json({ error: "Failed to generate draft" });
    }
});

// Messages & Conversations

// Check/Get Conversation Status
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

// Update Conversation Status (Accept/Block)
app.post('/api/conversation/update', async (req, res) => {
    try {
        const { conversationId, status } = req.body;
        const conv = await Conversation.findByIdAndUpdate(conversationId, { status }, { new: true });
        res.json(conv);
    } catch (err) {
        res.status(500).json(err);
    }
});

// Get Messages
app.get('/api/messages/:room', async (req, res) => {
    try {
        const [id1, id2] = req.params.room.split('_');

        // Find existing conversation or create pending if sending msg?
        // Actually this is just GET.

        const messages = await Message.find({
            $or: [
                { senderId: id1, receiverId: id2 },
                { senderId: id2, receiverId: id1 }
            ]
        }).sort({ timestamp: 1 });
        res.json(messages);
    } catch (err) {
        console.log(err);
        res.status(500).json(err);
    }
});

// Get User's Conversations
app.get('/api/conversations/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        // Find conversations where user is a participant
        const conversations = await Conversation.find({
            participants: { $in: [userId] }
        })
            .populate('participants', '-password') // Populate user details
            .sort({ updatedAt: -1 });

        // Transform to return list of "Contacts" (the other person)
        // We also want to include the last message and status if possible
        const contacts = conversations.map(conv => {
            const otherUser = conv.participants.find(p => p._id.toString() !== userId);
            return {
                ...otherUser._doc, // User details
                conversationId: conv._id,
                status: conv.status,
                lastMessage: conv.lastMessage,
                updatedAt: conv.updatedAt
            };
        });

        res.json(contacts);
    } catch (err) {
        console.error(err);
        res.status(500).json(err);
    }
});

// MongoDB Connection
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/chatpilot';
mongoose.connect(mongoUri)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
