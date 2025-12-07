import React, { useState, useEffect } from 'react';
import { vendorAPI } from '../services/api';

/**
 * Vendor Management Page
 * CRUD operations for vendors
 */
function VendorManagement() {
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        company: '',
        address: ''
    });
    const [editingId, setEditingId] = useState(null);

    // Load vendors on mount
    useEffect(() => {
        loadVendors();
    }, []);

    const loadVendors = async () => {
        try {
            setLoading(true);
            const data = await vendorAPI.getAllVendors();
            setVendors(data.vendors || []);
            setError('');
        } catch (err) {
            setError('Failed to load vendors');
            console.error('Error loading vendors:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (editingId) {
                await vendorAPI.updateVendor(editingId, formData);
                setSuccess('Vendor updated successfully!');
            } else {
                await vendorAPI.createVendor(formData);
                setSuccess('Vendor created successfully!');
            }

            // Reset form
            setFormData({ name: '', email: '', phone: '', company: '', address: '' });
            setShowForm(false);
            setEditingId(null);
            loadVendors();

            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save vendor');
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleEdit = (vendor) => {
        setFormData({
            name: vendor.name,
            email: vendor.email,
            phone: vendor.phone || '',
            company: vendor.company,
            address: vendor.address || ''
        });
        setEditingId(vendor._id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this vendor?')) {
            return;
        }

        try {
            await vendorAPI.deleteVendor(id);
            setSuccess('Vendor deleted successfully!');
            loadVendors();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Failed to delete vendor');
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleCancel = () => {
        setFormData({ name: '', email: '', phone: '', company: '', address: '' });
        setShowForm(false);
        setEditingId(null);
    };

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
                Loading vendors...
            </div>
        );
    }

    return (
        <div className="page-container">
            <h1 className="page-title">👥 Vendor Management</h1>
            <p className="page-subtitle">Manage your vendor database</p>

            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <div className="card">
                <div className="flex-between mb-3">
                    <h2 className="card-title" style={{ marginBottom: 0 }}>
                        Vendors ({vendors.length})
                    </h2>
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowForm(!showForm)}
                    >
                        {showForm ? '❌ Cancel' : '➕ Add Vendor'}
                    </button>
                </div>

                {/* Add/Edit Form */}
                {showForm && (
                    <form onSubmit={handleSubmit} className="mb-3" style={{
                        background: '#f8f9fa',
                        padding: '1.5rem',
                        borderRadius: '8px',
                        marginBottom: '2rem'
                    }}>
                        <h3 style={{ marginBottom: '1rem' }}>
                            {editingId ? 'Edit Vendor' : 'Add New Vendor'}
                        </h3>

                        <div className="grid grid-2">
                            <div className="form-group">
                                <label className="form-label">Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    className="form-input"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Email *</label>
                                <input
                                    type="email"
                                    name="email"
                                    className="form-input"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Phone</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    className="form-input"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Company *</label>
                                <input
                                    type="text"
                                    name="company"
                                    className="form-input"
                                    value={formData.company}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Address</label>
                            <input
                                type="text"
                                name="address"
                                className="form-input"
                                value={formData.address}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="flex gap-2">
                            <button type="submit" className="btn btn-success">
                                {editingId ? '💾 Update Vendor' : '➕ Create Vendor'}
                            </button>
                            <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                                Cancel
                            </button>
                        </div>
                    </form>
                )}

                {/* Vendors Table */}
                {vendors.length === 0 ? (
                    <div className="text-center" style={{ padding: '3rem' }}>
                        <p style={{ fontSize: '1.2rem', color: '#999' }}>
                            No vendors yet. Add your first vendor to start sending RFPs!
                        </p>
                    </div>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Company</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vendors.map((vendor) => (
                                <tr key={vendor._id}>
                                    <td><strong>{vendor.name}</strong></td>
                                    <td>{vendor.company}</td>
                                    <td>{vendor.email}</td>
                                    <td>{vendor.phone || 'N/A'}</td>
                                    <td>
                                        <div className="flex gap-1">
                                            <button
                                                className="btn btn-secondary"
                                                style={{ padding: '0.4rem 0.8rem' }}
                                                onClick={() => handleEdit(vendor)}
                                            >
                                                ✏️ Edit
                                            </button>
                                            <button
                                                className="btn btn-danger"
                                                style={{ padding: '0.4rem 0.8rem' }}
                                                onClick={() => handleDelete(vendor._id)}
                                            >
                                                🗑️ Delete
                                            </button>
                                        </div>
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

export default VendorManagement;
