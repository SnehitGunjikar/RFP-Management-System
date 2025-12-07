const express = require('express');
const router = express.Router();
const Proposal = require('../models/Proposal');
const RFP = require('../models/RFP');
const emailService = require('../services/email.service');
const aiService = require('../services/ai.service');

/**
 * @route   GET /api/proposals/rfp/:rfpId
 * @desc    Get all proposals for a specific RFP
 * @access  Public
 */
router.get('/rfp/:rfpId', async (req, res) => {
    try {
        const proposals = await Proposal.find({ rfpId: req.params.rfpId })
            .populate('vendorId', 'name email company')
            .sort({ receivedAt: -1 });

        res.json({
            success: true,
            count: proposals.length,
            proposals
        });
    } catch (error) {
        console.error('Error fetching proposals:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching proposals'
        });
    }
});

/**
 * @route   POST /api/proposals/check-emails
 * @desc    Manually trigger email check for new vendor responses
 * @access  Public
 */
router.post('/check-emails', async (req, res) => {
    try {
        const result = await emailService.checkIncomingEmails();

        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('Error checking emails:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while checking emails',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/proposals/:rfpId/compare
 * @desc    Get AI-powered comparison and recommendation for proposals
 * @access  Public
 */
router.get('/:rfpId/compare', async (req, res) => {
    try {
        const rfp = await RFP.findById(req.params.rfpId);

        if (!rfp) {
            return res.status(404).json({
                success: false,
                message: 'RFP not found'
            });
        }

        const proposals = await Proposal.find({ rfpId: req.params.rfpId })
            .populate('vendorId', 'name email company');

        if (proposals.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No proposals found for this RFP'
            });
        }

        // Get AI comparison
        const comparison = await aiService.compareProposals(rfp, proposals);

        // Update proposals with AI scores and summaries
        for (let i = 0; i < proposals.length; i++) {
            if (comparison.scores && comparison.scores[i] !== undefined) {
                proposals[i].aiScore = comparison.scores[i];
            }
            if (comparison.summaries && comparison.summaries[i]) {
                proposals[i].aiSummary = comparison.summaries[i];
            }
            await proposals[i].save();
        }

        res.json({
            success: true,
            proposals,
            comparison: {
                scores: comparison.scores,
                summaries: comparison.summaries,
                recommendation: comparison.recommendation
            }
        });
    } catch (error) {
        console.error('Error comparing proposals:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while comparing proposals',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/proposals/:id
 * @desc    Get single proposal by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
    try {
        const proposal = await Proposal.findById(req.params.id)
            .populate('vendorId', 'name email company')
            .populate('rfpId', 'title budget deadline');

        if (!proposal) {
            return res.status(404).json({
                success: false,
                message: 'Proposal not found'
            });
        }

        res.json({
            success: true,
            proposal
        });
    } catch (error) {
        console.error('Error fetching proposal:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching proposal'
        });
    }
});

module.exports = router;
