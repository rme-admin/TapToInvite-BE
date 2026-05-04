const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1] || req.cookies.accessToken;
    if (!token) {
        return res.status(401).json({ 
            success: false,
            message: "Access Denied. No token provided.",
            code: 'NO_TOKEN'
        });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        req.user = verified; // Contains id and role
        next();
    } catch (err) {
        // Check if it's an expired token
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false,
                message: "Token expired. Please refresh your token.",
                code: 'TOKEN_EXPIRED'
            });
        }
        
        return res.status(403).json({ 
            success: false,
            message: "Invalid token",
            code: 'INVALID_TOKEN'
        });
    }
};

const authorizeRole = (role) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                success: false,
                message: "User not authenticated",
                code: 'NOT_AUTHENTICATED'
            });
        }
        
        if (req.user.role !== role) {
            return res.status(403).json({ 
                success: false,
                message: `Access Denied. ${role} only.`,
                code: 'UNAUTHORIZED'
            });
        }
        next();
    };
};

module.exports = { verifyToken, authorizeRole };