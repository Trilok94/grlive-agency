import Parse from 'parse';


// Initialize Parse
export const initializeParse = (appId, serverURL, javascriptKey) => {
  try {
    Parse.initialize(appId, javascriptKey);
    Parse.serverURL = serverURL;
    
    // Enable local datastore to ensure proper storage initialization
    Parse.enableLocalDatastore();
    
    console.log('Parse initialized successfully');
  } catch (error) {
    console.error('Parse initialization error:', error);
  }
};

// User model constants adapted from Dart UserModel
export const UserConstants = {
  // User roles
  ROLE_HOST: 'host',
  ROLE_AGENT: 'agent',
  ROLE_USER: 'user',
  ROLE_ADMIN: 'admin',

  // User fields
  KEY_ROLE: 'role',
  KEY_USERNAME: 'username',
  KEY_EMAIL: 'email',
  KEY_EMAIL_VERIFIED: 'emailVerified',
  KEY_FULL_NAME: 'name',
  KEY_FIRST_NAME: 'first_name',
  KEY_LAST_NAME: 'last_name',
  KEY_AVATAR: 'avatar',
  KEY_AVATAR_FILE: 'avatar_file',
  KEY_PHONE_NUMBER: 'phone_number',
  KEY_COUNTRY_DIAL_CODE: 'country_dial_code',
  
  // Agency related fields
  KEY_AGENT: 'agent',
  KEY_AGENT_ID: 'agentId',
  KEY_AGENCY: 'agency',
  KEY_AGENCY_ID: 'agencyId',
  KEY_HOST: 'host',
  KEY_HOST_ID: 'hostId',
};

// Authentication methods
export const authService = {
  // Authenticate with session token
  loginWithSessionToken: async (sessionToken) => {
    try {
      // Try to authenticate with the session token
      const user = await Parse.User.become(sessionToken);
      return user;
    } catch (error) {
      console.error('Session token authentication error:', error);
      throw error;
    }
  },
  // Login with username/email and password
  login: async (username, password) => {
    try {
      const user = await Parse.User.logIn(username, password);
      return user;
    } catch (error) {
      throw error;
    }
  },

  // Logout current user
  logout: async () => {
    try {
      await Parse.User.logOut();
      // Clear any stored data
      localStorage.clear();
      sessionStorage.clear();
      // Replace current history with welcome page to prevent going back
      window.history.replaceState(null, '', '/welcome');
      // Force page refresh to clear all states
      window.location.reload();
      return true;
    } catch (error) {
      // Even if there's an error, try to clear everything
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
      throw error;
    }
  },

  // Get current user
  getCurrentUser: () => {
    try {
      const currentUser = Parse.User.current();
      
      // If there's no user logged in, just return null
      if (!currentUser) return null;
      
      // Check if the user object is properly initialized as Parse.User instance
      if (!(currentUser instanceof Parse.User)) {
        console.warn('User object is not a Parse.User instance, attempting to resolve...');
        
        // Try to restore proper Parse.User functionality
        // This can happen with social logins or when restoring from cache/session
        if (currentUser.id || currentUser.objectId) {
          try {
            // Create a proper Parse.User instance with the stored object ID
            const userId = currentUser.id || currentUser.objectId;
            const userQuery = new Parse.Query(Parse.User);
            // Use become to convert to a proper User instance using session token
            if (currentUser.getSessionToken && typeof currentUser.getSessionToken === 'function') {
              return Parse.User.become(currentUser.getSessionToken());
            }
            // Fallback to a regular query
            return userQuery.get(userId);
          } catch (fetchError) {
            console.error('Error fetching user instance:', fetchError);
            // Return what we have, even if it's not perfect
            return currentUser;
          }
        }
      }
      
      return currentUser;
    } catch (error) {
      console.error('Error in getCurrentUser:', error);
      return null;
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return Parse.User.current() !== null;
  },

  // Request password reset
  requestPasswordReset: async (email) => {
    try {
      await Parse.User.requestPasswordReset(email);
      return true;
    } catch (error) {
      throw error;
    }
  },

  // Get user roles
  getUserRoles: async (user) => {
    if (!user) return [];
    try {
      const rolesQuery = new Parse.Query(Parse.Role);
      rolesQuery.equalTo('users', user);
      const roles = await rolesQuery.find();
      return roles.map(role => role.getName());
    } catch (error) {
      if (error.code === 209 || error.code === 101) {
        // Invalid session token or user not found, log out the user
        console.warn('Invalid session token or user not found, logging out...');
        await authService.logout();
        return [];
      }
      console.error('Error getting user roles:', error);
      return [];
    }
  },

  // Check if user has a specific role
  hasRole: async (user, roleName) => {
    if (!user) return false;
    try {
      const roleQuery = new Parse.Query(Parse.Role);
      roleQuery.equalTo('name', roleName);
      roleQuery.equalTo('users', user);
      const role = await roleQuery.first();
      return !!role;
    } catch (error) {
      console.error(`Error checking if user has role ${roleName}:`, error);
      return false;
    }
  },

  // Check if user is an agent
  isAgent: async (user) => {
    return await authService.hasRole(user, UserConstants.ROLE_AGENT);
  },

  // Check if user is an admin
  isAdmin: async (user) => {
    return await authService.hasRole(user, UserConstants.ROLE_ADMIN);
  },

  // Check if user is a host
  isHost: async (user) => {
    return await authService.hasRole(user, UserConstants.ROLE_HOST);
  },
};

// User management methods
export const userService = {
  // Get user by ID
  getUserById: async (userId) => {
    try {
      const query = new Parse.Query(Parse.User);
      const user = await query.get(userId);
      return user;
    } catch (error) {
      throw error;
    }
  },

  // Get user profile data
  getUserProfile: async (userId) => {
    try {
      const query = new Parse.Query(Parse.User);
      const user = await query.get(userId);
      
      return {
        id: user.id,
        username: user.get(UserConstants.KEY_USERNAME),
        email: user.get(UserConstants.KEY_EMAIL),
        fullName: user.get(UserConstants.KEY_FULL_NAME),
        firstName: user.get(UserConstants.KEY_FIRST_NAME),
        lastName: user.get(UserConstants.KEY_LAST_NAME),
        role: user.get(UserConstants.KEY_ROLE),
        avatar: user.get(UserConstants.KEY_AVATAR_FILE) ? user.get(UserConstants.KEY_AVATAR_FILE).url() : null,
      };
    } catch (error) {
      throw error;
    }
  },

  // Update user profile
  updateUserProfile: async (userId, profileData) => {
    try {
      const user = await userService.getUserById(userId);
      
      // Update user fields
      Object.keys(profileData).forEach(key => {
        user.set(key, profileData[key]);
      });
      
      await user.save();
      return user;
    } catch (error) {
      throw error;
    }
  },
};

const ParseService = {
  initializeParse,
  authService,
  userService,
  UserConstants,
};

export default ParseService;
