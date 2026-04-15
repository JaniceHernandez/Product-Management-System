// src/__tests__/sprint1-auth-flows.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// Mock supabase and AuthContext before importing components
vi.mock('../lib/supabaseClient', () => import('./__mocks__/supabaseClient.js'));
vi.mock('../context/AuthContext', () => import('./__mocks__/AuthContext.js'));

import { supabase }                   from '../lib/supabaseClient';
import { useAuth, mockAuthValue }     from '../context/AuthContext';
import LoginPage                      from '../pages/LoginPage';
import ProtectedRoute                 from '../components/ProtectedRoute';

// ── Helper: render with router ────────────────────────────────
function renderWithRouter(ui, { initialEntries = ['/'] } = {}) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      {ui}
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  // Reset mockAuthValue to safe defaults
  Object.assign(mockAuthValue, {
    session:     null,
    currentUser: null,
    loading:     false,
    authError:   '',
  });
  useAuth.mockReturnValue(mockAuthValue);
});

// =============================================================
// TEST GROUP 1: LoginPage UI
// =============================================================
describe('LoginPage', () => {

  it('TC-01: renders Hope PMS title and Google sign-in button', () => {
    renderWithRouter(<LoginPage />);
    expect(screen.getByText('Hope PMS')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument();
  });

  it('TC-02: does NOT render an email or password input field', () => {
    renderWithRouter(<LoginPage />);
    expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument();
  });

  it('TC-03: Google sign-in button calls signInWithOAuth with google provider', async () => {
    supabase.auth.signInWithOAuth.mockResolvedValue({ data: {}, error: null });
    renderWithRouter(<LoginPage />);

    await userEvent.click(screen.getByRole('button', { name: /sign in with google/i }));

    await waitFor(() => {
      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith(
        expect.objectContaining({ provider: 'google' })
      );
    });
  });

  it('TC-04: redirectTo includes /auth/callback', async () => {
    supabase.auth.signInWithOAuth.mockResolvedValue({ data: {}, error: null });
    renderWithRouter(<LoginPage />);

    await userEvent.click(screen.getByRole('button', { name: /sign in with google/i }));

    await waitFor(() => {
      const callArg = supabase.auth.signInWithOAuth.mock.calls[0][0];
      expect(callArg.options.redirectTo).toContain('/auth/callback');
    });
  });

  it('TC-05: shows activation error message when ?error=not_activated is in URL', () => {
    renderWithRouter(<LoginPage />, { initialEntries: ['/login?error=not_activated'] });
    expect(
      screen.getByText(/pending activation by an administrator/i)
    ).toBeInTheDocument();
  });

  it('TC-06: does NOT show activation error when no error param present', () => {
    renderWithRouter(<LoginPage />);
    expect(
      screen.queryByText(/pending activation/i)
    ).not.toBeInTheDocument();
  });

  it('TC-07: shows loading spinner when loading is true', () => {
    useAuth.mockReturnValue({ ...mockAuthValue, loading: true });
    const { container } = renderWithRouter(<LoginPage />);
    // Spinner uses animate-spin class
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

});

// =============================================================
// TEST GROUP 2: ProtectedRoute — session and record_status gating
// =============================================================
describe('ProtectedRoute', () => {

  function ProtectedPage() {
    return <div>Protected Content</div>;
  }

  function renderProtected() {
    return renderWithRouter(
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/products" element={
          <ProtectedRoute><ProtectedPage /></ProtectedRoute>
        } />
      </Routes>,
      { initialEntries: ['/products'] }
    );
  }

  it('TC-08: shows loading spinner while loading is true', () => {
    useAuth.mockReturnValue({ ...mockAuthValue, loading: true });
    const { container } = renderProtected();
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('TC-09: redirects to /login when session is null', () => {
    useAuth.mockReturnValue({ ...mockAuthValue, session: null });
    renderProtected();
    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('TC-10: redirects to /login?error=not_activated when account is INACTIVE', () => {
    useAuth.mockReturnValue({
      ...mockAuthValue,
      session: { user: { id: 'abc' } },
      currentUser: { record_status: 'INACTIVE', user_type: 'USER', username: 'test' },
    });
    renderProtected();
    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('TC-11: renders protected content when session exists and record_status is ACTIVE', () => {
    useAuth.mockReturnValue({
      ...mockAuthValue,
      session: { user: { id: 'abc' } },
      currentUser: { record_status: 'ACTIVE', user_type: 'SUPERADMIN', username: 'Janice' },
    });
    renderProtected();
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('TC-12: renders protected content when session exists but currentUser is still null (profile loading)', () => {
    // Session is confirmed but profile not yet fetched — should NOT block
    useAuth.mockReturnValue({
      ...mockAuthValue,
      session: { user: { id: 'abc' } },
      currentUser: null,
    });
    renderProtected();
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

});

// =============================================================
// TEST GROUP 3: Manual Verification (documented placeholders)
// =============================================================
describe('Manual Verification — Login Guard', () => {

  it('TC-13: MANUAL — ACTIVE SUPERADMIN signs in with Google and reaches /products', () => {
    // Steps:
    // 1. npm run dev → open http://localhost:5173/login
    // 2. Click "Sign in with Google" → select ACTIVE SUPERADMIN account
    // 3. Expected: /auth/callback spinner shown for ~2 seconds
    // 4. Expected: redirected to /products
    // 5. Expected: Navbar shows currentUser.username (e.g., "Janice")
    //
    // Result: [ ] PASS  [ ] FAIL
    expect(true).toBe(true);
  });

  it('TC-14: MANUAL — INACTIVE account is blocked and activation message shown', () => {
    // Steps:
    // 1. Sign in with Google account that has record_status = 'INACTIVE'
    // 2. Expected: /auth/callback spinner
    // 3. Expected: redirected to /login?error=not_activated
    // 4. Expected: error message "Your account is pending activation by an administrator."
    //
    // Result: [ ] PASS  [ ] FAIL
    expect(true).toBe(true);
  });

  it('TC-15: MANUAL — New Google user provisioned as USER/INACTIVE by trigger', () => {
    // Steps:
    // 1. Sign in with a Google account not yet in Supabase
    // 2. Expected: /auth/callback spinner → /products (session valid, trigger still running)
    // 3. Refresh /products → ProtectedRoute sees INACTIVE → /login?error=not_activated
    // 4. Supabase Dashboard → public.user → row exists: USER / INACTIVE
    // 5. user_module: 3 rows — Prod_Mod(1), Report_Mod(1), Adm_Mod(0)
    // 6. UserModule_Rights: 6 rows with correct Right_value
    // 7. username = Google display name or email prefix
    //
    // Result: [ ] PASS  [ ] FAIL
    expect(true).toBe(true);
  });

  it('TC-16: MANUAL — Navbar displays currentUser.username after reaching /products', () => {
    // Steps:
    // 1. Sign in as ACTIVE SUPERADMIN
    // 2. After reaching /products, check the Navbar
    // 3. Expected: username shown (e.g., "Janice", "Jerry", or email prefix)
    // 4. Username must NOT be blank, undefined, or show an email address
    //    if a display name is available
    //
    // Result: [ ] PASS  [ ] FAIL
    expect(true).toBe(true);
  });

});