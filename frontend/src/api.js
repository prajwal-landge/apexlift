const API_BASE = '/api';

export function getToken() {
  return localStorage.getItem('apexlift_token');
}

export function setToken(token) {
  if (token) {
    localStorage.setItem('apexlift_token', token);
  } else {
    localStorage.removeItem('apexlift_token');
  }
}

export function getCurrentUser() {
  const u = localStorage.getItem('apexlift_user');
  try {
    return u ? JSON.parse(u) : null;
  } catch (e) {
    return null;
  }
}

export function setCurrentUser(user) {
  if (user) {
    localStorage.setItem('apexlift_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('apexlift_user');
  }
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (response.status === 401) {
    setToken(null);
    setCurrentUser(null);
    window.dispatchEvent(new Event('auth:unauthorized'));
    throw new Error('Session expired. Please log in again.');
  }

  if (!response.ok) {
    let errorDetail = 'Request failed';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errJson.message || errorDetail;
    } catch (_) {
      errorDetail = response.statusText;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  // Auth
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  loginDemo: () => request('/auth/demo', { method: 'POST' }),
  getMe: () => request('/auth/me'),

  // Dashboard
  getDashboard: () => request('/dashboard'),

  // Workouts
  getExercises: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/workouts/exercises${q ? `?${q}` : ''}`);
  },
  logWorkout: (data) => request('/workouts', { method: 'POST', body: JSON.stringify(data) }),
  getRecentWorkouts: (limit = 10) => request(`/workouts/recent?limit=${limit}`),
  getAllPRs: () => request('/workouts/prs'),

  // Quests
  getQuests: () => request('/quests'),
  claimQuest: (id) => request(`/quests/${id}/claim`, { method: 'POST' }),

  // Programs / Plans
  getPrograms: () => request('/programs'),
  selectProgram: (id) => request(`/programs/${id}/select`, { method: 'POST' }),

  // Progress
  getProgressSummary: (range = '4w', exerciseId = '') => {
    let url = `/progress/summary?range_type=${range}`;
    if (exerciseId) url += `&exercise_id=${exerciseId}`;
    return request(url);
  },

  // League & Friends
  getLeagueStandings: (tier = 'Diamond') => request(`/league?tier=${tier}`),
  getFriends: () => request('/league/friends'),
  addFriend: (username) => request('/league/friends/add', { method: 'POST', body: JSON.stringify({ username }) }),

  // Settings & Checkin
  getSettings: () => request('/settings'),
  updateSettings: (data) => request('/settings', { method: 'PATCH', body: JSON.stringify(data) }),
  logCheckin: (energyState, sleepHours = 7.5, notes = '') => request('/checkins', {
    method: 'POST',
    body: JSON.stringify({ energy_state: energyState, sleep_hours: sleepHours, notes })
  })
};
