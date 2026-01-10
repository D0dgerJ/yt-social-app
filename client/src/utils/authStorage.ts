import type { User } from '@/stores/userStore';

const USER_KEY = 'user';

export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function getToken(): string | undefined {
  return getStoredUser()?.token;
}

export function setStoredUser(user: User | null) {
  if (!user) localStorage.removeItem(USER_KEY);
  else localStorage.setItem(USER_KEY, JSON.stringify(user));

  window.dispatchEvent(new Event('token:changed'));
}

export function clearAuthStorage() {
  localStorage.removeItem(USER_KEY);

  localStorage.removeItem('token');
  localStorage.removeItem('accessToken');

  window.dispatchEvent(new Event('token:changed'));
}