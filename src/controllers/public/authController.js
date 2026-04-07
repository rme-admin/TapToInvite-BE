const prisma = require('../../config/db');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../../utils/sendEmail');
const { getConfig } = require('../../utils/configHelper');

// 1. REGISTER
exports.register = async (req, res) => {
    try {
        const { name, email, country_code, phone, address } = req.body;

        if (!address || !address.line_1 || !address.city || !address.pincode) {
            return res.status(400).json({ success: false, message: "Complete address details are required." });
        }

        const existingUser = await prisma.user.findFirst({
            where: { OR: [{ email }, { phone }] }
        });

        if (existingUser) {
            return res.status(400).json({ success: false, message: "Email or Phone already registered." });
        }

        const verificationToken = crypto.randomBytes(32).toString('hex');

        const newUser = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    name,
                    email,
                    country_code: country_code || "+91",
                    phone,
                    status: 'unverified',
                    verification_token: verificationToken,
                    role: 'user'
                }
            });

            await tx.userDetails.create({
                data: {
                    user_id: user.id,
                    address_line_1: address.line_1,
                    address_line_2: address.line_2 || null,
                    city: address.city,
                    state: address.state,
                    pincode: address.pincode,
                    country: address.country || "India"
                }
            });
            return user;
        });

        const frontendUrl = await getConfig('frontend_url') || 'http://localhost:9002';
        const setupPasswordLink = `${frontendUrl}/setup-password?token=${verificationToken}`;

        const emailHtml = `<h1>Welcome, ${name}!</h1><p>Please <a href="${setupPasswordLink}">click here</a> to set your password and verify your account.</p>`;

        await sendEmail({
            email: newUser.email,
            subject: "Verify your TapToInvite Account",
            message: emailHtml
        });

        res.status(201).json({ success: true, message: "Registration successful! Verification email sent." });

    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// 2. SETUP PASSWORD (Verify Link)
exports.setupPassword = async (req, res) => {
    try {
        const { token, password } = req.body;
        const user = await prisma.user.findFirst({ where: { verification_token: token } });

        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid or expired link." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password_hash: hashedPassword,
                status: 'active',
                verification_token: null
            }
        });

        res.status(200).json({ success: true, message: "Account activated! You can now login." });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// 3. LOGIN
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || user.status !== 'active') {
            return res.status(401).json({ success: false, message: "Invalid credentials or unverified account." });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(401).json({ success: false, message: "Invalid credentials." });

        const accessToken = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
        const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

        await prisma.user.update({ where: { id: user.id }, data: { refresh_token: refreshToken } });

        res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 7*24*60*60*1000 });

        res.status(200).json({ success: true, accessToken, user: { id: user.id, name: user.name, role: user.role } });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};