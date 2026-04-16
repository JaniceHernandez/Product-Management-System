// src/__tests__/__mocks__/supabaseClient.js
import { vi } from 'vitest';

export const supabase = {
  auth: {
    signInWithOAuth:   vi.fn(),
    signOut:           vi.fn(),
    getSession:        vi.fn().mockResolvedValue({ data: { session: null } }),
    onAuthStateChange: vi.fn().mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    }),
  },
  from:       vi.fn().mockReturnThis(),
  select:     vi.fn().mockReturnThis(),
  eq:         vi.fn().mockReturnThis(),
  maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
};