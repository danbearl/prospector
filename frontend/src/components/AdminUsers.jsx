import React, { useState, useEffect } from 'react';
import api from '../api';

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [selectedFromUser, setSelectedFromUser] = useState(null);
  const [selectedToUserId, setSelectedToUserId] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [reassigning, setReassigning] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [reassignSuccess, setReassignSuccess] = useState('');
  const [promoteSuccess, setPromoteSuccess] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (err) {
      console.error('Error fetching users:', err);
      if (err.response?.status === 403) {
        setError('Access denied. Admin privileges required.');
      } else {
        setError('Failed to load users. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReassignClick = (user) => {
    setSelectedFromUser(user);
    setSelectedToUserId('');
    setShowReassignModal(true);
    setReassignSuccess('');
  };

  const handlePromoteClick = (user) => {
    setSelectedUser(user);
    setShowPromoteModal(true);
    setPromoteSuccess('');
  };

  const handleDemoteClick = (user) => {
    setSelectedUser(user);
    handleDemoteConfirm(user);
  };


  const handleReassignConfirm = async () => {
    if (!selectedToUserId) {
      alert('Please select a target user');
      return;
    }

    if (selectedFromUser.id === parseInt(selectedToUserId)) {
      alert('Cannot reassign to the same user');
      return;
    }

    const toUser = users.find(u => u.id === parseInt(selectedToUserId));
    const confirmMessage = `Are you sure you want to reassign ALL data from "${selectedFromUser.username}" to "${toUser.username}"?\n\nThis will transfer:\n- ${selectedFromUser.stats.companies} companies\n- ${selectedFromUser.stats.contacts} contacts\n- ${selectedFromUser.stats.outreach} outreach records\n- ${selectedFromUser.stats.campaigns} campaigns\n\nThis action cannot be undone.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setReassigning(true);
      setError('');
      await api.post('/admin/reassign-user-data', {
        fromUserId: selectedFromUser.id,
        toUserId: parseInt(selectedToUserId)
      });
      
      setReassignSuccess(`Successfully reassigned all data from ${selectedFromUser.username} to ${toUser.username}`);
      
      await fetchUsers();
      
      setTimeout(() => {
        setShowReassignModal(false);
        setReassignSuccess('');
      }, 2000);
    } catch (err) {
      console.error('Error reassigning data:', err);
      setError(err.response?.data?.error || 'Failed to reassign data. Please try again.');
    } finally {
      setReassigning(false);
    }
  };

  const handlePromoteConfirm = async () => {
    if (!window.confirm(`Are you sure you want to promote "${selectedUser.username}" to admin?\n\nThis will give them full administrative privileges.`)) {
      return;
    }

    try {
      setPromoting(true);
      setError('');
      await api.post('/admin/promote-user', {
        userId: selectedUser.id
      });
      
      setPromoteSuccess(`Successfully promoted ${selectedUser.username} to admin`);
      
      await fetchUsers();
      
      setTimeout(() => {
        setShowPromoteModal(false);
        setPromoteSuccess('');
      }, 2000);
    } catch (err) {
      console.error('Error promoting user:', err);
      setError(err.response?.data?.error || 'Failed to promote user. Please try again.');
    } finally {
      setPromoting(false);
    }
  };

  const handleDemoteConfirm = async (user) => {
    if (!window.confirm(`Are you sure you want to demote "${user.username}" from admin?\n\nThis will remove their administrative privileges.`)) {
      return;
    }

    try {
      setError('');
      await api.post('/admin/demote-user', {
        userId: user.id
      });
      
      alert(`Successfully demoted ${user.username} from admin`);
      await fetchUsers();
    } catch (err) {
      console.error('Error demoting user:', err);
      alert(err.response?.data?.error || 'Failed to demote user. Please try again.');
    }
  };


  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="container">
        <h2>User Management</h2>
        <p>Loading users...</p>
      </div>
    );
  }

  if (error && !showReassignModal && !showPromoteModal) {
    return (
      <div className="container">
        <h2>User Management</h2>
        <div style={{ 
          padding: '1rem', 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          borderRadius: '4px',
          marginBottom: '1rem'
        }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>User Management</h2>
        <button 
          onClick={fetchUsers}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🔄 Refresh
        </button>
      </div>

      <div style={{ 
        backgroundColor: '#e7f3ff', 
        padding: '1rem', 
        borderRadius: '4px',
        marginBottom: '1rem',
        border: '1px solid #b3d9ff'
      }}>
        <strong>ℹ️ Admin View:</strong> This page is only visible to administrators. 
        You can view all users, promote/demote admins, and reassign data between users.
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <strong>Total Users:</strong> {users.length} | <strong>Admins:</strong> {users.filter(u => u.is_admin).length}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          backgroundColor: 'white',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
              <th style={{ padding: '1rem', textAlign: 'left' }}>ID</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Username</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Email</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Role</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Data</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Created At</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr 
                key={user.id}
                style={{ 
                  borderBottom: '1px solid #dee2e6',
                  backgroundColor: user.is_admin ? '#fff3cd' : 'white'
                }}
              >
                <td style={{ padding: '1rem' }}>{user.id}</td>
                <td style={{ padding: '1rem', fontWeight: user.is_admin ? 'bold' : 'normal' }}>
                  {user.username}
                  {user.is_admin && <span style={{ marginLeft: '0.5rem' }}>👑</span>}
                </td>
                <td style={{ padding: '1rem' }}>{user.email || 'N/A'}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    backgroundColor: user.is_admin ? '#ffc107' : '#6c757d',
                    color: user.is_admin ? '#000' : '#fff'
                  }}>
                    {user.is_admin ? 'Admin' : 'User'}
                  </span>
                </td>
                <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                  {user.stats && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <span>🏢 {user.stats.companies} companies</span>
                      <span>👥 {user.stats.contacts} contacts</span>
                      <span>📧 {user.stats.outreach} outreach</span>
                      <span>📊 {user.stats.campaigns} campaigns</span>
                    </div>
                  )}
                </td>
                <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#6c757d' }}>
                  {formatDate(user.created_at)}
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {!user.is_admin ? (
                      <button
                        onClick={() => handlePromoteClick(user)}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: '500'
                        }}
                      >
                        ⬆️ Promote to Admin
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDemoteClick(user)}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: '#6c757d',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: '500'
                        }}
                      >
                        ⬇️ Demote from Admin
                      </button>
                    )}
                    {user.stats && (user.stats.companies > 0 || user.stats.contacts > 0 || user.stats.outreach > 0 || user.stats.campaigns > 0) && (
                      <button
                        onClick={() => handleReassignClick(user)}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: '#ffc107',
                          color: '#000',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: '500'
                        }}
                      >
                        🔄 Reassign Data
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '2rem',
          color: '#6c757d'
        }}>
          No users found.
        </div>
      )}

      {/* Promote Modal */}
      {showPromoteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h3 style={{ marginTop: 0 }}>Promote User to Admin</h3>
            
            {promoteSuccess ? (
              <div style={{
                padding: '1rem',
                backgroundColor: '#d4edda',
                color: '#155724',
                borderRadius: '4px',
                marginBottom: '1rem'
              }}>
                ✓ {promoteSuccess}
              </div>
            ) : (
              <>
                {error && (
                  <div style={{
                    padding: '1rem',
                    backgroundColor: '#f8d7da',
                    color: '#721c24',
                    borderRadius: '4px',
                    marginBottom: '1rem'
                  }}>
                    {error}
                  </div>
                )}

                <p>Are you sure you want to promote <strong>{selectedUser?.username}</strong> to admin?</p>
                
                <div style={{
                  backgroundColor: '#fff3cd',
                  padding: '1rem',
                  borderRadius: '4px',
                  marginBottom: '1.5rem',
                  border: '1px solid #ffc107'
                }}>
                  <strong>⚠️ Note:</strong> This will give the user full administrative privileges including the ability to manage other users.
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => {
                      setShowPromoteModal(false);
                      setError('');
                    }}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                    disabled={promoting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePromoteConfirm}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: promoting ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold',
                      opacity: promoting ? 0.6 : 1
                    }}
                    disabled={promoting}
                  >
                    {promoting ? 'Promoting...' : 'Confirm Promotion'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Reassign Modal */}
      {showReassignModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h3 style={{ marginTop: 0 }}>Reassign User Data</h3>
            
            {reassignSuccess ? (
              <div style={{
                padding: '1rem',
                backgroundColor: '#d4edda',
                color: '#155724',
                borderRadius: '4px',
                marginBottom: '1rem'
              }}>
                ✓ {reassignSuccess}
              </div>
            ) : (
              <>
                {error && (
                  <div style={{
                    padding: '1rem',
                    backgroundColor: '#f8d7da',
                    color: '#721c24',
                    borderRadius: '4px',
                    marginBottom: '1rem'
                  }}>
                    {error}
                  </div>
                )}

                <div style={{ marginBottom: '1.5rem' }}>
                  <p><strong>From User:</strong> {selectedFromUser?.username}</p>
                  <div style={{ 
                    backgroundColor: '#f8f9fa', 
                    padding: '1rem', 
                    borderRadius: '4px',
                    marginTop: '0.5rem'
                  }}>
                    <p style={{ margin: '0.25rem 0' }}>🏢 {selectedFromUser?.stats.companies} companies</p>
                    <p style={{ margin: '0.25rem 0' }}>👥 {selectedFromUser?.stats.contacts} contacts</p>
                    <p style={{ margin: '0.25rem 0' }}>📧 {selectedFromUser?.stats.outreach} outreach records</p>
                    <p style={{ margin: '0.25rem 0' }}>📊 {selectedFromUser?.stats.campaigns} campaigns</p>
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    To User:
                  </label>
                  <select
                    value={selectedToUserId}
                    onChange={(e) => setSelectedToUserId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: '4px',
                      border: '1px solid #ced4da'
                    }}
                    disabled={reassigning}
                  >
                    <option value="">Select a user...</option>
                    {users
                      .filter(u => u.id !== selectedFromUser?.id)
                      .map(u => (
                        <option key={u.id} value={u.id}>
                          {u.username} {u.is_admin ? '👑' : ''}
                        </option>
                      ))
                    }
                  </select>
                </div>

                <div style={{
                  backgroundColor: '#fff3cd',
                  padding: '1rem',
                  borderRadius: '4px',
                  marginBottom: '1.5rem',
                  border: '1px solid #ffc107'
                }}>
                  <strong>⚠️ Warning:</strong> This action will transfer ALL data from the source user to the target user. This cannot be undone.
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => {
                      setShowReassignModal(false);
                      setError('');
                    }}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                    disabled={reassigning}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReassignConfirm}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#ffc107',
                      color: '#000',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: reassigning ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold',
                      opacity: reassigning ? 0.6 : 1
                    }}
                    disabled={reassigning}
                  >
                    {reassigning ? 'Reassigning...' : 'Confirm Reassignment'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUsers;

// Made with Bob