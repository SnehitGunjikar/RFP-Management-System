const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

/**
 * Parse natural language RFP description into structured data
 * @param {string} description - Natural language description of procurement needs
 * @returns {Object} Structured RFP data
 */
async function parseRFPFromNaturalLanguage(description) {
    try {
        console.log('Attempting to parse RFP with Gemini AI...');
        console.log('API Key present:', !!process.env.GEMINI_API_KEY);

        const prompt = `You are a procurement assistant. Parse the following natural language RFP request into structured JSON.

Extract:
- title: A concise title for this RFP
- items: Array of items to procure with { name, quantity, specifications }
- budget: Total budget as a number
- deadline: Delivery deadline (extract days and convert to future date)
- terms: { paymentTerms, warranty, deliveryTerms, otherTerms }

Input: "${description}"

Return ONLY valid JSON, no additional text or markdown formatting.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const content = response.text().trim();

        console.log('Gemini API Response received');

        // Remove markdown code blocks if present
        const jsonContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        const parsed = JSON.parse(jsonContent);

        return parsed;
    } catch (error) {
        console.error('AI parsing error details:', error.message);
        console.error('Error stack:', error.stack);

        // If Gemini API fails, return a fallback parsed structure
        console.log('Falling back to basic parsing...');
        return fallbackParse(description);
    }
}

/**
 * Fallback parser if AI fails
 */
function fallbackParse(description) {
    // Extract numbers for budget and quantities
    const budgetMatch = description.match(/\$?(\d+,?\d*)/);
    const budget = budgetMatch ? parseInt(budgetMatch[1].replace(',', '')) : 10000;

    const daysMatch = description.match(/(\d+)\s*days?/i);
    const days = daysMatch ? parseInt(daysMatch[1]) : 30;

    const deadline = new Date();
    deadline.setDate(deadline.getDate() + days);

    return {
        title: 'Procurement Request',
        items: [{
            name: 'Items as described',
            quantity: 1,
            specifications: description.substring(0, 100)
        }],
        budget: budget,
        deadline: deadline,
        terms: {
            paymentTerms: 'Net 30',
            warranty: '1 year',
            deliveryTerms: `${days} days`,
            otherTerms: 'As per description'
        }
    };
}

/**
 * Parse vendor email response into structured proposal data
 * @param {string} emailContent - Raw email body
 * @param {Array} attachments - Email attachments (optional)
 * @returns {Object} Structured proposal data
 */
async function parseVendorResponse(emailContent, attachments = []) {
    try {
        const prompt = `You are a procurement assistant. Parse the following vendor proposal email into structured JSON.

Extract:
- pricing: { totalPrice (number), itemPrices: [{ item, price, quantity }], currency }
- terms: { paymentTerms, warranty, deliveryTime, otherTerms }
- notes: Any additional important information

Email Content:
"${emailContent}"

Return ONLY valid JSON, no additional text or markdown formatting.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const content = response.text().trim();

        const jsonContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        const parsed = JSON.parse(jsonContent);

        return parsed;
    } catch (error) {
        console.error('AI parsing error:', error);
        throw new Error('Failed to parse vendor response with AI');
    }
}

/**
 * Compare multiple proposals and provide AI-assisted recommendation
 * @param {Object} rfp - The RFP object
 * @param {Array} proposals - Array of proposal objects
 * @returns {Object} Comparison results with scores and recommendation
 */
async function compareProposals(rfp, proposals) {
    try {
        // Prepare data for AI
        const proposalSummaries = proposals.map((p, index) => ({
            vendorIndex: index + 1,
            vendorId: p.vendorId,
            totalPrice: p.pricing?.totalPrice || 'Not provided',
            paymentTerms: p.terms?.paymentTerms || 'Not specified',
            warranty: p.terms?.warranty || 'Not specified',
            deliveryTime: p.terms?.deliveryTime || 'Not specified'
        }));

        const prompt = `You are a procurement expert. Compare the following vendor proposals for this RFP and provide a recommendation.

RFP Details:
- Budget: $${rfp.budget}
- Deadline: ${rfp.deadline}
- Items: ${rfp.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}

Proposals:
${JSON.stringify(proposalSummaries, null, 2)}

Provide:
1. scores: Array of scores (0-100) for each proposal based on price, terms, and completeness
2. summaries: Array of brief summaries for each proposal
3. recommendation: { vendorIndex (1-based), reasoning (why this vendor is recommended) }

Return ONLY valid JSON in this format:
{
  "scores": [85, 72, 90],
  "summaries": ["summary1", "summary2", "summary3"],
  "recommendation": { "vendorIndex": 3, "reasoning": "..." }
}

No additional text or markdown formatting.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const content = response.text().trim();

        const jsonContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        const comparison = JSON.parse(jsonContent);

        return comparison;
    } catch (error) {
        console.error('AI comparison error:', error);
        throw new Error('Failed to compare proposals with AI');
    }
}

module.exports = {
    parseRFPFromNaturalLanguage,
    parseVendorResponse,
    compareProposals
};
