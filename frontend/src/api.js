import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 responses (unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, clear storage and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Companies
export const getCompanies = () => api.get('/companies');
export const getCompany = (id) => api.get(`/companies/${id}`);
export const createCompany = (data) => api.post('/companies', data);
export const updateCompany = (id, data) => api.put(`/companies/${id}`, data);
export const deleteCompany = (id) => api.delete(`/companies/${id}`);

// Contacts
export const getContacts = () => api.get('/contacts');
export const getContact = (id) => api.get(`/contacts/${id}`);
export const getContactsByCompany = (companyId) => api.get(`/companies/${companyId}/contacts`);
export const createContact = (data) => api.post('/contacts', data);
export const updateContact = (id, data) => api.put(`/contacts/${id}`, data);
export const deleteContact = (id) => api.delete(`/contacts/${id}`);

// Contact Relationships
export const getContactRelationships = (contactId) => api.get(`/contacts/${contactId}/relationships`);
export const createContactRelationship = (contactId, data) => api.post(`/contacts/${contactId}/relationships`, data);
export const deleteContactRelationship = (id) => api.delete(`/relationships/${id}`);

// Outreach History
export const getAllOutreach = () => api.get('/outreach');
export const getContactOutreach = (contactId) => api.get(`/contacts/${contactId}/outreach`);
export const createOutreach = (contactId, data) => api.post(`/contacts/${contactId}/outreach`, data);
export const updateOutreach = (id, data) => api.put(`/outreach/${id}`, data);
export const deleteOutreach = (id) => api.delete(`/outreach/${id}`);

export default api;

// Made with Bob
