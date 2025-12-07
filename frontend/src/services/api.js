import axios from 'axios';

// Base URL for API - uses environment variable in production, proxy in development
const API_URL = process.env.REACT_APP_API_URL || '/api';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// RFP API calls
export const rfpAPI = {
    // Create RFP from natural language
    createRFP: async (description) => {
        const response = await api.post('/rfps/create', { description });
        return response.data;
    },

    // Get all RFPs
    getAllRFPs: async () => {
        const response = await api.get('/rfps');
        return response.data;
    },

    // Get single RFP
    getRFP: async (id) => {
        const response = await api.get(`/rfps/${id}`);
        return response.data;
    },

    // Send RFP to vendors
    sendRFP: async (id, vendorIds) => {
        const response = await api.post(`/rfps/${id}/send`, { vendorIds });
        return response.data;
    },

    // Update RFP
    updateRFP: async (id, data) => {
        const response = await api.put(`/rfps/${id}`, data);
        return response.data;
    }
};

// Vendor API calls
export const vendorAPI = {
    // Create vendor
    createVendor: async (vendorData) => {
        const response = await api.post('/vendors', vendorData);
        return response.data;
    },

    // Get all vendors
    getAllVendors: async () => {
        const response = await api.get('/vendors');
        return response.data;
    },

    // Get single vendor
    getVendor: async (id) => {
        const response = await api.get(`/vendors/${id}`);
        return response.data;
    },

    // Update vendor
    updateVendor: async (id, vendorData) => {
        const response = await api.put(`/vendors/${id}`, vendorData);
        return response.data;
    },

    // Delete vendor
    deleteVendor: async (id) => {
        const response = await api.delete(`/vendors/${id}`);
        return response.data;
    }
};

// Proposal API calls
export const proposalAPI = {
    // Get proposals for an RFP
    getProposals: async (rfpId) => {
        const response = await api.get(`/proposals/rfp/${rfpId}`);
        return response.data;
    },

    // Check for new emails
    checkEmails: async () => {
        const response = await api.post('/proposals/check-emails');
        return response.data;
    },

    // Get AI comparison
    compareProposals: async (rfpId) => {
        const response = await api.get(`/proposals/${rfpId}/compare`);
        return response.data;
    },

    // Get single proposal
    getProposal: async (id) => {
        const response = await api.get(`/proposals/${id}`);
        return response.data;
    }
};

export default api;
