import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { rfpAPI, proposalAPI } from '../services/api';

/**
 * Proposal Comparison Page
 * AI-powered comparison of vendor proposals
 */
function ProposalComparison() {
    const { id } = useParams();
    const [rfp, setRfp] = useState(null);
    const [proposals, setProposals] = useState([]);
    const [comparison, setComparison] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadComparison();
    }, [id]);

    const loadComparison = async () => {
        try {
            setLoading(true);

            // Load RFP details
            const rfpData = await rfpAPI.getRFP(id);
            setRfp(rfpData.rfp);

            // Get AI comparison
            const comparisonData = await proposalAPI.compareProposals(id);
            setProposals(comparisonData.proposals || []);
            setComparison(comparisonData.comparison);

            setError('');
        } catch (err) {
            setError('Failed to load comparison. ' + (err.response?.data?.message || ''));
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getScoreColor = (score) => {
        if (score >= 80) return '#28a745';
        if (score >= 60) return '#ffc107';
        return '#dc3545';
    };

    const getRecommendedProposal = () => {
        if (!comparison?.recommendation?.vendorIndex) return null;
        return proposals[comparison.recommendation.vendorIndex - 1];
    };

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
                AI is analyzing proposals...
            </div>
        );
    }

    if (error) {
        return (
            <div className="page-container">
                <div className="alert alert-error">{error}</div>
                <Link to={`/rfp/${id}`} className="btn btn-secondary mt-2">
                    ← Back to RFP
                </Link>
            </div>
        );
    }

    const recommendedProposal = getRecommendedProposal();

    return (
        <div className="page-container">
            <h1 className="page-title">🤖 AI-Powered Proposal Comparison</h1>
            {rfp && (
                <p className="page-subtitle">
                    Comparing {proposals.length} proposals for "{rfp.title}"
                </p>
            )}

            {/* AI Recommendation */}
            {comparison?.recommendation && recommendedProposal && (
                <div className="card" style={{
                    background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                    color: 'white'
                }}>
                    <h2 style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>
                        ✨ AI Recommendation
                    </h2>
                    <div style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>
                        <strong>Recommended Vendor:</strong> {recommendedProposal.vendorId?.name}
                    </div>
                    <div style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                        <strong>Company:</strong> {recommendedProposal.vendorId?.company}
                    </div>
                    {recommendedProposal.pricing?.totalPrice && (
                        <div style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
                            <strong>Price:</strong> ${recommendedProposal.pricing.totalPrice.toLocaleString()}
                        </div>
                    )}
                    <div style={{
                        background: 'rgba(255,255,255,0.2)',
                        padding: '1rem',
                        borderRadius: '8px',
                        marginTop: '1rem'
                    }}>
                        <strong>Why this vendor?</strong>
                        <p style={{ marginTop: '0.5rem', lineHeight: '1.6' }}>
                            {comparison.recommendation.reasoning}
                        </p>
                    </div>
                </div>
            )}

            {/* Comparison Table */}
            <div className="card">
                <h2 className="card-title">📊 Detailed Comparison</h2>

                <div style={{ overflowX: 'auto' }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Vendor</th>
                                <th>AI Score</th>
                                <th>Price</th>
                                <th>Payment Terms</th>
                                <th>Warranty</th>
                                <th>Delivery</th>
                                <th>Received</th>
                            </tr>
                        </thead>
                        <tbody>
                            {proposals.map((proposal, index) => {
                                const isRecommended = recommendedProposal &&
                                    proposal._id === recommendedProposal._id;

                                return (
                                    <tr
                                        key={proposal._id}
                                        style={{
                                            background: isRecommended ? '#e7f3ff' : 'white',
                                            fontWeight: isRecommended ? '600' : 'normal'
                                        }}
                                    >
                                        <td>
                                            {proposal.vendorId?.name}
                                            {isRecommended && <span style={{ marginLeft: '0.5rem' }}>⭐</span>}
                                            <div style={{ fontSize: '0.85rem', color: '#666', fontWeight: 'normal' }}>
                                                {proposal.vendorId?.company}
                                            </div>
                                        </td>
                                        <td>
                                            {proposal.aiScore ? (
                                                <div style={{
                                                    display: 'inline-block',
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '12px',
                                                    background: getScoreColor(proposal.aiScore),
                                                    color: 'white',
                                                    fontWeight: 'bold'
                                                }}>
                                                    {proposal.aiScore}/100
                                                </div>
                                            ) : (
                                                'N/A'
                                            )}
                                        </td>
                                        <td>
                                            {proposal.pricing?.totalPrice ? (
                                                <span style={{ color: '#28a745', fontWeight: '600' }}>
                                                    ${proposal.pricing.totalPrice.toLocaleString()}
                                                </span>
                                            ) : (
                                                'Not specified'
                                            )}
                                        </td>
                                        <td>{proposal.terms?.paymentTerms || 'Not specified'}</td>
                                        <td>{proposal.terms?.warranty || 'Not specified'}</td>
                                        <td>{proposal.terms?.deliveryTime || 'Not specified'}</td>
                                        <td style={{ fontSize: '0.85rem', color: '#666' }}>
                                            {formatDate(proposal.receivedAt)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* AI Summaries */}
            {comparison?.summaries && (
                <div className="card">
                    <h2 className="card-title">📝 AI-Generated Summaries</h2>

                    <div className="grid grid-2">
                        {proposals.map((proposal, index) => (
                            <div
                                key={proposal._id}
                                style={{
                                    border: '2px solid #e0e0e0',
                                    borderRadius: '8px',
                                    padding: '1.5rem',
                                    background: proposal._id === recommendedProposal?._id ? '#e7f3ff' : 'white'
                                }}
                            >
                                <div className="flex-between mb-2">
                                    <h3 style={{ color: '#667eea', marginBottom: 0 }}>
                                        {proposal.vendorId?.name}
                                    </h3>
                                    {proposal.aiScore && (
                                        <div style={{
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '12px',
                                            background: getScoreColor(proposal.aiScore),
                                            color: 'white',
                                            fontSize: '0.9rem',
                                            fontWeight: 'bold'
                                        }}>
                                            {proposal.aiScore}
                                        </div>
                                    )}
                                </div>

                                <p style={{ color: '#555', lineHeight: '1.6', marginTop: '1rem' }}>
                                    {comparison.summaries[index] || proposal.aiSummary || 'No summary available'}
                                </p>

                                {proposal._id === recommendedProposal?._id && (
                                    <div style={{
                                        marginTop: '1rem',
                                        padding: '0.5rem',
                                        background: '#28a745',
                                        color: 'white',
                                        borderRadius: '6px',
                                        textAlign: 'center',
                                        fontWeight: '600'
                                    }}>
                                        ⭐ Recommended Choice
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Budget Analysis */}
            {rfp && (
                <div className="card">
                    <h2 className="card-title">💰 Budget Analysis</h2>

                    <div style={{ marginBottom: '1rem' }}>
                        <strong>RFP Budget:</strong> ${rfp.budget.toLocaleString()}
                    </div>

                    {proposals.map(proposal => {
                        if (!proposal.pricing?.totalPrice) return null;

                        const difference = rfp.budget - proposal.pricing.totalPrice;
                        const percentage = ((proposal.pricing.totalPrice / rfp.budget) * 100).toFixed(1);

                        return (
                            <div key={proposal._id} style={{ marginBottom: '1rem' }}>
                                <div style={{ marginBottom: '0.5rem' }}>
                                    <strong>{proposal.vendorId?.name}:</strong> ${proposal.pricing.totalPrice.toLocaleString()}
                                    <span style={{
                                        marginLeft: '1rem',
                                        color: difference >= 0 ? '#28a745' : '#dc3545'
                                    }}>
                                        ({difference >= 0 ? '-' : '+'} ${Math.abs(difference).toLocaleString()})
                                    </span>
                                </div>
                                <div style={{
                                    height: '24px',
                                    background: '#e0e0e0',
                                    borderRadius: '12px',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        height: '100%',
                                        width: `${Math.min(100, percentage)}%`,
                                        background: difference >= 0 ? '#28a745' : '#dc3545',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontSize: '0.85rem',
                                        fontWeight: '600'
                                    }}>
                                        {percentage}% of budget
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="text-center mt-3">
                <Link to={`/rfp/${id}`} className="btn btn-secondary">
                    ← Back to RFP Details
                </Link>
            </div>
        </div>
    );
}

export default ProposalComparison;
