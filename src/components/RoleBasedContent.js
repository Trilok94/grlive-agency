import React from 'react';
import { UserConstants, authService } from '../services/ParseService';

const RoleBasedContent = ({ roles, children }) => {
  const [hasRole, setHasRole] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const currentUser = authService.getCurrentUser();

  React.useEffect(() => {
    const checkRoles = async () => {
      try {
        if (!currentUser || !roles) {
          setHasRole(false);
          return;
        }

        // Get user's roles
        const userRoles = await authService.getUserRoles(currentUser);

        // Check if user has any of the required roles
        const hasRequiredRole = Array.isArray(roles)
          ? roles.some(role => userRoles.includes(role))
          : userRoles.includes(roles);

        setHasRole(hasRequiredRole);
      } catch (error) {
        console.error('Error checking roles:', error);
        setHasRole(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkRoles();
  }, [currentUser, roles]);

  // Show nothing while loading
  if (isLoading) {
    return null;
  }

  // Show content if user has required role(s)
  return hasRole ? children : null;
};

export default RoleBasedContent;
