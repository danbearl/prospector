import React, { useState, useEffect } from 'react';
import { getCampaigns, createCampaign, updateCampaign, deleteCampaign } from '../api';

function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
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
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
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
    </div>
  );
}

export default Campaigns;

// Made with Bob