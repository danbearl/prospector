import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  getContact,
  getContactRelationships,
  getContactOutreach,
  createContactRelationship,
  deleteContactRelationship,
  createOutreach,
  updateOutreach,
  deleteOutreach,
  getContacts,
  getCampaigns
} from '../api';
import { formatLocalDate } from '../utils/dateUtils';

function ContactDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contact, setContact] = useState(null);
  const [relationships, setRelationships] = useState([]);
  const [outreach, setOutreach] = useState([]);
  const [allContacts, setAllContacts] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRelationshipModal, setShowRelationshipModal] = useState(false);
  const [showOutreachModal, setShowOutreachModal] = useState(false);
  const [editingOutreach, setEditingOutreach] = useState(null);
  const [showNewCampaignForm, setShowNewCampaignForm] = useState(false);
  
  const [relationshipForm, setRelationshipForm] = useState({
    related_contact_id: '',
    relationship_type: '',
    notes: ''
  });

  const [outreachForm, setOutreachForm] = useState({
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
    loadContactData();
  }, [id]);

  const loadContactData = async () => {
    try {
      const [contactRes, relationshipsRes, outreachRes, contactsRes, campaignsRes] = await Promise.all([
        getContact(id),
        getContactRelationships(id),
        getContactOutreach(id),
        getContacts(),
        getCampaigns()
      ]);
      setContact(contactRes.data);
      setRelationships(relationshipsRes.data);
      setOutreach(outreachRes.data);
      setAllContacts(contactsRes.data.filter(c => c.id !== parseInt(id)));
      setCampaigns(campaignsRes.data);
    } catch (error) {
      console.error('Error loading contact data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRelationship = async (e) => {
    e.preventDefault();
    try {
      await createContactRelationship(id, relationshipForm);
      setShowRelationshipModal(false);
      setRelationshipForm({ related_contact_id: '', relationship_type: '', notes: '' });
      loadContactData();
    } catch (error) {
      console.error('Error adding relationship:', error);
    }
  };

  const handleDeleteRelationship = async (relationshipId) => {
    if (window.confirm('Are you sure you want to delete this relationship?')) {
      try {
        await deleteContactRelationship(relationshipId);
        loadContactData();
      } catch (error) {
        console.error('Error deleting relationship:', error);
      }
    }
  };

  const handleAddOutreach = async (e) => {
    e.preventDefault();
    try {
      if (editingOutreach) {
        await updateOutreach(editingOutreach.id, outreachForm);
      } else {
        await createOutreach(id, outreachForm);
      }
      setShowOutreachModal(false);
      setEditingOutreach(null);
      resetOutreachForm();
      loadContactData();
    } catch (error) {
      console.error('Error saving outreach:', error);
    }
  };

  const handleEditOutreach = (outreachItem) => {
    setEditingOutreach(outreachItem);
    setOutreachForm({
      outreach_type: outreachItem.outreach_type,
      outreach_date: outreachItem.outreach_date.split('T')[0],
      subject: outreachItem.subject || '',
      notes: outreachItem.notes || '',
      outcome: outreachItem.outcome || '',
      follow_up_date: outreachItem.follow_up_date ? outreachItem.follow_up_date.split('T')[0] : ''
    });
    setShowOutreachModal(true);
  };

  const handleDeleteOutreach = async (outreachId) => {
    if (window.confirm('Are you sure you want to delete this outreach record?')) {
      try {
        await deleteOutreach(outreachId);
        loadContactData();
      } catch (error) {
        console.error('Error deleting outreach:', error);
      }
    }
  };

  const resetOutreachForm = () => {
    setOutreachForm({
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
  };

  const handleCampaignToggle = (campaignId) => {
    setOutreachForm(prev => ({
      ...prev,
      campaign_ids: prev.campaign_ids.includes(campaignId)
        ? prev.campaign_ids.filter(id => id !== campaignId)
        : [...prev.campaign_ids, campaignId]
    }));
  };

  const getInfluenceBadgeClass = (level) => {
    const classes = {
      'Low': 'badge-low',
      'Medium': 'badge-medium',
      'High': 'badge-high',
      'Executive': 'badge-executive'
    };
    return `badge ${classes[level] || 'badge-medium'}`;
  };

  const getLeadStatusBadgeClass = (status) => {
    const classes = {
      'Potential Lead': 'badge-medium',
      'Validated Lead': 'badge-high'
    };
    return `badge ${classes[status] || 'badge-medium'}`;
  };

  if (loading) {
    return <div className="container"><div className="loading">Loading contact details...</div></div>;
  }

  if (!contact) {
    return <div className="container"><div className="error">Contact not found</div></div>;
  }

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <button className="btn btn-secondary" onClick={() => navigate('/contacts')} style={{ marginBottom: '0.5rem' }}>
            ← Back to Contacts
          </button>
          <h2>{contact.first_name} {contact.last_name}</h2>
          <p style={{ color: '#7f8c8d', marginTop: '0.5rem' }}>{contact.company_name}</p>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Contact Information</h3>
        <div className="info-grid">
          {contact.position && (
            <div className="info-item">
              <div className="info-label">Position</div>
              <div className="info-value">{contact.position}</div>
            </div>
          )}
          <div className="info-item">
            <div className="info-label">Influence Level</div>
            <div className="info-value">
              <span className={getInfluenceBadgeClass(contact.influence_level)}>
                {contact.influence_level}
              </span>
            </div>
          </div>
          <div className="info-item">
            <div className="info-label">Lead Status</div>
            <div className="info-value">
              <span className={getLeadStatusBadgeClass(contact.lead_status)}>
                {contact.lead_status || 'Potential Lead'}
              </span>
            </div>
          </div>
          {contact.email && (
            <div className="info-item">
              <div className="info-label">Email</div>
              <div className="info-value">
                <a href={`mailto:${contact.email}`}>{contact.email}</a>
              </div>
            </div>
          )}
          {contact.phone && (
            <div className="info-item">
              <div className="info-label">Phone</div>
              <div className="info-value">{contact.phone}</div>
            </div>
          )}
          {contact.linkedin && (
            <div className="info-item">
              <div className="info-label">LinkedIn</div>
              <div className="info-value">
                <a href={contact.linkedin} target="_blank" rel="noopener noreferrer">Profile</a>
              </div>
            </div>
          )}
        </div>

        {contact.tags?.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <div className="info-label">Tags</div>
            <div className="tag-chip-list" style={{ marginTop: '0.5rem' }}>
              {contact.tags.map((tag) => (
                <span key={tag.id} className="tag-chip">{tag.name}</span>
              ))}
            </div>
          </div>
        )}

        {contact.notes && (
          <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
            <div className="info-label">Notes</div>
            <div style={{ marginTop: '0.5rem' }}>{contact.notes}</div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Relationships</h3>
          <button className="btn btn-small btn-primary" onClick={() => setShowRelationshipModal(true)}>
            + Add Relationship
          </button>
        </div>
        {relationships.length === 0 ? (
          <div className="empty-state">
            <p>No relationships recorded</p>
          </div>
        ) : (
          <div>
            {relationships.map((rel) => (
              <div key={rel.id} className="list-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{rel.related_first_name} {rel.related_last_name}</strong>
                    {rel.related_position && ` - ${rel.related_position}`}
                    {rel.related_company_name && (
                      <div style={{ color: '#7f8c8d', fontSize: '0.875rem' }}>
                        {rel.related_company_name}
                      </div>
                    )}
                    {rel.relationship_type && (
                      <div style={{ marginTop: '0.25rem', fontSize: '0.875rem' }}>
                        <span className="badge badge-medium">{rel.relationship_type}</span>
                      </div>
                    )}
                    {rel.notes && (
                      <div style={{ marginTop: '0.5rem', color: '#7f8c8d', fontSize: '0.875rem' }}>
                        {rel.notes}
                      </div>
                    )}
                  </div>
                  <button className="btn btn-small btn-danger" onClick={() => handleDeleteRelationship(rel.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Outreach History</h3>
          <button className="btn btn-small btn-success" onClick={() => { setEditingOutreach(null); resetOutreachForm(); setShowOutreachModal(true); }}>
            + Log Outreach
          </button>
        </div>
        {outreach.length === 0 ? (
          <div className="empty-state">
            <p>No outreach history</p>
          </div>
        ) : (
          <div>
            {outreach.map((item) => (
              <div key={item.id} className="list-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span className="badge badge-medium">{item.outreach_type}</span>
                      <span style={{ color: '#7f8c8d', fontSize: '0.875rem' }}>
                        {formatLocalDate(item.outreach_date)}
                      </span>
                    </div>
                    {item.subject && (
                      <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{item.subject}</div>
                    )}
                    {item.notes && (
                      <div style={{ color: '#7f8c8d', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                        {item.notes}
                      </div>
                    )}
                    {item.outcome && (
                      <div style={{ fontSize: '0.875rem' }}>
                        <strong>Outcome:</strong> {item.outcome}
                      </div>
                    )}
                    {item.follow_up_date && (
                      <div style={{ fontSize: '0.875rem', color: '#e74c3c', marginTop: '0.25rem' }}>
                        <strong>Follow-up:</strong> {formatLocalDate(item.follow_up_date)}
                      </div>
                    )}
                  </div>
                  <div className="card-actions">
                    <button className="btn btn-small btn-secondary" onClick={() => handleEditOutreach(item)}>
                      Edit
                    </button>
                    <button className="btn btn-small btn-danger" onClick={() => handleDeleteOutreach(item.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showRelationshipModal && (
        <div className="modal-overlay" onClick={() => setShowRelationshipModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add Relationship</h2>
              <button className="close-btn" onClick={() => setShowRelationshipModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddRelationship}>
              <div className="form-group">
                <label>Related Contact *</label>
                <select
                  value={relationshipForm.related_contact_id}
                  onChange={(e) => setRelationshipForm({ ...relationshipForm, related_contact_id: e.target.value })}
                  required
                >
                  <option value="">Select a contact</option>
                  {allContacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.first_name} {c.last_name} - {c.company_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Relationship Type</label>
                <input
                  type="text"
                  value={relationshipForm.relationship_type}
                  onChange={(e) => setRelationshipForm({ ...relationshipForm, relationship_type: e.target.value })}
                  placeholder="e.g., Reports to, Colleague, Friend"
                />
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={relationshipForm.notes}
                  onChange={(e) => setRelationshipForm({ ...relationshipForm, notes: e.target.value })}
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-success">Add</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowRelationshipModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showOutreachModal && (
        <div className="modal-overlay" onClick={() => setShowOutreachModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingOutreach ? 'Edit Outreach' : 'Log Outreach'}</h2>
              <button className="close-btn" onClick={() => setShowOutreachModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddOutreach}>
              <div className="form-group">
                <label>Outreach Type *</label>
                <select
                  value={outreachForm.outreach_type}
                  onChange={(e) => setOutreachForm({ ...outreachForm, outreach_type: e.target.value })}
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
                  value={outreachForm.outreach_date}
                  onChange={(e) => setOutreachForm({ ...outreachForm, outreach_date: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Subject</label>
                <input
                  type="text"
                  value={outreachForm.subject}
                  onChange={(e) => setOutreachForm({ ...outreachForm, subject: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={outreachForm.notes}
                  onChange={(e) => setOutreachForm({ ...outreachForm, notes: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Outcome</label>
                <input
                  type="text"
                  value={outreachForm.outcome}
                  onChange={(e) => setOutreachForm({ ...outreachForm, outcome: e.target.value })}
                  placeholder="e.g., Scheduled meeting, No response, etc."
                />
              </div>
              <div className="form-group">
                <label>Follow-up Date</label>
                <input
                  type="date"
                  value={outreachForm.follow_up_date}
                  onChange={(e) => setOutreachForm({ ...outreachForm, follow_up_date: e.target.value })}
                />
              </div>

              {!editingOutreach && (
                <>
                  <div className="form-group">
                    <label>Campaigns</label>
                    <div style={{ marginTop: '0.5rem', maxHeight: '150px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px', padding: '0.5rem' }}>
                      {campaigns.length === 0 ? (
                        <p style={{ color: '#7f8c8d', fontSize: '0.875rem', margin: 0 }}>No campaigns available</p>
                      ) : (
                        campaigns.map((campaign) => (
                          <div key={campaign.id} style={{ marginBottom: '0.5rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontWeight: 'normal' }}>
                              <input
                                type="checkbox"
                                checked={outreachForm.campaign_ids.includes(campaign.id)}
                                onChange={() => handleCampaignToggle(campaign.id)}
                                style={{ marginRight: '0.5rem' }}
                              />
                              <span>{campaign.name}</span>
                              {campaign.status && (
                                <span className={`badge badge-${campaign.status === 'Active' ? 'high' : 'medium'}`} style={{ marginLeft: '0.5rem', fontSize: '0.75rem' }}>
                                  {campaign.status}
                                </span>
                              )}
                            </label>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <button
                      type="button"
                      className="btn btn-small btn-secondary"
                      onClick={() => setShowNewCampaignForm(!showNewCampaignForm)}
                      style={{ width: '100%' }}
                    >
                      {showNewCampaignForm ? '− Cancel New Campaign' : '+ Create New Campaign'}
                    </button>
                  </div>

                  {showNewCampaignForm && (
                    <>
                      <div className="form-group">
                        <label>New Campaign Name</label>
                        <input
                          type="text"
                          value={outreachForm.new_campaign.name}
                          onChange={(e) => setOutreachForm({
                            ...outreachForm,
                            new_campaign: { ...outreachForm.new_campaign, name: e.target.value }
                          })}
                          placeholder="Enter campaign name"
                        />
                      </div>
                      <div className="form-group">
                        <label>New Campaign Description</label>
                        <textarea
                          value={outreachForm.new_campaign.description}
                          onChange={(e) => setOutreachForm({
                            ...outreachForm,
                            new_campaign: { ...outreachForm.new_campaign, description: e.target.value }
                          })}
                          placeholder="Optional description"
                          rows="2"
                        />
                      </div>
                    </>
                  )}
                </>
              )}

              <div className="form-actions">
                <button type="submit" className="btn btn-success">
                  {editingOutreach ? 'Update' : 'Log'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowOutreachModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ContactDetail;

// Made with Bob
