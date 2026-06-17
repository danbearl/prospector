import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCompanies, getContacts, getAllOutreach, getCampaigns, getDashboardFollowUps, closeOutreachFollowUp } from '../api';
import LogOutreachModal from './LogOutreachModal';
import { formatLocalDate } from '../utils/dateUtils';

function Dashboard() {
  const [stats, setStats] = useState({
    totalCompanies: 0,
    totalContacts: 0,
    totalOutreach: 0,
    totalCampaigns: 0,
    recentOutreach: [],
    upcomingFollowUps: [],
    pastDueFollowUps: []
  });
  const [loading, setLoading] = useState(true);
  const [showLogOutreachModal, setShowLogOutreachModal] = useState(false);
  const [selectedFollowUp, setSelectedFollowUp] = useState(null);
  const [closingFollowUpId, setClosingFollowUpId] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [companiesRes, contactsRes, outreachRes, campaignsRes, followUpsRes] = await Promise.all([
        getCompanies(),
        getContacts(),
        getAllOutreach(),
        getCampaigns(),
        getDashboardFollowUps()
      ]);

      setStats({
        totalCompanies: companiesRes.data.length,
        totalContacts: contactsRes.data.length,
        totalOutreach: outreachRes.data.length,
        totalCampaigns: campaignsRes.data.length,
        recentOutreach: outreachRes.data.slice(0, 5),
        upcomingFollowUps: followUpsRes.data.upcoming.slice(0, 5),
        pastDueFollowUps: followUpsRes.data.pastDue.slice(0, 5)
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenGeneralOutreachModal = () => {
    setSelectedFollowUp(null);
    setShowLogOutreachModal(true);
  };

  const handleOpenFollowUpOutreachModal = (followUp) => {
    setSelectedFollowUp(followUp);
    setShowLogOutreachModal(true);
  };

  const handleCloseOutreachModal = () => {
    setShowLogOutreachModal(false);
    setSelectedFollowUp(null);
  };

  const handleCloseFollowUp = async (followUpId) => {
    try {
      setClosingFollowUpId(followUpId);
      await closeOutreachFollowUp(followUpId);
      await loadDashboardData();
    } catch (error) {
      console.error('Error closing follow-up:', error);
      alert('Failed to close follow-up');
    } finally {
      setClosingFollowUpId(null);
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
              onClick={handleOpenGeneralOutreachModal}
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

      <div className="grid grid-2" style={{ marginTop: '2rem' }}>
        <div className="card">
          <h3 className="card-title">⏰ Upcoming Follow-Ups</h3>
          {stats.upcomingFollowUps.length === 0 ? (
            <div className="empty-state">
              <p>No upcoming follow-ups scheduled</p>
            </div>
          ) : (
            <div>
              {stats.upcomingFollowUps.map((followUp) => (
                <div key={followUp.id} className="list-item">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                    <div>
                      <strong>{followUp.first_name} {followUp.last_name}</strong> - {followUp.company_name || 'No Company'}
                      <div style={{ color: '#7f8c8d', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                        Follow up by {formatLocalDate(followUp.follow_up_date)} • {followUp.outreach_type}
                        {followUp.subject && ` • ${followUp.subject}`}
                      </div>
                      {followUp.outcome && (
                        <div style={{ color: '#95a5a6', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                          Last outcome: {followUp.outcome}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        className="btn btn-small btn-primary"
                        onClick={() => handleOpenFollowUpOutreachModal(followUp)}
                      >
                        Log Outreach
                      </button>
                      <button
                        type="button"
                        className="btn btn-small btn-secondary"
                        onClick={() => handleCloseFollowUp(followUp.id)}
                        disabled={closingFollowUpId === followUp.id}
                      >
                        {closingFollowUpId === followUp.id ? 'Closing...' : 'Close Follow-Up'}
                      </button>
                      <Link to={`/contacts/${followUp.contact_id}`} className="btn btn-small btn-info">
                        View Contact
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="card-title">⚠️ Past-Due Follow-Ups</h3>
          {stats.pastDueFollowUps.length === 0 ? (
            <div className="empty-state">
              <p>No past-due follow-ups</p>
            </div>
          ) : (
            <div>
              {stats.pastDueFollowUps.map((followUp) => (
                <div key={followUp.id} className="list-item">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                    <div>
                      <strong>{followUp.first_name} {followUp.last_name}</strong> - {followUp.company_name || 'No Company'}
                      <div style={{ color: '#c0392b', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                        Was due {formatLocalDate(followUp.follow_up_date)} • {followUp.outreach_type}
                        {followUp.subject && ` • ${followUp.subject}`}
                      </div>
                      {followUp.outcome && (
                        <div style={{ color: '#95a5a6', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                          Last outcome: {followUp.outcome}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        className="btn btn-small btn-primary"
                        onClick={() => handleOpenFollowUpOutreachModal(followUp)}
                      >
                        Log Outreach
                      </button>
                      <button
                        type="button"
                        className="btn btn-small btn-secondary"
                        onClick={() => handleCloseFollowUp(followUp.id)}
                        disabled={closingFollowUpId === followUp.id}
                      >
                        {closingFollowUpId === followUp.id ? 'Closing...' : 'Close Follow-Up'}
                      </button>
                      <Link to={`/contacts/${followUp.contact_id}`} className="btn btn-small btn-info">
                        View Contact
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
                      {outreach.outreach_type} • {formatLocalDate(outreach.outreach_date)}
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
        onClose={handleCloseOutreachModal}
        onSuccess={loadDashboardData}
        initialContactId={selectedFollowUp?.contact_id || ''}
        completedFollowUpId={selectedFollowUp?.id || null}
      />
    </div>
  );
}

export default Dashboard;

// Made with Bob
