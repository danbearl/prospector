import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getContacts, getCompanies, getTags, createContact, updateContact, deleteContact } from '../api';

const getInitialFormData = () => ({
  company_id: '',
  first_name: '',
  last_name: '',
  position: '',
  influence_level: 'Medium',
  lead_status: 'Potential Lead',
  email: '',
  phone: '',
  linkedin: '',
  notes: '',
  tag_ids: [],
  new_tags: []
});

const getInitialFilters = () => ({
  search: '',
  company_id: '',
  tag_ids: [],
  tag_mode: 'any',
  outreach_start: '',
  outreach_end: '',
  outreach_presence: 'any',
  sort_by: 'name',
  sort_order: 'asc'
});

function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [newTagInput, setNewTagInput] = useState('');
  const [formData, setFormData] = useState(getInitialFormData());
  const [filters, setFilters] = useState(getInitialFilters());
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);

  useEffect(() => {
    loadReferenceData();
  }, []);

  useEffect(() => {
    loadContacts();
  }, [filters]);

  const loadReferenceData = async () => {
    try {
      setLoading(true);
      const [companiesRes, tagsRes] = await Promise.all([
        getCompanies(),
        getTags()
      ]);
      setCompanies(companiesRes.data);
      setAvailableTags(tagsRes.data);
      await loadContacts();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadContacts = async () => {
    try {
      const params = {
        ...filters,
        tag_ids: filters.tag_ids.join(',')
      };
      const contactsRes = await getContacts(params);
      setContacts(contactsRes.data);
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  const resetForm = () => {
    setFormData(getInitialFormData());
    setNewTagInput('');
  };

  const resetFilters = () => {
    setFilters(getInitialFilters());
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
      loadContacts();
    } catch (error) {
      console.error('Error saving contact:', error);
      alert(error.response?.data?.error || 'Failed to save contact');
    }
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
      notes: contact.notes || '',
      tag_ids: (contact.tags || []).map((tag) => tag.id),
      new_tags: []
    });
    setNewTagInput('');
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      try {
        await deleteContact(id);
        loadContacts();
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

  const handleTagToggle = (tagId) => {
    setFormData((prev) => ({
      ...prev,
      tag_ids: prev.tag_ids.includes(tagId)
        ? prev.tag_ids.filter((id) => id !== tagId)
        : [...prev.tag_ids, tagId]
    }));
  };

  const handleFilterTagToggle = (tagId) => {
    setFilters((prev) => ({
      ...prev,
      tag_ids: prev.tag_ids.includes(tagId)
        ? prev.tag_ids.filter((id) => id !== tagId)
        : [...prev.tag_ids, tagId]
    }));
  };

  const handleAddNewTag = () => {
    const normalizedTag = newTagInput.trim();
    if (!normalizedTag) {
      return;
    }

    const existingTag = availableTags.find((tag) => tag.name.toLowerCase() === normalizedTag.toLowerCase());
    if (existingTag) {
      if (!formData.tag_ids.includes(existingTag.id)) {
        setFormData((prev) => ({
          ...prev,
          tag_ids: [...prev.tag_ids, existingTag.id]
        }));
      }
    } else if (!formData.new_tags.some((tag) => tag.toLowerCase() === normalizedTag.toLowerCase())) {
      setFormData((prev) => ({
        ...prev,
        new_tags: [...prev.new_tags, normalizedTag]
      }));
    }

    setNewTagInput('');
  };

  const handleRemoveNewTag = (tagName) => {
    setFormData((prev) => ({
      ...prev,
      new_tags: prev.new_tags.filter((tag) => tag !== tagName)
    }));
  };

  const handleSort = (sortBy) => {
    setFilters((prev) => ({
      ...prev,
      sort_by: sortBy,
      sort_order: prev.sort_by === sortBy && prev.sort_order === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIndicator = (sortBy) => {
    if (filters.sort_by !== sortBy) {
      return '↕';
    }
    return filters.sort_order === 'asc' ? '↑' : '↓';
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

      <div className="card">
        <div className="card-header filter-card-header">
          <h3 className="card-title">Search & Filter</h3>
          <div className="filter-card-actions">
            <button
              type="button"
              className="btn btn-small btn-secondary"
              onClick={() => setFiltersCollapsed((prev) => !prev)}
            >
              {filtersCollapsed ? 'Expand Filters' : 'Minimize Filters'}
            </button>
            <button type="button" className="btn btn-small btn-secondary" onClick={resetFilters}>
              Reset Filters
            </button>
          </div>
        </div>

        {!filtersCollapsed && (
          <>
            <div className="grid grid-2">
              <div className="form-group">
                <label>Contact Name</label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="Search first name, last name, or full name"
                />
              </div>

              <div className="form-group">
                <label>Associated Company</label>
                <select
                  value={filters.company_id}
                  onChange={(e) => setFilters({ ...filters, company_id: e.target.value })}
                >
                  <option value="">All companies</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Outreach Presence in Date Range</label>
                <select
                  value={filters.outreach_presence}
                  onChange={(e) => setFilters({ ...filters, outreach_presence: e.target.value })}
                >
                  <option value="any">Any outreach status</option>
                  <option value="has">Has outreach in range</option>
                  <option value="none">No outreach in range</option>
                </select>
              </div>

              <div className="form-group">
                <label>Tag Match Mode</label>
                <select
                  value={filters.tag_mode}
                  onChange={(e) => setFilters({ ...filters, tag_mode: e.target.value })}
                >
                  <option value="any">Any Tags</option>
                  <option value="all">All Tags</option>
                </select>
              </div>

              <div className="form-group">
                <label>Outreach Start Date</label>
                <input
                  type="date"
                  value={filters.outreach_start}
                  onChange={(e) => setFilters({ ...filters, outreach_start: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Outreach End Date</label>
                <input
                  type="date"
                  value={filters.outreach_end}
                  onChange={(e) => setFilters({ ...filters, outreach_end: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Filter by Tags</label>
              <div className="tag-selector">
                {availableTags.length === 0 ? (
                  <p style={{ color: '#7f8c8d', fontSize: '0.875rem' }}>No tags available</p>
                ) : (
                  <div className="tag-option-list">
                    {availableTags.map((tag) => (
                      <label key={tag.id} className="tag-option">
                        <input
                          type="checkbox"
                          checked={filters.tag_ids.includes(tag.id)}
                          onChange={() => handleFilterTagToggle(tag.id)}
                        />
                        <span>{tag.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ color: '#7f8c8d', fontSize: '0.875rem' }}>
              Example: choose one or more tags, set a date range, and select “No outreach in range” to find tagged contacts with no outreach during that period.
            </div>
          </>
        )}
      </div>

      {contacts.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <h3>No contacts found</h3>
            <p>Try adjusting your filters or add a new contact</p>
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>
                  <button type="button" className="sort-button" onClick={() => handleSort('name')}>
                    Name {getSortIndicator('name')}
                  </button>
                </th>
                <th>
                  <button type="button" className="sort-button" onClick={() => handleSort('company')}>
                    Company {getSortIndicator('company')}
                  </button>
                </th>
                <th>Position</th>
                <th>Influence</th>
                <th>Lead Status</th>
                <th>Tags</th>
                <th>Email</th>
                <th>Phone</th>
                <th>
                  <button type="button" className="sort-button" onClick={() => handleSort('last_outreach')}>
                    Last Outreach {getSortIndicator('last_outreach')}
                  </button>
                </th>
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
                    {contact.tags?.length ? (
                      <div className="tag-chip-list">
                        {contact.tags.map((tag) => (
                          <span key={tag.id} className="tag-chip">{tag.name}</span>
                        ))}
                      </div>
                    ) : '-'}
                  </td>
                  <td>
                    {contact.email ? (
                      <a href={`mailto:${contact.email}`}>{contact.email}</a>
                    ) : '-'}
                  </td>
                  <td>{contact.phone || '-'}</td>
                  <td>{contact.last_outreach_date ? new Date(contact.last_outreach_date).toLocaleDateString() : '-'}</td>
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
                <label>Tags</label>
                <div className="tag-selector">
                  {availableTags.length === 0 ? (
                    <p style={{ color: '#7f8c8d', fontSize: '0.875rem' }}>No existing tags yet</p>
                  ) : (
                    <div className="tag-option-list">
                      {availableTags.map((tag) => (
                        <label key={tag.id} className="tag-option">
                          <input
                            type="checkbox"
                            checked={formData.tag_ids.includes(tag.id)}
                            onChange={() => handleTagToggle(tag.id)}
                          />
                          <span>{tag.name}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  <div className="tag-create-row">
                    <input
                      type="text"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      placeholder="Create a new tag"
                    />
                    <button type="button" className="btn btn-small btn-secondary" onClick={handleAddNewTag}>
                      Add Tag
                    </button>
                  </div>

                  {formData.new_tags.length > 0 && (
                    <div>
                      <div className="info-label">New tags to create</div>
                      <div className="tag-chip-list" style={{ marginTop: '0.5rem' }}>
                        {formData.new_tags.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            className="tag-chip tag-chip-button"
                            onClick={() => handleRemoveNewTag(tag)}
                          >
                            {tag} ×
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
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
