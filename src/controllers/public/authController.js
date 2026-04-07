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

// 4. FORGOT PASSWORD (Placeholder)

// 4. FORGOT PASSWORD
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        // 1. Check if user exists
        const user = await prisma.user.findUnique({ where: { email } });

        // Security: Send generic message if user not found
        if (!user) {
            return res.status(200).json({
                success: true,
                message: "A password reset link has been sent to your email. It is valid for 12 hours."
            });
        }

        // 2. Generate a secure reset token
        const resetToken = crypto.randomBytes(32).toString('hex');

        // 3. Set expiry for 12 hours from now
        const expiry = new Date();
        expiry.setHours(expiry.getHours() + 12);

        // 4. Save to Database
        await prisma.user.update({
            where: { id: user.id },
            data: {
                reset_token: resetToken,
                reset_token_expiry: expiry
            }
        });

        // 5. Send Email Logic
        const frontendUrl = await getConfig('frontend_url') || 'http://localhost:9002';
        const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;
        const emailHtml = `<h2>Password Reset Request</h2><p>Click <a href="${resetLink}">here</a> to reset your password. This link is valid for 12 hours.</p>`;

        await sendEmail({
            email: user.email,
            subject: "Reset your TapToInvite password",
            message: emailHtml
        });

        res.status(200).json({
            success: true,
            message: "A password reset link has been sent to your email. It is valid for 12 hours."
        });
    } catch (error) {
        console.error("Forgot Password Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// 5. RESET PASSWORD (Placeholder)

// 5. RESET PASSWORD
exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        // 1. Find user with this token and check if it has NOT expired
        const user = await prisma.user.findFirst({
            where: {
                reset_token: token,
                reset_token_expiry: {
                    gt: new Date()
                }
            }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired reset link. Please request a new one."
            });
        }

        // 2. Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // 3. Update password and clear the reset fields
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password_hash: hashedPassword,
                reset_token: null,
                reset_token_expiry: null
            }
        });

        // 4. Send confirmation email
        const emailHtml = `<h2>Password Reset Successful</h2><p>Your password has been changed. If you did not perform this action, please contact support immediately.</p>`;
        await sendEmail({
            email: user.email,
            subject: "Your TapToInvite password was reset",
            message: emailHtml
        });

        res.status(200).json({
            success: true,
            message: "Password reset successful! You can now log in with your new password."
        });
    } catch (error) {
        console.error("Reset Password Error:", error);
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