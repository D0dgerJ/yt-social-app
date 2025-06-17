import { create } from 'zustand';

export interface User {
  id: number;
  username: string;
  email: string;
  profilePicture?: string;
  coverPicture?: string;
  isAdmin: boolean;
  from?: string;
  city?: string;
  relationship?: number;
  desc?: string;
}

interface UserStore {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  updateCurrentUser: (data: Partial<User>) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  currentUser: null,

  setCurrentUser: (user) => set({ currentUser: user }),

  updateCurrentUser: (data) =>
    set((state) => ({
      currentUser: state.currentUser ? { ...state.currentUser, ...data } : null,
    })),

  clearUser: () => set({ currentUser: null }),
}));
