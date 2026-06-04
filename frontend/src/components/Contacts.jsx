import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getContacts, getCompanies, createContact, updateContact, deleteContact } from '../api';

function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [formData, setFormData] = useState({
    company_id: '',
    first_name: '',
    last_name: '',
    position: '',
    influence_level: 'Medium',
    lead_status: 'Potential Lead',
    email: '',
    phone: '',
    linkedin: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [contactsRes, companiesRes] = await Promise.all([
        getContacts(),
        getCompanies()
      ]);
      setContacts(contactsRes.data);
      setCompanies(companiesRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingContact) {
        await updateContact(editingContact.id, formData);
      } else {
        await createContact(formData);
      }
      setShowModal(false);
      setEditingContact(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving contact:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      company_id: '',
      first_name: '',
      last_name: '',
      position: '',
      influence_level: 'Medium',
      lead_status: 'Potential Lead',
      email: '',
      phone: '',
      linkedin: '',
      notes: ''
    });
  };

  const handleEdit = (contact) => {
    setEditingContact(contact);
    setFormData({
      company_id: contact.company_id,
      first_name: contact.first_name,
      last_name: contact.last_name,
      position: contact.position || '',
      influence_level: contact.influence_level || 'Medium',
      lead_status: contact.lead_status || 'Potential Lead',
      email: contact.email || '',
      phone: contact.phone || '',
      linkedin: contact.linkedin || '',
      notes: contact.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      try {
        await deleteContact(id);
        loadData();
      } catch (error) {
        console.error('Error deleting contact:', error);
      }
    }
  };

  const handleAdd = () => {
    setEditingContact(null);
    resetForm();
    setShowModal(true);
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
    return <div className="container"><div className="loading">Loading contacts...</div></div>;
  }

  return (
    <div className="container">
      <div className="page-header">
        <h2>Contacts</h2>
        <button className="btn btn-primary" onClick={handleAdd}>
          + Add Contact
        </button>
      </div>

      {contacts.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <h3>No contacts yet</h3>
            <p>Start by adding your first contact</p>
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Company</th>
                <th>Position</th>
                <th>Influence</th>
                <th>Lead Status</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => (
                <tr key={contact.id}>
                  <td><strong>{contact.first_name} {contact.last_name}</strong></td>
                  <td>{contact.company_name}</td>
                  <td>{contact.position || '-'}</td>
                  <td>
                    <span className={getInfluenceBadgeClass(contact.influence_level)}>
                      {contact.influence_level}
                    </span>
                  </td>
                  <td>
                    <span className={getLeadStatusBadgeClass(contact.lead_status)}>
                      {contact.lead_status || 'Potential Lead'}
                    </span>
                  </td>
                  <td>
                    {contact.email ? (
                      <a href={`mailto:${contact.email}`}>{contact.email}</a>
                    ) : '-'}
                  </td>
                  <td>{contact.phone || '-'}</td>
                  <td>
                    <div className="table-actions">
                      <Link to={`/contacts/${contact.id}`} className="btn btn-small btn-primary">
                        View
                      </Link>
                      <button className="btn btn-small btn-secondary" onClick={() => handleEdit(contact)}>
                        Edit
                      </button>
                      <button className="btn btn-small btn-danger" onClick={() => handleDelete(contact.id)}>
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

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingContact ? 'Edit Contact' : 'Add Contact'}
              </h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Company *</label>
                <select
                  value={formData.company_id}
                  onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                  required
                >
                  <option value="">Select a company</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>First Name *</label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Last Name *</label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Position</label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Influence Level</label>
                <select
                  value={formData.influence_level}
                  onChange={(e) => setFormData({ ...formData, influence_level: e.target.value })}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Executive">Executive</option>
                </select>
              </div>
              <div className="form-group">
                <label>Lead Status</label>
                <select
                  value={formData.lead_status}
                  onChange={(e) => setFormData({ ...formData, lead_status: e.target.value })}
                >
                  <option value="Potential Lead">Potential Lead</option>
                  <option value="Validated Lead">Validated Lead</option>
                </select>
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>LinkedIn</label>
                <input
                  type="url"
                  value={formData.linkedin}
                  onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                  placeholder="https://linkedin.com/in/..."
                />
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-success">
                  {editingContact ? 'Update' : 'Create'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Contacts;

// Made with Bob
