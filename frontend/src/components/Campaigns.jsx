import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCampaigns, createCampaign, updateCampaign, deleteCampaign, getCampaignOutreach } from '../api';

function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [viewingCampaign, setViewingCampaign] = useState(null);
  const [campaignOutreach, setCampaignOutreach] = useState([]);
  const [loadingOutreach, setLoadingOutreach] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    status: 'Active'
  });

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      const response = await getCampaigns();
      setCampaigns(response.data);
    } catch (error) {
      console.error('Error loading campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCampaign) {
        await updateCampaign(editingCampaign.id, formData);
      } else {
        await createCampaign(formData);
      }
      loadCampaigns();
      resetForm();
    } catch (error) {
      console.error('Error saving campaign:', error);
      alert('Failed to save campaign');
    }
  };

  const handleEdit = (campaign) => {
    setEditingCampaign(campaign);
    setFormData({
      name: campaign.name,
      description: campaign.description || '',
      start_date: campaign.start_date ? campaign.start_date.split('T')[0] : '',
      end_date: campaign.end_date ? campaign.end_date.split('T')[0] : '',
      status: campaign.status
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this campaign? This will remove it from all associated outreach records.')) {
      try {
        await deleteCampaign(id);
        loadCampaigns();
      } catch (error) {
        console.error('Error deleting campaign:', error);
        alert('Failed to delete campaign');
      }
    }
  };

  const handleViewOutreach = async (campaign) => {
    setViewingCampaign(campaign);
    setLoadingOutreach(true);
    try {
      const response = await getCampaignOutreach(campaign.id);
      setCampaignOutreach(response.data);
    } catch (error) {
      console.error('Error loading campaign outreach:', error);
      alert('Failed to load outreach data');
    } finally {
      setLoadingOutreach(false);
    }
  };

  const closeOutreachView = () => {
    setViewingCampaign(null);
    setCampaignOutreach([]);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      start_date: '',
      end_date: '',
      status: 'Active'
    });
    setEditingCampaign(null);
    setShowForm(false);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Active':
        return 'badge-high';
      case 'Completed':
        return 'badge-medium';
      case 'Paused':
        return 'badge-low';
      default:
        return '';
    }
  };

  if (loading) {
    return <div className="container"><div className="loading">Loading campaigns...</div></div>;
  }

  return (
    <div className="container">
      <div className="page-header">
        <h2>Campaigns</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Campaign'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h3 className="card-title">{editingCampaign ? 'Edit Campaign' : 'New Campaign'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Campaign Name *</label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="3"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="start_date">Start Date</label>
                <input
                  type="date"
                  id="start_date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="end_date">End Date</label>
                <input
                  type="date"
                  id="end_date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="Active">Active</option>
                <option value="Paused">Paused</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {editingCampaign ? 'Update Campaign' : 'Create Campaign'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <h3 className="card-title">All Campaigns ({campaigns.length})</h3>
        
        {campaigns.length === 0 ? (
          <div className="empty-state">
            <h3>No campaigns yet</h3>
            <p>Create your first campaign to organize your outreach efforts</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => (
                  <tr key={campaign.id}>
                    <td><strong>{campaign.name}</strong></td>
                    <td>{campaign.description || '-'}</td>
                    <td>
                      {campaign.start_date 
                        ? new Date(campaign.start_date).toLocaleDateString() 
                        : '-'}
                    </td>
                    <td>
                      {campaign.end_date 
                        ? new Date(campaign.end_date).toLocaleDateString() 
                        : '-'}
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(campaign.status)}`}>
                        {campaign.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                          className="btn btn-small btn-info"
                          onClick={() => handleViewOutreach(campaign)}
                        >
                          View Outreach
                        </button>
                        <button
                          className="btn btn-small btn-secondary"
                          onClick={() => handleEdit(campaign)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-small btn-danger"
                          onClick={() => handleDelete(campaign.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Campaign Outreach Modal */}
      {viewingCampaign && (
        <div className="modal-overlay" onClick={closeOutreachView}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                Outreach for "{viewingCampaign.name}"
              </h3>
              <button className="close-btn" onClick={closeOutreachView}>×</button>
            </div>

            {loadingOutreach ? (
              <div className="loading">Loading outreach...</div>
            ) : campaignOutreach.length === 0 ? (
              <div className="empty-state">
                <p>No outreach activities associated with this campaign yet</p>
              </div>
            ) : (
              <div>
                <p style={{ marginBottom: '1rem', color: '#7f8c8d' }}>
                  Total outreach activities: <strong>{campaignOutreach.length}</strong>
                </p>
                <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                  {campaignOutreach.map((outreach) => (
                    <div key={outreach.id} className="list-item">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ marginBottom: '0.5rem' }}>
                            <strong style={{ fontSize: '1.1rem' }}>
                              {outreach.first_name} {outreach.last_name}
                            </strong>
                            {outreach.company_name && (
                              <span style={{ color: '#7f8c8d', marginLeft: '0.5rem' }}>
                                @ {outreach.company_name}
                              </span>
                            )}
                          </div>
                          <div style={{ color: '#7f8c8d', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                            <span className="badge badge-low" style={{ marginRight: '0.5rem' }}>
                              {outreach.outreach_type}
                            </span>
                            {new Date(outreach.outreach_date).toLocaleDateString()}
                          </div>
                          {outreach.subject && (
                            <div style={{ marginTop: '0.5rem' }}>
                              <strong>Subject:</strong> {outreach.subject}
                            </div>
                          )}
                          {outreach.notes && (
                            <div style={{ marginTop: '0.5rem', color: '#555' }}>
                              {outreach.notes}
                            </div>
                          )}
                          {outreach.outcome && (
                            <div style={{ marginTop: '0.5rem' }}>
                              <strong>Outcome:</strong> {outreach.outcome}
                            </div>
                          )}
                        </div>
                        <Link
                          to={`/contacts/${outreach.contact_id}`}
                          className="btn btn-small btn-primary"
                          onClick={closeOutreachView}
                        >
                          View Contact
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Campaigns;

// Made with Bob