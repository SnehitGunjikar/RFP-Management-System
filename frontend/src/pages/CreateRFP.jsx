import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { rfpAPI } from '../services/api';

/**
 * Create RFP Page
 * Allows user to create RFP from natural language description
 */
function CreateRFP() {
    const navigate = useNavigate();
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [structuredRFP, setStructuredRFP] = useState(null);

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!description.trim()) {
            setError('Please enter a description for your RFP');
            return;
        }

        try {
            setLoading(true);
            setError('');

            // Call API to create RFP with AI parsing
            const data = await rfpAPI.createRFP(description);

            setStructuredRFP(data.rfp);

            // Show success and redirect after a moment
            setTimeout(() => {
                navigate(`/rfp/${data.rfp._id}`);
            }, 2000);

        } catch (err) {
            setError('Failed to create RFP. Please try again.');
            console.error('Error creating RFP:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <h1 className="page-title">✨ Create New RFP</h1>
            <p className="page-subtitle">Describe what you need in natural language, and AI will structure it for you</p>

            <div className="card">
                <h2 className="card-title">Describe Your Procurement Needs</h2>

                {error && (
                    <div className="alert alert-error">
                        {error}
                    </div>
                )}

                {!structuredRFP ? (
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">
                                What do you need to procure?
                                <span style={{ color: '#999', fontWeight: 'normal', marginLeft: '0.5rem' }}>
                                    (Include items, quantities, budget, deadline, and any special requirements)
                                </span>
                            </label>
                            <textarea
                                className="form-textarea"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Example: I need to procure laptops and monitors for our new office. Budget is $50,000 total. Need delivery within 30 days. We need 20 laptops with 16GB RAM and 15 monitors 27-inch. Payment terms should be net 30, and we need at least 1 year warranty."
                                rows="8"
                                disabled={loading}
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-block"
                            disabled={loading}
                        >
                            {loading ? '🤖 AI is processing...' : '🚀 Generate RFP with AI'}
                        </button>
                    </form>
                ) : (
                    <div className="alert alert-success">
                        <h3 style={{ marginBottom: '1rem' }}>✅ RFP Created Successfully!</h3>
                        <p><strong>Title:</strong> {structuredRFP.title}</p>
                        <p><strong>Budget:</strong> ${structuredRFP.budget.toLocaleString()}</p>
                        <p><strong>Items:</strong> {structuredRFP.items.length} items identified</p>
                        <p style={{ marginTop: '1rem' }}>Redirecting to RFP details...</p>
                    </div>
                )}
            </div>

            {/* Example Section */}
            <div className="card mt-3">
                <h3 className="card-title">💡 Tips for Best Results</h3>
                <ul style={{ lineHeight: '1.8', color: '#555' }}>
                    <li>Include specific items and quantities you need</li>
                    <li>Mention your total budget or budget range</li>
                    <li>Specify deadline or delivery timeframe</li>
                    <li>Add any technical specifications or requirements</li>
                    <li>Include payment terms and warranty requirements</li>
                </ul>
            </div>
        </div>
    );
}

export default CreateRFP;
