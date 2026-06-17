import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { formatLocalDate } from '../utils/dateUtils';

function UserProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // Edit profile state
  const [editMode, setEditMode] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [currentPasswordForEdit, setCurrentPasswordForEdit] = useState('');

  // Change password state
  const [changePasswordMode, setChangePasswordMode] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Delete account state
  const [deleteMode, setDeleteMode] = useState(false);
  const [currentPasswordForDelete, setCurrentPasswordForDelete] = useState('');
  const [confirmDelete, setConfirmDelete] = useState('');

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/profile');
      setUser(response.data);
      setUsername(response.data.username);
      setEmail(response.data.email || '');
    } catch (err) {
      setError('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentPasswordForEdit) {
      setError('Current password is required to update profile');
      return;
    }

    try {
      const response = await api.put('/auth/profile', {
        currentPassword: currentPasswordForEdit,
        username,
        email
      });

      setUser(response.data.user);
      setSuccess('Profile updated successfully');
      setEditMode(false);
      setCurrentPasswordForEdit('');
      
      // Update stored user data
      localStorage.setItem('user', JSON.stringify(response.data.user));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmNewPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword
      });

      setSuccess('Password changed successfully');
      setChangePasswordMode(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change password');
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (confirmDelete !== 'DELETE') {
      setError('Please type DELETE to confirm account deletion');
      return;
    }

    if (!currentPasswordForDelete) {
      setError('Current password is required to delete account');
      return;
    }

    try {
      await api.delete('/auth/account', {
        data: { currentPassword: currentPasswordForDelete }
      });

      // Clear local storage and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete account');
    }
  };

  const cancelEdit = () => {
    setEditMode(false);
    setUsername(user.username);
    setEmail(user.email || '');
    setCurrentPasswordForEdit('');
    setError('');
  };

  const cancelChangePassword = () => {
    setChangePasswordMode(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setError('');
  };

  const cancelDelete = () => {
    setDeleteMode(false);
    setCurrentPasswordForDelete('');
    setConfirmDelete('');
    setError('');
  };

  if (loading) {
    return <div className="container"><p>Loading...</p></div>;
  }

  return (
    <div className="container">
      <h2>User Profile</h2>

      {error && (
        <div style={{
          backgroundColor: '#fee',
          color: '#c33',
          padding: '0.75rem',
          borderRadius: '4px',
          marginBottom: '1rem',
          border: '1px solid #fcc'
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          backgroundColor: '#efe',
          color: '#3c3',
          padding: '0.75rem',
          borderRadius: '4px',
          marginBottom: '1rem',
          border: '1px solid #cfc'
        }}>
          {success}
        </div>
      )}

      {/* Profile Information */}
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        marginBottom: '1.5rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h3>Profile Information</h3>
        
        {!editMode ? (
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Username:</strong> {user?.username}
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Email:</strong> {user?.email || 'Not set'}
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Member since:</strong> {formatLocalDate(user?.created_at)}
            </div>
            <button
              onClick={() => setEditMode(true)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Edit Profile
            </button>
          </div>
        ) : (
          <form onSubmit={handleUpdateProfile}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Current Password *
              </label>
              <input
                type="password"
                value={currentPasswordForEdit}
                onChange={(e) => setCurrentPasswordForEdit(e.target.value)}
                required
                placeholder="Enter your current password to confirm changes"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="submit"
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Change Password */}
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        marginBottom: '1.5rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h3>Change Password</h3>
        
        {!changePasswordMode ? (
          <button
            onClick={() => setChangePasswordMode(true)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Change Password
          </button>
        ) : (
          <form onSubmit={handleChangePassword}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Current Password *
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                New Password *
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
              <small style={{ color: '#666' }}>Must be at least 6 characters</small>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Confirm New Password *
              </label>
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="submit"
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Change Password
              </button>
              <button
                type="button"
                onClick={cancelChangePassword}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Delete Account */}
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        border: '2px solid #dc3545'
      }}>
        <h3 style={{ color: '#dc3545' }}>Danger Zone</h3>
        <p style={{ color: '#666', marginBottom: '1rem' }}>
          Once you delete your account, there is no going back. All your data will be permanently deleted.
        </p>
        
        {!deleteMode ? (
          <button
            onClick={() => setDeleteMode(true)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Delete Account
          </button>
        ) : (
          <form onSubmit={handleDeleteAccount}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Type DELETE to confirm
              </label>
              <input
                type="text"
                value={confirmDelete}
                onChange={(e) => setConfirmDelete(e.target.value)}
                required
                placeholder="DELETE"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Current Password *
              </label>
              <input
                type="password"
                value={currentPasswordForDelete}
                onChange={(e) => setCurrentPasswordForDelete(e.target.value)}
                required
                placeholder="Enter your password to confirm deletion"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="submit"
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Permanently Delete Account
              </button>
              <button
                type="button"
                onClick={cancelDelete}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default UserProfile;

// Made with Bob
