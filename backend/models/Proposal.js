const mongoose = require('mongoose');

/**
 * Proposal Schema
 * Stores vendor responses to RFPs with AI-extracted data
 */
const proposalSchema = new mongoose.Schema({
    rfpId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RFP',
        required: true
    },
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        required: true
    },
    // AI-extracted structured data from vendor email
    parsedData: {
        type: Object,
        default: {}
    },
    // Raw email content for reference
    rawEmail: {
        type: String,
        required: true
    },
    // Pricing information extracted by AI
    pricing: {
        totalPrice: Number,
        itemPrices: [{
            item: String,
            price: Number,
            quantity: Number
        }],
        currency: {
            type: String,
            default: 'USD'
        }
    },
    // Terms offered by vendor
    terms: {
        paymentTerms: String,
        warranty: String,
        deliveryTime: String,
        otherTerms: String
    },
    // AI-generated evaluation
    aiScore: {
        type: Number,
        min: 0,
        max: 100
    },
    aiSummary: {
        type: String
    },
    receivedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Proposal', proposalSchema);
