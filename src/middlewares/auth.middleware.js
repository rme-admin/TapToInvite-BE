const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1] || req.cookies.accessToken;
    if (!token) return res.status(401).json({ message: "Access Denied. No token provided." });

    try {
        const verified = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        req.user = verified; // Contains id and role
        next();
    } catch (err) {
        res.status(403).json({ message: "Invalid or Expired Token" });
    }
};

const authorizeRole = (role) => {
    return (req, res, next) => {
        if (req.user.role !== role) {
            return res.status(403).json({ message: `Access Denied. ${role} only.` });
        }
        next();
    };
};

module.exports = { verifyToken, authorizeRole };