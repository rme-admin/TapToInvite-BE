const prisma = require('../../config/db');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../../utils/sendEmail');
const { getConfig } = require('../../utils/configHelper');

const trySendEmail = async (payload) => {
    try {
        await sendEmail(payload);
        return { sent: true };
    } catch (error) {
        console.error('Email delivery failed:', error.message);
        return { sent: false, error };
    }
};

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

        const emailResult = await trySendEmail({
            email: newUser.email,
            subject: "Verify your TapToInvite Account",
            message: emailHtml
        });

        res.status(201).json({
            success: true,
            message: emailResult.sent
                ? "Registration successful! Verification email sent."
                : "Registration successful, but verification email could not be sent. Please contact support or configure SMTP.",
            email_sent: emailResult.sent
        });

    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// 4. FORGOT PASSWORD (Placeholder)

// 4. FORGOT PASSWORD - Generate and send reset token link
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required."
            });
        }

        // 1. Check if user exists
        const user = await prisma.user.findUnique({ where: { email } });

        // Security: Send generic message if user not found
        if (!user) {
            return res.status(200).json({
                success: true,
                message: "If this email exists in our system, you will receive a password reset link shortly.",
                email_found: false
            });
        }

        // 2. Generate a reset token (32 bytes)
        const resetToken = crypto.randomBytes(32).toString('hex');

        // 3. Set expiry for 24 hours from now
        const expiry = new Date();
        expiry.setHours(expiry.getHours() + 24);

        // 4. Save reset token to Database (clear old OTP fields)
        await prisma.user.update({
            where: { id: user.id },
            data: {
                reset_token: resetToken,
                reset_token_expiry: expiry,
                reset_otp: null,
                reset_otp_expiry: null
            }
        });

        // 5. Send Email with reset link
        const frontendUrl = await getConfig('frontend_url') || 'http://localhost:9002';
        const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

        const emailHtml = `
            <h2>Password Reset Request</h2>
            <p>Click the link below to reset your password:</p>
            <a href="${resetLink}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
                Reset Password
            </a>
            <p>Or copy this link: <a href="${resetLink}">${resetLink}</a></p>
            <p>This link is valid for 24 hours. Do not share this with anyone.</p>
            <p>If you did not request this, please ignore this email.</p>
        `;

        const emailResult = await trySendEmail({
            email: user.email,
            subject: "Your TapToInvite Password Reset Link",
            message: emailHtml
        });

        res.status(200).json({
            success: true,
            message: emailResult.sent
                ? "Password reset link has been sent to your email. It is valid for 24 hours."
                : "Reset link was generated, but email delivery failed. Please configure SMTP.",
            email_sent: emailResult.sent,
            email_found: true
        });
    } catch (error) {
        console.error("Forgot Password Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// 5. RESET PASSWORD - Validate token and update password
exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Reset token and new password are required."
            });
        }

        // Password validation
        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters long."
            });
        }

        // 1. Find user with valid reset token that hasn't expired
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
                message: "Invalid or expired reset link. Please request a new password reset."
            });
        }

        // 2. Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // 3. Update password and clear the reset token fields
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password_hash: hashedPassword,
                reset_token: null,
                reset_token_expiry: null
            }
        });

        // 4. Send confirmation email
        const emailHtml = `
            <h2>Password Reset Successful</h2>
            <p>Your password has been changed successfully.</p>
            <p>If you did not perform this action, please contact support immediately.</p>
        `;
        const emailResult = await trySendEmail({
            email: user.email,
            subject: "Your TapToInvite Password Was Reset",
            message: emailHtml
        });

        res.status(200).json({
            success: true,
            message: emailResult.sent
                ? "Password reset successful! You can now log in with your new password."
                : "Password reset successful, but confirmation email could not be delivered.",
            email_sent: emailResult.sent
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

        res.status(200).json({ 
            success: true, 
            accessToken, 
            refreshToken,
            user: { id: user.id, name: user.name, email: user.email, role: user.role } 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// REFRESH TOKEN - Generate new access token if refresh token is valid
exports.refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({ success: false, message: "Refresh token required" });
        }

        // Verify refresh token
        let decoded;
        try {
            decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        } catch (err) {
            return res.status(403).json({ success: false, message: "Invalid or expired refresh token" });
        }

        // Check if refresh token exists in database and matches
        const user = await prisma.user.findUnique({ where: { id: decoded.id } });

        if (!user || user.refresh_token !== refreshToken) {
            return res.status(403).json({ success: false, message: "Refresh token mismatch or user not found" });
        }

        // Generate new access token
        const newAccessToken = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_ACCESS_SECRET,
            { expiresIn: '15m' }
        );

        res.status(200).json({
            success: true,
            accessToken: newAccessToken,
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        console.error("Refresh Token Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// LOGOUT - Clear refresh token from database
exports.logout = async (req, res) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(400).json({ success: false, message: "User ID required for logout" });
        }

        // Clear refresh token from database
        await prisma.user.update({
            where: { id: userId },
            data: { refresh_token: null }
        });

        // Clear refresh token cookie
        res.clearCookie('refreshToken');

        res.status(200).json({ success: true, message: "Logged out successfully" });
    } catch (error) {
        console.error("Logout Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};