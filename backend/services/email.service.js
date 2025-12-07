const nodemailer = require('nodemailer');
const Imap = require('imap');
const { simpleParser } = require('mailparser');
const aiService = require('./ai.service');
const Proposal = require('../models/Proposal');
const Vendor = require('../models/Vendor');

/**
 * Create email transporter for sending emails
 */
function createTransporter() {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });
}

/**
 * Send RFP to selected vendors via email
 * @param {Object} rfp - RFP object
 * @param {Array} vendors - Array of vendor objects
 * @returns {Object} Result with success status and counts
 */
async function sendRFPEmail(rfp, vendors) {
    try {
        const transporter = createTransporter();

        // Format RFP as readable email
        const emailBody = `
Dear Vendor,

We are pleased to invite you to submit a proposal for the following procurement:

=== RFP: ${rfp.title} ===

DESCRIPTION:
${rfp.description}

ITEMS REQUIRED:
${rfp.items.map(item => `- ${item.quantity}x ${item.name} (${item.specifications || 'See description'})`).join('\n')}

BUDGET: $${rfp.budget}
DEADLINE: ${new Date(rfp.deadline).toLocaleDateString()}

TERMS:
- Payment Terms: ${rfp.terms.paymentTerms || 'To be discussed'}
- Warranty Required: ${rfp.terms.warranty || 'To be discussed'}
- Delivery Terms: ${rfp.terms.deliveryTerms || 'To be discussed'}
${rfp.terms.otherTerms ? `- Additional Terms: ${rfp.terms.otherTerms}` : ''}

Please reply to this email with your proposal including:
1. Detailed pricing for each item
2. Your payment terms
3. Warranty offered
4. Delivery timeline
5. Any other relevant information

To help us process your response, please include "RFP-${rfp._id}" in your reply subject line.

Thank you for your interest.

Best regards,
Procurement Team
    `.trim();

        let sent = 0;
        let failed = 0;

        // Send to each vendor
        for (const vendor of vendors) {
            try {
                await transporter.sendMail({
                    from: `"RFP System" <${process.env.EMAIL_USER}>`,
                    to: vendor.email,
                    subject: `RFP: ${rfp.title} - Request for Proposal`,
                    text: emailBody
                });
                sent++;
                console.log(`Email sent to ${vendor.email}`);
            } catch (error) {
                console.error(`Failed to send to ${vendor.email}:`, error.message);
                failed++;
            }
        }

        return {
            success: true,
            sent,
            failed,
            message: `Sent to ${sent} vendors${failed > 0 ? `, ${failed} failed` : ''}`
        };
    } catch (error) {
        console.error('Email sending error:', error);
        throw new Error('Failed to send RFP emails');
    }
}

/**
 * Check for incoming vendor response emails and parse them
 * This function connects to IMAP and processes new emails
 * @returns {Object} Result with processed emails count
 */
async function checkIncomingEmails() {
    return new Promise((resolve, reject) => {
        try {
            // Create IMAP connection
            const imap = new Imap({
                user: process.env.EMAIL_USER,
                password: process.env.EMAIL_PASSWORD,
                host: process.env.IMAP_HOST,
                port: process.env.IMAP_PORT,
                tls: true,
                tlsOptions: { rejectUnauthorized: false }
            });

            let processedCount = 0;

            imap.once('ready', function () {
                imap.openBox('INBOX', false, function (err, box) {
                    if (err) {
                        reject(err);
                        return;
                    }

                    // Search for unseen emails with RFP in subject
                    imap.search(['UNSEEN', ['SUBJECT', 'RFP']], function (err, results) {
                        if (err) {
                            reject(err);
                            return;
                        }

                        if (!results || results.length === 0) {
                            console.log('No new RFP emails found');
                            imap.end();
                            resolve({ success: true, processed: 0, message: 'No new emails' });
                            return;
                        }

                        console.log(`Found ${results.length} new RFP emails`);

                        const fetch = imap.fetch(results, { bodies: '' });

                        fetch.on('message', function (msg, seqno) {
                            msg.on('body', function (stream, info) {
                                simpleParser(stream, async (err, parsed) => {
                                    if (err) {
                                        console.error('Email parsing error:', err);
                                        return;
                                    }

                                    try {
                                        // Extract RFP ID from subject
                                        const subjectMatch = parsed.subject.match(/RFP-([a-f0-9]+)/i);
                                        if (!subjectMatch) {
                                            console.log('Email does not contain RFP ID, skipping');
                                            return;
                                        }

                                        const rfpId = subjectMatch[1];

                                        // Find vendor by email
                                        const vendor = await Vendor.findOne({
                                            email: parsed.from.value[0].address.toLowerCase()
                                        });

                                        if (!vendor) {
                                            console.log(`Unknown vendor email: ${parsed.from.value[0].address}`);
                                            return;
                                        }

                                        // Parse email content with AI
                                        const parsedData = await aiService.parseVendorResponse(parsed.text);

                                        // Check if proposal already exists
                                        const existingProposal = await Proposal.findOne({
                                            rfpId,
                                            vendorId: vendor._id
                                        });

                                        if (existingProposal) {
                                            console.log('Proposal already exists, skipping');
                                            return;
                                        }

                                        // Create new proposal
                                        const proposal = new Proposal({
                                            rfpId,
                                            vendorId: vendor._id,
                                            rawEmail: parsed.text,
                                            parsedData,
                                            pricing: parsedData.pricing || {},
                                            terms: parsedData.terms || {}
                                        });

                                        await proposal.save();
                                        processedCount++;
                                        console.log(`Processed proposal from ${vendor.name}`);

                                    } catch (error) {
                                        console.error('Error processing email:', error);
                                    }
                                });
                            });
                        });

                        fetch.once('error', function (err) {
                            console.error('Fetch error:', err);
                            reject(err);
                        });

                        fetch.once('end', function () {
                            console.log('Done fetching messages');
                            imap.end();
                        });
                    });
                });
            });

            imap.once('error', function (err) {
                console.error('IMAP error:', err);
                reject(err);
            });

            imap.once('end', function () {
                console.log('IMAP connection ended');
                resolve({
                    success: true,
                    processed: processedCount,
                    message: `Processed ${processedCount} new proposals`
                });
            });

            imap.connect();

        } catch (error) {
            reject(error);
        }
    });
}

module.exports = {
    sendRFPEmail,
    checkIncomingEmails
};
