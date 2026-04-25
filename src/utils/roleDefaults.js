// src/utils/roleDefaults.js
// Canonical default rights per user_type per project guide Section 2.2.
// Used by changeUserRole() to reset UserModule_Rights on role change.
// Used by ChangeRoleModal to display what rights the new role will grant.

export const ROLE_RIGHTS_DEFAULTS = {
  ADMIN: {
    PRD_ADD:  1,
    PRD_EDIT: 1,
    PRD_DEL:  0,
    REP_001:  1,
    REP_002:  0,
    ADM_USER: 0,
  },
  USER: {
    PRD_ADD:  1,
    PRD_EDIT: 1,
    PRD_DEL:  0,
    REP_001:  1,
    REP_002:  0,
    ADM_USER: 0,
  },
};

export const ROLE_MODULE_DEFAULTS = {
  ADMIN: { Prod_Mod: 1, Report_Mod: 1, Adm_Mod: 0 },
  USER:  { Prod_Mod: 1, Report_Mod: 1, Adm_Mod: 0 },
};

// Human-readable labels for each right_id
export const RIGHT_LABELS = {
  PRD_ADD:  'Add Product',
  PRD_EDIT: 'Edit Product',
  PRD_DEL:  'Delete Product',
  REP_001:  'Product Report',
  REP_002:  'Top Selling Report',
  ADM_USER: 'Manage Users',
};