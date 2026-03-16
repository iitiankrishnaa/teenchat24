const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const admin = require('firebase-admin');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '55mb' }));

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "*",
        methods: ["GET", "POST"]
    },
    maxHttpBufferSize: 55 * 1024 * 1024
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

const db = admin.apps.length ? admin.firestore() : null;

// State tracking
const onlineUsers = new Map(); // socket.id -> { uid, username, room }
const activeRooms = new Set(['General', 'Teens', 'Music', 'Gaming']);
const liveStreams = new Map(); // room -> { hostSocketId, hostUsername, startedAt }

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

    // Live stream controls
    socket.on('start-live', ({ room, username }) => {
        if (!room || !username) return;
        liveStreams.set(room, {
            hostSocketId: socket.id,
            hostUsername: username,
            startedAt: Date.now()
        });
        io.to(room).emit('live-started', { room, hostSocketId: socket.id, hostUsername: username });
    });

    socket.on('stop-live', ({ room }) => {
        if (!room) return;
        const stream = liveStreams.get(room);
        if (stream && stream.hostSocketId === socket.id) {
            liveStreams.delete(room);
            io.to(room).emit('live-stopped', { room, hostSocketId: socket.id });
        }
    });

    // WebRTC signaling relay
    socket.on('live-offer', ({ targetSocketId, offer, room }) => {
        if (!targetSocketId || !offer) return;
        io.to(targetSocketId).emit('live-offer', {
            fromSocketId: socket.id,
            offer,
            room
        });
    });


    socket.on('live-offer-request', ({ targetSocketId, room }) => {
        if (!targetSocketId) return;
        io.to(targetSocketId).emit('live-offer-request', {
            fromSocketId: socket.id,
            room
        });
    });

    socket.on('live-answer', ({ targetSocketId, answer }) => {
        if (!targetSocketId || !answer) return;
        io.to(targetSocketId).emit('live-answer', {
            fromSocketId: socket.id,
            answer
        });
    });

    socket.on('live-ice-candidate', ({ targetSocketId, candidate }) => {
        if (!targetSocketId || !candidate) return;
        io.to(targetSocketId).emit('live-ice-candidate', {
            fromSocketId: socket.id,
            candidate
        });
    });

    socket.on('request-live-stream', ({ room }) => {
        if (!room) return;
        const stream = liveStreams.get(room) || null;
        socket.emit('live-stream-status', stream);
    });

    socket.on('disconnect', () => {
        const user = onlineUsers.get(socket.id);
        if (user) {
            const { room, username } = user;

            const live = liveStreams.get(room);
            if (live && live.hostSocketId === socket.id) {
                liveStreams.delete(room);
                io.to(room).emit('live-stopped', { room, hostSocketId: socket.id });
            }

            onlineUsers.delete(socket.id);
            socket.to(room).emit('user-left', { username, id: socket.id });
            updateRoomUsers(room);
        }
    });
});

function updateRoomUsers(room) {
    const usersInRoom = Array.from(onlineUsers.entries())
        .filter(([, u]) => u.room === room)
        .map(([socketId, u]) => ({ username: u.username, uid: u.uid, socketId }));
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
