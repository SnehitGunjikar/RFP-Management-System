const express = require('express');
const router = express.Router();
const RFP = require('../models/RFP');
const Vendor = require('../models/Vendor');
const aiService = require('../services/ai.service');
const emailService = require('../services/email.service');

/**
 * @route   POST /api/rfps/create
 * @desc    Create RFP from natural language description
 * @access  Public
 */
router.post('/create', async (req, res) => {
    try {
        const { description } = req.body;

        if (!description) {
            return res.status(400).json({
                success: false,
                message: 'Description is required'
            });
        }

        // Use AI to parse natural language into structured data
        const structured = await aiService.parseRFPFromNaturalLanguage(description);

        // Calculate deadline date (if AI returned days, convert to date)
        let deadlineDate = new Date();
        if (structured.deadline) {
            if (typeof structured.deadline === 'string') {
                // Try to parse as date or extract days
                const daysMatch = structured.deadline.match(/(\d+)\s*days?/i);
                if (daysMatch) {
                    deadlineDate.setDate(deadlineDate.getDate() + parseInt(daysMatch[1]));
                } else {
                    deadlineDate = new Date(structured.deadline);
                }
            } else if (typeof structured.deadline === 'number') {
                deadlineDate.setDate(deadlineDate.getDate() + structured.deadline);
            }
        } else {
            deadlineDate.setDate(deadlineDate.getDate() + 30); // Default 30 days
        }

        // Create RFP in database
        const rfp = new RFP({
            title: structured.title || 'Untitled RFP',
            description: description,
            items: structured.items || [],
            budget: structured.budget || 0,
            deadline: deadlineDate,
            terms: structured.terms || {},
            status: 'draft'
        });

        await rfp.save();

        res.status(201).json({
            success: true,
            rfp,
            structured // Return the AI-parsed data for reference
        });
    } catch (error) {
        console.error('Error creating RFP:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while creating RFP',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/rfps
 * @desc    Get all RFPs
 * @access  Public
 */
router.get('/', async (req, res) => {
    try {
        const rfps = await RFP.find()
            .populate('vendors', 'name email company')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: rfps.length,
            rfps
        });
    } catch (error) {
        console.error('Error fetching RFPs:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching RFPs'
        });
    }
});

/**
 * @route   GET /api/rfps/:id
 * @desc    Get single RFP by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
    try {
        const rfp = await RFP.findById(req.params.id)
            .populate('vendors', 'name email company');

        if (!rfp) {
            return res.status(404).json({
                success: false,
                message: 'RFP not found'
            });
        }

        res.json({
            success: true,
            rfp
        });
    } catch (error) {
        console.error('Error fetching RFP:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching RFP'
        });
    }
});

/**
 * @route   POST /api/rfps/:id/send
 * @desc    Send RFP to selected vendors via email
 * @access  Public
 */
router.post('/:id/send', async (req, res) => {
    try {
        const { vendorIds } = req.body;

        if (!vendorIds || !Array.isArray(vendorIds) || vendorIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Vendor IDs array is required'
            });
        }

        const rfp = await RFP.findById(req.params.id);

        if (!rfp) {
            return res.status(404).json({
                success: false,
                message: 'RFP not found'
            });
        }

        // Get vendor details
        const vendors = await Vendor.find({ _id: { $in: vendorIds } });

        if (vendors.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No valid vendors found'
            });
        }

        // Send emails
        const result = await emailService.sendRFPEmail(rfp, vendors);

        // Update RFP with vendor list and status
        rfp.vendors = vendorIds;
        rfp.status = 'sent';
        await rfp.save();

        res.json({
            success: true,
            ...result,
            rfp
        });
    } catch (error) {
        console.error('Error sending RFP:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while sending RFP',
            error: error.message
        });
    }
});

/**
 * @route   PUT /api/rfps/:id
 * @desc    Update RFP
 * @access  Public
 */
router.put('/:id', async (req, res) => {
    try {
        const rfp = await RFP.findById(req.params.id);

        if (!rfp) {
            return res.status(404).json({
                success: false,
                message: 'RFP not found'
            });
        }

        // Update allowed fields
        const allowedFields = ['title', 'description', 'items', 'budget', 'deadline', 'terms', 'status'];
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                rfp[field] = req.body[field];
            }
        });

        await rfp.save();

        res.json({
            success: true,
            rfp
        });
    } catch (error) {
        console.error('Error updating RFP:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating RFP'
        });
    }
});

module.exports = router;
