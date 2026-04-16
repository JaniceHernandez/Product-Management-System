-- ============================================================
-- 004_seed_modules_and_rights.sql
-- Seed Module and rights reference data
-- ============================================================
-- Modules

INSERT INTO public.Module (Module_ID, description) VALUES

('Prod_Mod',   'Product Management Module'),

('Report_Mod', 'Reports Module'),

('Adm_Mod',    'Admin / User Management Module')

ON CONFLICT (Module_ID) DO NOTHING;


-- Rights (linked to their parent module)

INSERT INTO public.rights (Right_ID, Description, Module_ID) VALUES

('PRD_ADD',  'Add Product',                    'Prod_Mod'),

('PRD_EDIT', 'Edit Product',                   'Prod_Mod'),

('PRD_DEL',  'Soft Delete Product',            'Prod_Mod'),

('REP_001',  'Product Report Listing',         'Report_Mod'),

('REP_002',  'Top Selling Report',             'Report_Mod'),

('ADM_USER', 'Activate / Manage Users',        'Adm_Mod')

ON CONFLICT (Right_ID) DO NOTHING;