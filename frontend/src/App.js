import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import CreateRFP from './pages/CreateRFP';
import RFPDetails from './pages/RFPDetails';
import VendorManagement from './pages/VendorManagement';
import ProposalComparison from './pages/ProposalComparison';
import './App.css';

function App() {
    return (
        <Router>
            <div className="App">
                {/* Navigation Header */}
                <header className="app-header">
                    <div className="container">
                        <h1 className="app-title">🎯 RFP Management System</h1>
                        <nav className="app-nav">
                            <Link to="/" className="nav-link">Dashboard</Link>
                            <Link to="/create-rfp" className="nav-link">Create RFP</Link>
                            <Link to="/vendors" className="nav-link">Vendors</Link>
                        </nav>
                    </div>
                </header>

                {/* Main Content */}
                <main className="app-main">
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/create-rfp" element={<CreateRFP />} />
                        <Route path="/rfp/:id" element={<RFPDetails />} />
                        <Route path="/vendors" element={<VendorManagement />} />
                        <Route path="/rfp/:id/compare" element={<ProposalComparison />} />
                    </Routes>
                </main>

                {/* Footer */}
                <footer className="app-footer">
                    <div className="container">
                        <p>AI-Powered RFP Management System - Streamline Your Procurement Process</p>
                    </div>
                </footer>
            </div>
        </Router>
    );
}

export default App;
