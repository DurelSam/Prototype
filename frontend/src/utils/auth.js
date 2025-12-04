// Utilitaires d'authentification

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('authToken', token);
  } else {
    localStorage.removeItem('authToken');
  }
};

export const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

export const removeAuthToken = () => {
  localStorage.removeItem('authToken');
};

export const isAuthenticated = () => {
  return !!getAuthToken();
};

export const setUserData = (userData) => {
  localStorage.setItem('userData', JSON.stringify(userData));
};

export const getUserData = () => {
  const data = localStorage.getItem('userData');
  return data ? JSON.parse(data) : null;
};

export const removeUserData = () => {
  localStorage.removeItem('userData');
};

export const logout = () => {
  removeAuthToken();
  removeUserData();
  window.location.href = '/login';
};

export const getUserRole = () => {
  const userData = getUserData();
  return userData?.role || null;
};

export const isAdmin = () => {
  return getUserRole() === 'Admin';
};

export const isManager = () => {
  const role = getUserRole();
  return role === 'Manager' || role === 'Admin';
};

export const isEmployee = () => {
  return getUserRole() === 'Employee';
};
