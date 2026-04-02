import React from 'react';
import { useAuth } from '../../../context/AuthContext';

const RoleGuard = ({ allowedRoles, children, fallback = null }) => {
  const { hasRole } = useAuth();

  if (!hasRole(allowedRoles)) {
    return fallback;
  }

  return <>{children}</>;
};

export default RoleGuard;
