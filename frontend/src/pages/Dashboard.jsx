import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { rfpAPI } from '../services/api';

/**
 * Dashboard Page
 * Shows list of all RFPs with their status
 */
function Dashboard() {
    const [rfps, setRfps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Load RFPs on component mount
    useEffect(() => {
        loadRFPs();
    }, []);

    const loadRFPs = async () => {
        try {
            setLoading(true);
            const data = await rfpAPI.getAllRFPs();
            setRfps(data.rfps || []);
            setError('');
        } catch (err) {
            setError('Failed to load RFPs. Please try again.');
            console.error('Error loading RFPs:', err);
        } finally {
            setLoading(false);
        }
    };

    // Format date for display
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Get badge class based on status
    const getStatusBadge = (status) => {
        const badges = {
            draft: 'badge-draft',
            sent: 'badge-sent',
            closed: 'badge-closed'
        };
        return `badge ${badges[status] || 'badge-draft'}`;
    };

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
                Loading RFPs...
            </div>
        );
    }

    return (
        <div className="page-container">
            <h1 className="page-title">📊 RFP Dashboard</h1>
            <p className="page-subtitle">Manage all your Requests for Proposals in one place</p>

            {error && (
                <div className="alert alert-error">
                    {error}
                </div>
            )}

            <div className="card">
                <div className="flex-between mb-3">
                    <h2 className="card-title" style={{ marginBottom: 0 }}>All RFPs ({rfps.length})</h2>
                    <Link to="/create-rfp" className="btn btn-primary">
                        ✨ Create New RFP
                    </Link>
                </div>

                {rfps.length === 0 ? (
                    <div className="text-center" style={{ padding: '3rem' }}>
                        <p style={{ fontSize: '1.2rem', color: '#999' }}>
                            No RFPs yet. Create your first RFP to get started!
                        </p>
                        <Link to="/create-rfp" className="btn btn-primary mt-2">
                            Create RFP
                        </Link>
                    </div>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Budget</th>
                                <th>Deadline</th>
                                <th>Vendors</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rfps.map((rfp) => (
                                <tr key={rfp._id}>
                                    <td>
                                        <strong>{rfp.title}</strong>
                                    </td>
                                    <td>${rfp.budget.toLocaleString()}</td>
                                    <td>{formatDate(rfp.deadline)}</td>
                                    <td>{rfp.vendors?.length || 0} vendors</td>
                                    <td>
                                        <span className={getStatusBadge(rfp.status)}>
                                            {rfp.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td>
                                        <Link to={`/rfp/${rfp._id}`} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
                                            View Details
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

export default Dashboard;
