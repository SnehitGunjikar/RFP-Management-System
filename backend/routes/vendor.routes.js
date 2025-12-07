const express = require('express');
const router = express.Router();
const Vendor = require('../models/Vendor');

/**
 * @route   POST /api/vendors
 * @desc    Create a new vendor
 * @access  Public
 */
router.post('/', async (req, res) => {
    try {
        const { name, email, phone, company, address } = req.body;

        // Validate required fields
        if (!name || !email || !company) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and company are required'
            });
        }

        // Check if vendor with this email already exists
        const existingVendor = await Vendor.findOne({ email: email.toLowerCase() });
        if (existingVendor) {
            return res.status(400).json({
                success: false,
                message: 'Vendor with this email already exists'
            });
        }

        const vendor = new Vendor({
            name,
            email,
            phone,
            company,
            address
        });

        await vendor.save();

        res.status(201).json({
            success: true,
            vendor
        });
    } catch (error) {
        console.error('Error creating vendor:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while creating vendor'
        });
    }
});

/**
 * @route   GET /api/vendors
 * @desc    Get all vendors
 * @access  Public
 */
router.get('/', async (req, res) => {
    try {
        const vendors = await Vendor.find().sort({ createdAt: -1 });
        res.json({
            success: true,
            count: vendors.length,
            vendors
        });
    } catch (error) {
        console.error('Error fetching vendors:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching vendors'
        });
    }
});

/**
 * @route   GET /api/vendors/:id
 * @desc    Get single vendor by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
    try {
        const vendor = await Vendor.findById(req.params.id);

        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found'
            });
        }

        res.json({
            success: true,
            vendor
        });
    } catch (error) {
        console.error('Error fetching vendor:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching vendor'
        });
    }
});

/**
 * @route   PUT /api/vendors/:id
 * @desc    Update vendor
 * @access  Public
 */
router.put('/:id', async (req, res) => {
    try {
        const { name, email, phone, company, address } = req.body;

        const vendor = await Vendor.findById(req.params.id);

        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found'
            });
        }

        // Update fields if provided
        if (name) vendor.name = name;
        if (email) vendor.email = email;
        if (phone) vendor.phone = phone;
        if (company) vendor.company = company;
        if (address !== undefined) vendor.address = address;

        await vendor.save();

        res.json({
            success: true,
            vendor
        });
    } catch (error) {
        console.error('Error updating vendor:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating vendor'
        });
    }
});

/**
 * @route   DELETE /api/vendors/:id
 * @desc    Delete vendor
 * @access  Public
 */
router.delete('/:id', async (req, res) => {
    try {
        const vendor = await Vendor.findById(req.params.id);

        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found'
            });
        }

        await vendor.deleteOne();

        res.json({
            success: true,
            message: 'Vendor deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting vendor:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting vendor'
        });
    }
});

module.exports = router;
