// src/__tests__/__mocks__/AuthContext.js
import { vi } from 'vitest';

export const mockAuthValue = {
  session:       null,
  currentUser:   null,
  loading:       false,
  authError:     '',
  setAuthError:  vi.fn(),
  signOut:       vi.fn(),
  refetchProfile: vi.fn(),
};

export const useAuth = vi.fn(() => mockAuthValue);