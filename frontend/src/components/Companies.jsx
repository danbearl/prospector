import React, { useState, useEffect } from 'react';
import { getCompanies, createCompany, updateCompany, deleteCompany, getTags } from '../api';

const getInitialFormData = () => ({
  name: '',
  industry: '',
  website: '',
  location: '',
  territory: '',
  notes: '',
  tag_ids: [],
  new_tags: []
});

function Companies() {
  const [companies, setCompanies] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [newTagInput, setNewTagInput] = useState('');
  const [formData, setFormData] = useState(getInitialFormData());

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const [companiesRes, tagsRes] = await Promise.all([
        getCompanies(),
        getTags()
      ]);
      setCompanies(companiesRes.data);
      setAvailableTags(tagsRes.data);
    } catch (error) {
      console.error('Error loading companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(getInitialFormData());
    setNewTagInput('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCompany) {
        await updateCompany(editingCompany.id, formData);
      } else {
        await createCompany(formData);
      }
      setShowModal(false);
      setEditingCompany(null);
      resetForm();
      loadCompanies();
    } catch (error) {
      console.error('Error saving company:', error);
      alert(error.response?.data?.error || 'Failed to save company');
    }
  };

  const handleEdit = (company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      industry: company.industry || '',
      website: company.website || '',
      location: company.location || '',
      territory: company.territory || '',
      notes: company.notes || '',
      tag_ids: (company.tags || []).map((tag) => tag.id),
      new_tags: []
    });
    setNewTagInput('');
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this company? This will also delete all associated contacts.')) {
      try {
        await deleteCompany(id);
        loadCompanies();
      } catch (error) {
        console.error('Error deleting company:', error);
      }
    }
  };

  const handleAdd = () => {
    setEditingCompany(null);
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

  if (loading) {
    return <div className="container"><div className="loading">Loading companies...</div></div>;
  }

  return (
    <div className="container">
      <div className="page-header">
        <h2>Companies</h2>
        <button className="btn btn-primary" onClick={handleAdd}>
          + Add Company
        </button>
      </div>

      {companies.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <h3>No companies yet</h3>
            <p>Start by adding your first company</p>
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Industry</th>
                <th>Location</th>
                <th>Territory</th>
                <th>Tags</th>
                <th>Website</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr key={company.id}>
                  <td><strong>{company.name}</strong></td>
                  <td>{company.industry || '-'}</td>
                  <td>{company.location || '-'}</td>
                  <td>{company.territory || '-'}</td>
                  <td>
                    {company.tags?.length ? (
                      <div className="tag-chip-list">
                        {company.tags.map((tag) => (
                          <span key={tag.id} className="tag-chip">{tag.name}</span>
                        ))}
                      </div>
                    ) : '-'}
                  </td>
                  <td>
                    {company.website ? (
                      <a href={company.website} target="_blank" rel="noopener noreferrer">
                        Link
                      </a>
                    ) : '-'}
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="btn btn-small btn-primary" onClick={() => handleEdit(company)}>
                        Edit
                      </button>
                      <button className="btn btn-small btn-danger" onClick={() => handleDelete(company.id)}>
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
                {editingCompany ? 'Edit Company' : 'Add Company'}
              </h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Company Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Industry</label>
                <input
                  type="text"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="City, State/Country"
                />
              </div>
              <div className="form-group">
                <label>Territory</label>
                <input
                  type="text"
                  value={formData.territory}
                  onChange={(e) => setFormData({ ...formData, territory: e.target.value })}
                  placeholder="e.g., Northeast, EMEA, APAC"
                />
              </div>
              <div className="form-group">
                <label>Website</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://example.com"
                />
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
                <label>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-success">
                  {editingCompany ? 'Update' : 'Create'}
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

export default Companies;

// Made with Bob
