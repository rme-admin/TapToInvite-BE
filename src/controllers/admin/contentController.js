const prisma = require('../../config/db');

/**
 * GET /api/admin/content/:pageSlug
 * Fetch landing page content from database
 */
exports.getPageContent = async (req, res) => {
    try {
        const { pageSlug } = req.params;

        // Validate page slug
        if (!pageSlug) {
            return res.status(400).json({
                success: false,
                message: "Page slug is required."
            });
        }

        // Find the content from database
        const siteContent = await prisma.siteContent.findFirst({
            where: {
                page_slug: pageSlug,
                content_key: 'landing' // or can be generic if needed
            }
        });

        // If not found, return default placeholder message
        if (!siteContent) {
            return res.status(404).json({
                success: false,
                message: `Content for page '${pageSlug}' not found. Please create it first.`,
                content: null
            });
        }

        // Parse JSON content
        let parsedContent = {};
        try {
            parsedContent = JSON.parse(siteContent.content);
        } catch (parseError) {
            console.error("JSON Parse Error:", parseError);
            parsedContent = siteContent.content;
        }

        res.status(200).json({
            success: true,
            message: "Content fetched successfully",
            data: {
                id: siteContent.id,
                page_slug: siteContent.page_slug,
                title: siteContent.title,
                content: parsedContent,
                last_updated_by: siteContent.last_updated_by,
                updated_at: siteContent.updated_at
            }
        });

    } catch (error) {
        console.error("Get Page Content Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch page content",
            error: error.message
        });
    }
};

/**
 * POST /api/admin/content/:pageSlug
 * Save or update landing page content
 */
exports.savePageContent = async (req, res) => {
    try {
        const { pageSlug } = req.params;
        const { title, content } = req.body;
        const userId = req.user.id; // From auth middleware

        // Validate input
        if (!pageSlug) {
            return res.status(400).json({
                success: false,
                message: "Page slug is required."
            });
        }

        if (!title || !content) {
            return res.status(400).json({
                success: false,
                message: "Title and content are required."
            });
        }

        // Convert content to JSON string
        const contentString = typeof content === 'string' ? content : JSON.stringify(content);

        // Check if content already exists
        const existingContent = await prisma.siteContent.findFirst({
            where: {
                page_slug: pageSlug,
                content_key: 'landing'
            }
        });

        let savedContent;

        if (existingContent) {
            // UPDATE existing content
            savedContent = await prisma.siteContent.update({
                where: { id: existingContent.id },
                data: {
                    title: title,
                    content: contentString,
                    last_updated_by: userId,
                    updated_at: new Date()
                }
            });
        } else {
            // CREATE new content
            savedContent = await prisma.siteContent.create({
                data: {
                    page_slug: pageSlug,
                    content_key: 'landing',
                    title: title,
                    content: contentString,
                    last_updated_by: userId
                }
            });
        }

        // Parse the saved content for response
        let parsedContent = {};
        try {
            parsedContent = JSON.parse(savedContent.content);
        } catch (parseError) {
            parsedContent = savedContent.content;
        }

        res.status(existingContent ? 200 : 201).json({
            success: true,
            message: existingContent ? "Content updated successfully" : "Content created successfully",
            data: {
                id: savedContent.id,
                page_slug: savedContent.page_slug,
                title: savedContent.title,
                content: parsedContent,
                last_updated_by: savedContent.last_updated_by,
                updated_at: savedContent.updated_at
            }
        });

    } catch (error) {
        console.error("Save Page Content Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to save page content",
            error: error.message
        });
    }
};

/**
 * DELETE /api/admin/content/:pageSlug
 * Delete page content
 */
exports.deletePageContent = async (req, res) => {
    try {
        const { pageSlug } = req.params;

        if (!pageSlug) {
            return res.status(400).json({
                success: false,
                message: "Page slug is required."
            });
        }

        const deleted = await prisma.siteContent.deleteMany({
            where: {
                page_slug: pageSlug,
                content_key: 'landing'
            }
        });

        if (deleted.count === 0) {
            return res.status(404).json({
                success: false,
                message: `Content for page '${pageSlug}' not found.`
            });
        }

        res.status(200).json({
            success: true,
            message: "Content deleted successfully",
            deleted_count: deleted.count
        });

    } catch (error) {
        console.error("Delete Page Content Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete page content",
            error: error.message
        });
    }
};

/**
 * GET /api/admin/content
 * Get all pages content (paginated)
 */
exports.getAllPagesContent = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        const allContent = await prisma.siteContent.findMany({
            skip: parseInt(skip),
            take: parseInt(limit),
            orderBy: {
                updated_at: 'desc'
            }
        });

        const total = await prisma.siteContent.count();

        // Parse content for all entries
        const parsedContent = allContent.map(item => {
            let parsed = {};
            try {
                parsed = JSON.parse(item.content);
            } catch (e) {
                parsed = item.content;
            }
            return {
                id: item.id,
                page_slug: item.page_slug,
                title: item.title,
                content: parsed,
                last_updated_by: item.last_updated_by,
                updated_at: item.updated_at
            };
        });

        res.status(200).json({
            success: true,
            message: "All content fetched successfully",
            data: parsedContent,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error("Get All Pages Content Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch all pages content",
            error: error.message
        });
    }
};
