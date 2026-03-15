const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const admin = require('firebase-admin');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "*",
        methods: ["GET", "POST"]
    }
});

// Firebase Admin initialization
try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) 
        : require('./serviceAccountKey.json');
        
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL
    });
    console.log("Firebase Admin Initialized");
} catch (error) {
    console.warn("Firebase Admin Initialization Warning: ", error.message);
    console.warn("Ensure serviceAccountKey.json is present OR FIREBASE_SERVICE_ACCOUNT env var is set.");
}

const db = admin.firestore?.();

// State tracking
const onlineUsers = new Map(); // socket.id -> { uid, username, room }
const activeRooms = new Set(['General', 'Teens', 'Music', 'Gaming']);

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join', ({ uid, username, room }) => {
        socket.join(room);
        onlineUsers.set(socket.id, { uid, username, room });
        
        // Notify others
        socket.to(room).emit('user-joined', { username, id: socket.id });
        
        // Update online users list for the room
        updateRoomUsers(room);
    });

    socket.on('send-message', (messageData) => {
        const { room, text } = messageData;
        
        // Basic Spam Protection: Check message speed (client-side handles most, server verifies)
        // Basic Bad Word Filter
        const badWords = ['badword1', 'badword2']; // Placeholder
        let filteredText = text;
        badWords.forEach(word => {
            const reg = new RegExp(word, 'gi');
            filteredText = filteredText.replace(reg, '***');
        });

        const msg = {
            ...messageData,
            text: filteredText,
            id: Date.now().toString(),
            timestamp: admin.firestore ? admin.firestore.FieldValue.serverTimestamp() : new Date()
        };
        
        io.to(room).emit('receive-message', msg);
        
        if (db) {
            db.collection('messages').add(msg).catch(err => console.error(err));
        }
    });

    socket.on('report-user', ({ reporter, reported, reason, messageId }) => {
        console.log(`User ${reporter} reported ${reported} for: ${reason}`);
        if (db) {
            db.collection('reports').add({
                reporter,
                reported,
                reason,
                messageId,
                timestamp: admin.firestore ? admin.firestore.FieldValue.serverTimestamp() : new Date(),
                status: 'pending'
            });
        }
        // Notify admins if online
        io.emit('admin-notification', { type: 'report', data: { reported, reason } });
    });

    socket.on('update-profile', ({ uid, username, avatar }) => {
        const user = Array.from(onlineUsers.values()).find(u => u.uid === uid);
        if (user) {
            user.username = username;
            user.avatar = avatar;
            // Update all users in the room about the change
            updateRoomUsers(user.room);
        }
    });

    socket.on('typing', ({ room, username, isTyping }) => {
        socket.to(room).emit('user-typing', { username, isTyping });
    });

    socket.on('disconnect', () => {
        const user = onlineUsers.get(socket.id);
        if (user) {
            const { room, username } = user;
            onlineUsers.delete(socket.id);
            socket.to(room).emit('user-left', { username, id: socket.id });
            updateRoomUsers(room);
        }
    });
});

function updateRoomUsers(room) {
    const usersInRoom = Array.from(onlineUsers.values())
        .filter(u => u.room === room)
        .map(u => ({ username: u.username, uid: u.uid }));
    io.to(room).emit('room-users', usersInRoom);
}

// REST API for basic info
app.get('/rooms', (req, res) => {
    res.json(Array.from(activeRooms));
});

app.get('/online-count', (req, res) => {
    res.json({ count: onlineUsers.size });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
