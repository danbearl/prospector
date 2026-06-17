import React, { useEffect, useState } from 'react';
import { getTags, createTag, updateTag, deleteTag } from '../api';

function Tags() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTagName, setNewTagName] = useState('');
  const [editingTagId, setEditingTagId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      setLoading(true);
      const response = await getTags();
      setTags(response.data);
    } catch (error) {
      console.error('Error loading tags:', error);
      alert('Failed to load tags');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTag = async (e) => {
    e.preventDefault();

    if (!newTagName.trim()) {
      return;
    }

    try {
      setSubmitting(true);
      await createTag({ name: newTagName });
      setNewTagName('');
      await loadTags();
    } catch (error) {
      console.error('Error creating tag:', error);
      alert(error.response?.data?.error || 'Failed to create tag');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEdit = (tag) => {
    setEditingTagId(tag.id);
    setEditingName(tag.name);
  };

  const handleCancelEdit = () => {
    setEditingTagId(null);
    setEditingName('');
  };

  const handleSaveEdit = async (tagId) => {
    if (!editingName.trim()) {
      return;
    }

    try {
      setSubmitting(true);
      await updateTag(tagId, { name: editingName });
      handleCancelEdit();
      await loadTags();
    } catch (error) {
      console.error('Error updating tag:', error);
      alert(error.response?.data?.error || 'Failed to update tag');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTag = async (tag) => {
    if (!window.confirm(`Delete tag "${tag.name}"? It will be removed from all companies and contacts.`)) {
      return;
    }

    try {
      setSubmitting(true);
      await deleteTag(tag.id);
      await loadTags();
    } catch (error) {
      console.error('Error deleting tag:', error);
      alert(error.response?.data?.error || 'Failed to delete tag');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="container"><div className="loading">Loading tags...</div></div>;
  }

  return (
    <div className="container">
      <div className="page-header">
        <h2>Tags</h2>
      </div>

      <div className="card">
        <h3 className="card-title">Create Tag</h3>
        <form onSubmit={handleCreateTag} style={{ marginTop: '1rem' }}>
          <div className="tag-create-row">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="Enter a new tag name"
              disabled={submitting}
            />
            <button type="submit" className="btn btn-primary" disabled={submitting || !newTagName.trim()}>
              Add Tag
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Manage Tags</h3>
          <span style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>{tags.length} total</span>
        </div>

        {tags.length === 0 ? (
          <div className="empty-state">
            <p>No tags created yet</p>
          </div>
        ) : (
          <div>
            {tags.map((tag) => (
              <div key={tag.id} className="list-item" style={{ cursor: 'default' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    {editingTagId === tag.id ? (
                      <div className="tag-create-row">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          disabled={submitting}
                        />
                        <button
                          type="button"
                          className="btn btn-small btn-success"
                          onClick={() => handleSaveEdit(tag.id)}
                          disabled={submitting || !editingName.trim()}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="btn btn-small btn-secondary"
                          onClick={handleCancelEdit}
                          disabled={submitting}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="tag-chip-list">
                          <span className="tag-chip">{tag.name}</span>
                        </div>
                        <div style={{ color: '#7f8c8d', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                          Used by {tag.company_count || 0} companies and {tag.contact_count || 0} contacts
                        </div>
                      </>
                    )}
                  </div>

                  {editingTagId !== tag.id && (
                    <div className="table-actions">
                      <button
                        type="button"
                        className="btn btn-small btn-secondary"
                        onClick={() => handleStartEdit(tag)}
                        disabled={submitting}
                      >
                        Rename
                      </button>
                      <button
                        type="button"
                        className="btn btn-small btn-danger"
                        onClick={() => handleDeleteTag(tag)}
                        disabled={submitting}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Tags;

// Made with Bob