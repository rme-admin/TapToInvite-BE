require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

// Import Routes
const publicRoutes = require('./src/routes/public.routes');
const userRoutes = require('./src/routes/user.routes');
const adminRoutes = require('./src/routes/admin.routes');

const app = express();

// --- MIDDLEWARES ---
app.use(express.json()); // Parses incoming JSON requests
app.use(express.urlencoded({ extended: true })); // Parses URL-encoded data
app.use(cookieParser()); // Parses cookies for Refresh Tokens

// CORS Configuration (Allow your frontend to talk to your backend)
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:9002',
    credentials: true
}));

// --- ROUTE MOUNTING ---

// 1. Public Routes: Registration, Login, Plans, Templates
app.use('/api/public', publicRoutes);

// 2. User Routes: Profile, My Orders, Subscriptions (Protected by verifyToken inside the file)
app.use('/api/user', userRoutes);

// 3. Admin Routes: Content Management, Configuration, etc. (Protected by verifyToken + authorizeRole)
app.use('/api/admin', adminRoutes);

// --- BASE ROUTE ---
app.get('/', (req, res) => {
    res.send('TapToInvite API is running...');
});

// --- GLOBAL ERROR HANDLER ---
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: err.message || 'Something went wrong on the server!'
    });
});

// --- SERVER START ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log(`🌐 Accepting requests from http://localhost:9002`);
});