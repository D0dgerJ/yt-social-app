import { clearAuthStorage } from '@/utils/authStorage';

export const logoutUser = (navigate: (path: string) => void) => {
  clearAuthStorage();
  navigate('/login');
};