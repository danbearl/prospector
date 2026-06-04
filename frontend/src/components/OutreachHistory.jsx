import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllOutreach } from '../api';

function OutreachHistory() {
  const [outreach, setOutreach] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadOutreach();
  }, []);

  const loadOutreach = async () => {
    try {
      const response = await getAllOutreach();
      setOutreach(response.data);
    } catch (error) {
      console.error('Error loading outreach:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOutreach = filter === 'all' 
    ? outreach 
    : outreach.filter(item => item.outreach_type === filter);

  const upcomingFollowUps = outreach.filter(item => {
    if (!item.follow_up_date) return false;
    const followUpDate = new Date(item.follow_up_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return followUpDate >= today;
  }).sort((a, b) => new Date(a.follow_up_date) - new Date(b.follow_up_date));

  if (loading) {
    return <div className="container"><div className="loading">Loading outreach history...</div></div>;
  }

  return (
    <div className="container">
      <div className="page-header">
        <h2>Outreach History</h2>
      </div>

      {upcomingFollowUps.length > 0 && (
        <div className="card" style={{ backgroundColor: '#fff3cd', borderLeft: '4px solid #ffc107' }}>
          <h3 className="card-title">📅 Upcoming Follow-ups</h3>
          <div>
            {upcomingFollowUps.map((item) => (
              <div key={item.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid #f0e5c5' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{item.first_name} {item.last_name}</strong> - {item.company_name}
                    <div style={{ fontSize: '0.875rem', color: '#856404', marginTop: '0.25rem' }}>
                      Follow-up: {new Date(item.follow_up_date).toLocaleDateString()}
                      {item.subject && ` • ${item.subject}`}
                    </div>
                  </div>
                  <Link to={`/contacts/${item.contact_id}`} className="btn btn-small btn-primary">
                    View Contact
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">All Outreach</h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              className={`btn btn-small ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button 
              className={`btn btn-small ${filter === 'Email' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter('Email')}
            >
              Email
            </button>
            <button 
              className={`btn btn-small ${filter === 'Phone' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter('Phone')}
            >
              Phone
            </button>
            <button 
              className={`btn btn-small ${filter === 'Meeting' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter('Meeting')}
            >
              Meeting
            </button>
          </div>
        </div>

        {filteredOutreach.length === 0 ? (
          <div className="empty-state">
            <h3>No outreach history</h3>
            <p>Start tracking your outreach activities from contact pages</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Contact</th>
                  <th>Company</th>
                  <th>Subject</th>
                  <th>Outcome</th>
                  <th>Follow-up</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOutreach.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span className="badge badge-medium">{item.outreach_type}</span>
                    </td>
                    <td>{new Date(item.outreach_date).toLocaleDateString()}</td>
                    <td><strong>{item.first_name} {item.last_name}</strong></td>
                    <td>{item.company_name}</td>
                    <td>{item.subject || '-'}</td>
                    <td>{item.outcome || '-'}</td>
                    <td>
                      {item.follow_up_date ? (
                        <span style={{ color: '#e74c3c', fontWeight: '500' }}>
                          {new Date(item.follow_up_date).toLocaleDateString()}
                        </span>
                      ) : '-'}
                    </td>
                    <td>
                      <Link to={`/contacts/${item.contact_id}`} className="btn btn-small btn-primary">
                        View Contact
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default OutreachHistory;

// Made with Bob
