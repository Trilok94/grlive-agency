import Parse from 'parse';
import SystemMessage from '../models/SystemMessage';

export const systemMessageService = {
  /**
   * Checks for pending agency invitations for the current user
   * @param {Parse.User} user - The current user
   * @returns {Promise<SystemMessage|null>} - The pending invitation or null if none exists
   */
  async checkPendingAgencyInvitation(user) {
    if (!user) {
      throw new Error('User is required');
    }

    const query = new Parse.Query(SystemMessage.className);
    
    // Set query constraints
    query.equalTo(SystemMessage.keys.MESSAGE_TYPE, SystemMessage.systemMessageType.HOST_ADDED_AGENCY);
    query.equalTo(SystemMessage.keys.MESSAGE_STATUS, SystemMessage.systemMessageStatus.PENDING);
    query.equalTo(SystemMessage.keys.RECEIVER_ID, user.id);
    query.doesNotExist(SystemMessage.keys.RELATED_MESSAGE);
    query.exists(SystemMessage.keys.AGENT);
    
    // Include related objects
    query.include(SystemMessage.keys.AGENT);
    query.include(SystemMessage.keys.INVITATION);
    query.include(SystemMessage.keys.AUTHOR);
    
    try {
      const result = await query.first();
      return result || null;
    } catch (error) {
      console.error('Error checking pending agency invitation:', error);
      throw error;
    }
  },

  /**
   * Process an agency invitation request (accept or reject)
   * @param {string} messageId - The ID of the system message
   * @param {string} action - The action to take (accept or reject)
   * @returns {Promise<Parse.Object>} - The updated system message
   */
  async processAgencyInvitation(messageId, action) {
    if (!messageId) {
      throw new Error('Message ID is required');
    }
    
    if (action !== SystemMessage.systemMessageStatus.ACCEPTED && action !== SystemMessage.systemMessageStatus.REJECTED) {
      throw new Error('Action must be either "accept" or "reject"');
    }
    
    const params = {
      requestId: messageId,
      action: action
    };
    
    try {
      const result = await Parse.Cloud.run('process_agency_request', params);
      return result;
    } catch (error) {
      console.error('Error processing agency invitation:', error);
      throw error;
    }
  }
};
