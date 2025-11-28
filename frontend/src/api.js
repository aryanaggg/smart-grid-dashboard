import axios from 'axios';
const BASE = process.env.REACT_APP_API || 'http://localhost:4000';

export const api = axios.create({
  baseURL: BASE,
  timeout: 5000
});

export const getRealtime = () => api.get('/realtime').then(r=>r.data);
export const getPlantMetrics = (id, limit=200) => api.get(`/plants/${id}/metrics?limit=${limit}`).then(r=>r.data);
export const getAlerts = () => api.get('/alerts').then(r=>r.data);
export const getPlants = () => api.get('/plants').then(r=>r.data);
