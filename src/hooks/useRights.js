// src/hooks/useRights.js
// Re-exports useRights from UserRightsContext for consistent import paths.
// Components import from hooks/ not context/ for cleaner paths.
//
// Usage:
//   import { useRights } from '../hooks/useRights';
//   const { canAdd, canDelete, rights } = useRights();
export { useRights } from '../context/UserRightsContext';