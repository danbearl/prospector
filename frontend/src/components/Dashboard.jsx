import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCompanies, getContacts, getAllOutreach, getCampaigns } from '../api';
import LogOutreachModal from './LogOutreachModal';

function Dashboard() {
  const [stats, setStats] = useState({
    totalCompanies: 0,
    totalContacts: 0,
    totalOutreach: 0,
    totalCampaigns: 0,
    recentOutreach: []
  });
  const [loading, setLoading] = useState(true);
  const [showLogOutreachModal, setShowLogOutreachModal] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [companiesRes, contactsRes, outreachRes, campaignsRes] = await Promise.all([
        getCompanies(),
        getContacts(),
        getAllOutreach(),
        getCampaigns()
      ]);

      setStats({
        totalCompanies: companiesRes.data.length,
        totalContacts: contactsRes.data.length,
        totalOutreach: outreachRes.data.length,
        totalCampaigns: campaignsRes.data.length,
        recentOutreach: outreachRes.data.slice(0, 5)
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="container"><div className="loading">Loading dashboard...</div></div>;
  }

  return (
    <div className="container">
      <div className="page-header">
        <h2>Dashboard</h2>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3 className="card-title">📊 Statistics</h3>
          <div className="info-grid">
            <div className="info-item">
              <div className="info-label">Total Companies</div>
              <div className="info-value" style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3498db' }}>
                {stats.totalCompanies}
              </div>
            </div>
            <div className="info-item">
              <div className="info-label">Total Contacts</div>
              <div className="info-value" style={{ fontSize: '2rem', fontWeight: 'bold', color: '#27ae60' }}>
                {stats.totalContacts}
              </div>
            </div>
            <div className="info-item">
              <div className="info-label">Total Campaigns</div>
              <div className="info-value" style={{ fontSize: '2rem', fontWeight: 'bold', color: '#9b59b6' }}>
                {stats.totalCampaigns}
              </div>
            </div>
            <div className="info-item">
              <div className="info-label">Total Outreach</div>
              <div className="info-value" style={{ fontSize: '2rem', fontWeight: 'bold', color: '#e74c3c' }}>
                {stats.totalOutreach}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">🎯 Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <button
              onClick={() => setShowLogOutreachModal(true)}
              className="btn btn-primary"
              style={{ textAlign: 'center' }}
            >
              ✉️ Log Outreach
            </button>
            <Link to="/companies" className="btn btn-primary">Manage Companies</Link>
            <Link to="/contacts" className="btn btn-success">Manage Contacts</Link>
            <Link to="/campaigns" className="btn btn-info">Manage Campaigns</Link>
            <Link to="/outreach" className="btn btn-secondary">View Outreach History</Link>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '2rem' }}>
        <h3 className="card-title">📝 Recent Outreach</h3>
        {stats.recentOutreach.length === 0 ? (
          <div className="empty-state">
            <p>No outreach activities yet</p>
          </div>
        ) : (
          <div>
            {stats.recentOutreach.map((outreach) => (
              <div key={outreach.id} className="list-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{outreach.first_name} {outreach.last_name}</strong> - {outreach.company_name}
                    <div style={{ color: '#7f8c8d', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                      {outreach.outreach_type} • {new Date(outreach.outreach_date).toLocaleDateString()}
                      {outreach.subject && ` • ${outreach.subject}`}
                    </div>
                  </div>
                  <Link to={`/contacts/${outreach.contact_id}`} className="btn btn-small btn-primary">
                    View Contact
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <LogOutreachModal
        isOpen={showLogOutreachModal}
        onClose={() => setShowLogOutreachModal(false)}
        onSuccess={loadDashboardData}
      />
    </div>
  );
}

export default Dashboard;

// Made with Bob
