const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * Upload directory configuration
 */
const UPLOAD_DIR = path.join(__dirname, '../../public/uploads');
const SUBDIRS = {
    site_contents: path.join(UPLOAD_DIR, 'site-contents'),
    normal_invitations: path.join(UPLOAD_DIR, 'normal_invitations'),
    nfc_templates: path.join(UPLOAD_DIR, 'nfc_templates'),
    card_templates: path.join(UPLOAD_DIR, 'card_templates'),
    event_categories: path.join(UPLOAD_DIR, 'event_categories'),
    plan_icons: path.join(UPLOAD_DIR, 'plan_icons'),
    profile_images: path.join(UPLOAD_DIR, 'profile_images'),
    order_documents: path.join(UPLOAD_DIR, 'order_documents'),
};

/**
 * Initialize upload directories
 */
Object.values(SUBDIRS).forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

/**
 * Configure storage for multer
 */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const folder = req.uploadFolder || 'site_contents';
        const uploadPath = SUBDIRS[folder];
        
        if (!uploadPath) {
            return cb(new Error(`Invalid upload folder: ${folder}`));
        }
        
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Generate unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext);
        cb(null, `${name}-${uniqueSuffix}${ext}`);
    }
});

/**
 * File filter for image uploads
 */
const imageFileFilter = (req, file, cb) => {
    // Allowed image MIME types
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only image files are allowed.'));
    }
};

/**
 * File filter for document uploads
 */
const documentFileFilter = (req, file, cb) => {
    const allowedMimes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF and Word documents are allowed.'));
    }
};

/**
 * Multer configuration for image uploads
 */
const uploadImage = multer({
    storage: storage,
    fileFilter: imageFileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});

/**
 * Multer configuration for document uploads
 */
const uploadDocument = multer({
    storage: storage,
    fileFilter: documentFileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    }
});

/**
 * Middleware to set upload folder
 */
const setUploadFolder = (folder) => {
    return (req, res, next) => {
        req.uploadFolder = folder;
        next();
    };
};

/**
 * Get relative path for uploaded file
 */
const getUploadPath = (filename, folder = 'site_contents') => {
    return `/uploads/${folder}/${filename}`;
};

module.exports = {
    uploadImage,
    uploadDocument,
    setUploadFolder,
    getUploadPath,
    SUBDIRS,
    UPLOAD_DIR
};
