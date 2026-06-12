import React, { useState, useEffect } from 'react';
import { getContacts, getCampaigns, createOutreach } from '../api';

function LogOutreachModal({ isOpen, onClose, onSuccess }) {
  const [contacts, setContacts] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showNewCampaignForm, setShowNewCampaignForm] = useState(false);
  
  const [formData, setFormData] = useState({
    contact_id: '',
    outreach_type: 'Email',
    outreach_date: new Date().toISOString().split('T')[0],
    subject: '',
    notes: '',
    outcome: '',
    follow_up_date: '',
    campaign_ids: [],
    new_campaign: { name: '', description: '' }
  });

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [contactsRes, campaignsRes] = await Promise.all([
        getContacts(),
        getCampaigns()
      ]);
      setContacts(contactsRes.data);
      setCampaigns(campaignsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Failed to load contacts and campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.contact_id) {
      alert('Please select a contact');
      return;
    }

    try {
      setSubmitting(true);
      await createOutreach(formData.contact_id, {
        outreach_type: formData.outreach_type,
        outreach_date: formData.outreach_date,
        subject: formData.subject,
        notes: formData.notes,
        outcome: formData.outcome,
        follow_up_date: formData.follow_up_date || null,
        campaign_ids: formData.campaign_ids,
        new_campaign: showNewCampaignForm ? formData.new_campaign : null
      });
      
      // Reset form
      setFormData({
        contact_id: '',
        outreach_type: 'Email',
        outreach_date: new Date().toISOString().split('T')[0],
        subject: '',
        notes: '',
        outcome: '',
        follow_up_date: '',
        campaign_ids: [],
        new_campaign: { name: '', description: '' }
      });
      setShowNewCampaignForm(false);
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating outreach:', error);
      alert('Failed to log outreach');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCampaignToggle = (campaignId) => {
    setFormData(prev => ({
      ...prev,
      campaign_ids: prev.campaign_ids.includes(campaignId)
        ? prev.campaign_ids.filter(id => id !== campaignId)
        : [...prev.campaign_ids, campaignId]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Log Outreach</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        
        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Contact *</label>
              <select
                value={formData.contact_id}
                onChange={(e) => setFormData({ ...formData, contact_id: e.target.value })}
                required
              >
                <option value="">Select a contact</option>
                {contacts.map(contact => (
                  <option key={contact.id} value={contact.id}>
                    {contact.first_name} {contact.last_name} - {contact.company_name || 'No Company'}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Outreach Type *</label>
                <select
                  value={formData.outreach_type}
                  onChange={(e) => setFormData({ ...formData, outreach_type: e.target.value })}
                  required
                >
                  <option value="Email">Email</option>
                  <option value="Phone">Phone</option>
                  <option value="Meeting">Meeting</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  value={formData.outreach_date}
                  onChange={(e) => setFormData({ ...formData, outreach_date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Subject</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Email subject or meeting topic"
              />
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows="3"
                placeholder="Details about the outreach..."
              />
            </div>

            <div className="form-group">
              <label>Outcome</label>
              <input
                type="text"
                value={formData.outcome}
                onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
                placeholder="e.g., Interested, No Response, Meeting Scheduled"
              />
            </div>

            <div className="form-group">
              <label>Follow-up Date</label>
              <input
                type="date"
                value={formData.follow_up_date}
                onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Campaigns</label>
              {campaigns.length === 0 ? (
                <p style={{ color: '#7f8c8d', fontSize: '0.875rem' }}>No campaigns available</p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {campaigns.map(campaign => (
                    <label key={campaign.id} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.campaign_ids.includes(campaign.id)}
                        onChange={() => handleCampaignToggle(campaign.id)}
                      />
                      <span>{campaign.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showNewCampaignForm}
                  onChange={(e) => setShowNewCampaignForm(e.target.checked)}
                />
                <span>Create new campaign</span>
              </label>
              
              {showNewCampaignForm && (
                <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                  <div className="form-group">
                    <label>Campaign Name</label>
                    <input
                      type="text"
                      value={formData.new_campaign.name}
                      onChange={(e) => setFormData({
                        ...formData,
                        new_campaign: { ...formData.new_campaign, name: e.target.value }
                      })}
                      placeholder="New campaign name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Campaign Description</label>
                    <textarea
                      value={formData.new_campaign.description}
                      onChange={(e) => setFormData({
                        ...formData,
                        new_campaign: { ...formData.new_campaign, description: e.target.value }
                      })}
                      rows="2"
                      placeholder="Campaign description (optional)"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Logging...' : 'Log Outreach'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default LogOutreachModal;

// Made with Bob