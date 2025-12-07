const mongoose = require('mongoose');

/**
 * RFP (Request for Proposal) Schema
 * Stores structured RFP data generated from natural language input
 */
const rfpSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    // Items being procured (extracted by AI)
    items: [{
        name: String,
        quantity: Number,
        specifications: String
    }],
    budget: {
        type: Number,
        required: true
    },
    deadline: {
        type: Date,
        required: true
    },
    // Terms and conditions
    terms: {
        paymentTerms: String,
        warranty: String,
        deliveryTerms: String,
        otherTerms: String
    },
    // Vendors this RFP was sent to
    vendors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor'
    }],
    status: {
        type: String,
        enum: ['draft', 'sent', 'closed'],
        default: 'draft'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('RFP', rfpSchema);
