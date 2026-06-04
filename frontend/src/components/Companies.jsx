import React, { useState, useEffect } from 'react';
import { getCompanies, createCompany, updateCompany, deleteCompany } from '../api';

function Companies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    website: '',
    location: '',
    territory: '',
    notes: ''
  });

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const response = await getCompanies();
      setCompanies(response.data);
    } catch (error) {
      console.error('Error loading companies:', error);
    } finally {
      setLoading(false);
    }
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
      setFormData({ name: '', industry: '', website: '', location: '', territory: '', notes: '' });
      loadCompanies();
    } catch (error) {
      console.error('Error saving company:', error);
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
      notes: company.notes || ''
    });
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
    setFormData({ name: '', industry: '', website: '', location: '', territory: '', notes: '' });
    setShowModal(true);
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
