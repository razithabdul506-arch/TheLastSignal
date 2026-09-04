import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: (email, name, password) =>
    client.post('/auth/register', { email, name, password }),
  login: (email, password) =>
    client.post('/auth/login', { email, password })
};

export const eventAPI = {
  getActive: () => client.get('/event/active'),
  register: (event_id, participant_name) =>
    client.post('/event/register', { event_id, participant_name }),
  getStatus: () => client.get('/event/status')
};

export const evidenceAPI = {
  getAll: () => client.get('/evidence'),
  getById: (id) => client.get(`/evidence/${id}`),
  discover: (id) => client.post(`/evidence/${id}/discover`),
  getTimeline: () => client.get('/evidence/timeline/events')
};

export const chatAPI = {
  sendMessage: (message) => client.post('/chat/message', { message }),
  getHistory: () => client.get('/chat/history')
};

export const scoreAPI = {
  submitFinal: (defense_text, accused_person, causal_chain) =>
    client.post('/score/submit-final', { defense_text, accused_person, causal_chain }),
  getCurrent: () => client.get('/score/current'),
  getLeaderboard: () => client.get('/score/leaderboard')
};

export const adminAPI = {
  getEvents: () => client.get('/admin/events'),
  getEventDetails: (id) => client.get(`/admin/events/${id}`),
  getEventParticipants: (id) => client.get(`/admin/events/${id}/participants`),
  getParticipantDetails: (id) => client.get(`/admin/participants/${id}`),
  getEventOverview: (id) => client.get(`/admin/events/${id}/overview`),
  deleteParticipant: (id) => client.delete(`/admin/participants/${id}`)
};

export default client;
