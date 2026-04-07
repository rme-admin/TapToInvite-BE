const prisma = require('../../config/db');

/**
 * GET /api/public/content/:pageSlug
 * Fetch page content from database (PUBLIC - No Authentication Required)
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
                page_slug: pageSlug
            }
        });

        // If not found, return 404
        if (!siteContent) {
            return res.status(404).json({
                success: false,
                message: `Content for page '${pageSlug}' not found.`,
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
                updated_at: siteContent.updated_at
            }
        });

    } catch (error) {
        console.error("Get Page Content Error:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching page content",
            error: error.message
        });
    }
};
