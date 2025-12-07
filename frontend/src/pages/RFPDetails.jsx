import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { rfpAPI, vendorAPI, proposalAPI } from '../services/api';

/**
 * RFP Details Page
 * Shows RFP details, allows sending to vendors, and displays proposals
 */
function RFPDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [rfp, setRfp] = useState(null);
    const [vendors, setVendors] = useState([]);
    const [selectedVendors, setSelectedVendors] = useState([]);
    const [proposals, setProposals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [checking, setChecking] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            setLoading(true);

            // Load RFP details
            const rfpData = await rfpAPI.getRFP(id);
            setRfp(rfpData.rfp);

            // Load all vendors
            const vendorsData = await vendorAPI.getAllVendors();
            setVendors(vendorsData.vendors || []);

            // Load proposals
            const proposalsData = await proposalAPI.getProposals(id);
            setProposals(proposalsData.proposals || []);

            setError('');
        } catch (err) {
            setError('Failed to load data');
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleVendorToggle = (vendorId) => {
        setSelectedVendors(prev => {
            if (prev.includes(vendorId)) {
                return prev.filter(id => id !== vendorId);
            } else {
                return [...prev, vendorId];
            }
        });
    };

    const handleSendRFP = async () => {
        if (selectedVendors.length === 0) {
            setError('Please select at least one vendor');
            setTimeout(() => setError(''), 3000);
            return;
        }

        try {
            setSending(true);
            await rfpAPI.sendRFP(id, selectedVendors);
            setSuccess(`RFP sent to ${selectedVendors.length} vendors successfully!`);
            setSelectedVendors([]);
            loadData();
            setTimeout(() => setSuccess(''), 5000);
        } catch (err) {
            setError('Failed to send RFP');
            setTimeout(() => setError(''), 3000);
        } finally {
            setSending(false);
        }
    };

    const handleCheckEmails = async () => {
        try {
            setChecking(true);
            const result = await proposalAPI.checkEmails();
            setSuccess(result.message || 'Email check complete');
            loadData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Failed to check emails');
            setTimeout(() => setError(''), 3000);
        } finally {
            setChecking(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
                Loading RFP details...
            </div>
        );
    }

    if (!rfp) {
        return (
            <div className="page-container">
                <div className="alert alert-error">RFP not found</div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <h1 className="page-title">📄 RFP Details</h1>

            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {/* RFP Information */}
            <div className="card">
                <div className="flex-between">
                    <h2 className="card-title">{rfp.title}</h2>
                    <span className={`badge badge-${rfp.status}`}>
                        {rfp.status.toUpperCase()}
                    </span>
                </div>

                <div className="grid grid-2 mt-2">
                    <div>
                        <p><strong>Budget:</strong> ${rfp.budget.toLocaleString()}</p>
                        <p><strong>Deadline:</strong> {formatDate(rfp.deadline)}</p>
                        <p><strong>Created:</strong> {formatDate(rfp.createdAt)}</p>
                    </div>
                    <div>
                        <p><strong>Vendors Sent To:</strong> {rfp.vendors?.length || 0}</p>
                        <p><strong>Proposals Received:</strong> {proposals.length}</p>
                    </div>
                </div>

                <div className="mt-3">
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Description:</h3>
                    <p style={{ color: '#555', lineHeight: '1.6' }}>{rfp.description}</p>
                </div>

                <div className="mt-3">
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Items Required:</h3>
                    {rfp.items && rfp.items.length > 0 ? (
                        <ul style={{ color: '#555', lineHeight: '1.8' }}>
                            {rfp.items.map((item, index) => (
                                <li key={index}>
                                    <strong>{item.quantity}x {item.name}</strong>
                                    {item.specifications && ` - ${item.specifications}`}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p style={{ color: '#999' }}>No items specified</p>
                    )}
                </div>

                {rfp.terms && (
                    <div className="mt-3">
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Terms & Conditions:</h3>
                        <div style={{ color: '#555', lineHeight: '1.6' }}>
                            {rfp.terms.paymentTerms && <p><strong>Payment:</strong> {rfp.terms.paymentTerms}</p>}
                            {rfp.terms.warranty && <p><strong>Warranty:</strong> {rfp.terms.warranty}</p>}
                            {rfp.terms.deliveryTerms && <p><strong>Delivery:</strong> {rfp.terms.deliveryTerms}</p>}
                            {rfp.terms.otherTerms && <p><strong>Other:</strong> {rfp.terms.otherTerms}</p>}
                        </div>
                    </div>
                )}
            </div>

            {/* Send to Vendors */}
            {vendors.length > 0 && (
                <div className="card">
                    <h2 className="card-title">📧 Send RFP to Vendors</h2>

                    <p style={{ color: '#555', marginBottom: '1rem' }}>
                        Select vendors to send this RFP via email:
                    </p>

                    <div className="grid grid-3">
                        {vendors.map(vendor => (
                            <label
                                key={vendor._id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '0.75rem',
                                    border: '2px solid #e0e0e0',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    background: selectedVendors.includes(vendor._id) ? '#e7f3ff' : 'white',
                                    borderColor: selectedVendors.includes(vendor._id) ? '#667eea' : '#e0e0e0'
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedVendors.includes(vendor._id)}
                                    onChange={() => handleVendorToggle(vendor._id)}
                                    style={{ marginRight: '0.5rem' }}
                                />
                                <div>
                                    <div style={{ fontWeight: '600' }}>{vendor.name}</div>
                                    <div style={{ fontSize: '0.85rem', color: '#666' }}>{vendor.company}</div>
                                </div>
                            </label>
                        ))}
                    </div>

                    <button
                        className="btn btn-success btn-block mt-3"
                        onClick={handleSendRFP}
                        disabled={sending || selectedVendors.length === 0}
                    >
                        {sending ? '📤 Sending...' : `📧 Send to ${selectedVendors.length} Selected Vendor(s)`}
                    </button>
                </div>
            )}

            {/* Proposals Section */}
            <div className="card">
                <div className="flex-between mb-2">
                    <h2 className="card-title" style={{ marginBottom: 0 }}>
                        📨 Vendor Proposals ({proposals.length})
                    </h2>
                    <div className="flex gap-2">
                        <button
                            className="btn btn-secondary"
                            onClick={handleCheckEmails}
                            disabled={checking}
                        >
                            {checking ? '🔄 Checking...' : '🔄 Check for New Proposals'}
                        </button>
                        {proposals.length > 0 && (
                            <Link to={`/rfp/${id}/compare`} className="btn btn-primary">
                                🤖 Compare with AI
                            </Link>
                        )}
                    </div>
                </div>

                {proposals.length === 0 ? (
                    <div className="text-center" style={{ padding: '2rem', color: '#999' }}>
                        <p>No proposals received yet.</p>
                        <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                            Click "Check for New Proposals" to scan your inbox for vendor responses.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-2 mt-2">
                        {proposals.map(proposal => (
                            <div
                                key={proposal._id}
                                style={{
                                    border: '2px solid #e0e0e0',
                                    borderRadius: '8px',
                                    padding: '1.5rem',
                                    background: 'white'
                                }}
                            >
                                <h3 style={{ marginBottom: '1rem', color: '#667eea' }}>
                                    {proposal.vendorId?.name || 'Unknown Vendor'}
                                </h3>

                                {proposal.pricing?.totalPrice && (
                                    <p style={{ fontSize: '1.3rem', fontWeight: '600', color: '#28a745' }}>
                                        ${proposal.pricing.totalPrice.toLocaleString()}
                                    </p>
                                )}

                                <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
                                    {proposal.terms?.paymentTerms && (
                                        <p><strong>Payment:</strong> {proposal.terms.paymentTerms}</p>
                                    )}
                                    {proposal.terms?.warranty && (
                                        <p><strong>Warranty:</strong> {proposal.terms.warranty}</p>
                                    )}
                                    {proposal.terms?.deliveryTime && (
                                        <p><strong>Delivery:</strong> {proposal.terms.deliveryTime}</p>
                                    )}
                                </div>

                                <p style={{ fontSize: '0.85rem', color: '#999', marginTop: '1rem' }}>
                                    Received: {formatDate(proposal.receivedAt)}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="text-center mt-3">
                <Link to="/" className="btn btn-secondary">
                    ← Back to Dashboard
                </Link>
            </div>
        </div>
    );
}

export default RFPDetails;
