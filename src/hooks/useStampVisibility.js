// src/hooks/useStampVisibility.js

import { useAuth } from './useAuth';

export function useStampVisibility() {
  const { currentUser } = useAuth();
  const userType = currentUser?.user_type ?? 'USER';

  const isSuperAdmin = userType === 'SUPERADMIN';
  const isAdmin      = userType === 'ADMIN';
  const isAdminOrAbove = isSuperAdmin || isAdmin;

  return {
    // product table (ProductsPage, DeletedItemsPage)
    // Visible to: ADMIN and SUPERADMIN
    showProductStamp: isAdminOrAbove,

    // priceHist table (PriceHistoryPanel)
    // Visible to: ADMIN and SUPERADMIN
    showPriceHistStamp: isAdminOrAbove,

    // Deleted Items page (product table — INACTIVE rows)
    // Page is already role-gated to ADMIN/SUPERADMIN — stamp always shown here
    showDeletedItemsStamp: isAdminOrAbove,

    // user table (UserManagementPage)
    // Project guide Section 2.3: ADMIN sees stamp on product/priceHist ONLY.
    // Therefore ADMIN cannot see stamp on the user table.
    showUserStamp: isSuperAdmin,

    // Convenience — raw user type for any edge-case component logic
    userType,
    isSuperAdmin,
    isAdminOrAbove,
  };
}