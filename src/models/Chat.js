import Parse from 'parse';
import { User } from './User';
import { Message } from './Message';

/**
 * Chat model for the messaging functionality
 * Based on the Flutter ChatModel implementation
 */
export class Chat extends Parse.Object {
  constructor() {
    super('Chat');
  }

  // Field keys
  static KEY_PARTICIPANTS = 'participants';
  static KEY_PARTICIPANTS_IDS = 'participantsIds';
  static KEY_LAST_MESSAGE = 'lastMessage';
  static KEY_LAST_MESSAGE_CALL = 'lastMessage.call';

  // Getters and setters
  get lastMessage() {
    return this.get(Chat.KEY_LAST_MESSAGE);
  }

  set lastMessage(message) {
    this.set(Chat.KEY_LAST_MESSAGE, message);
  }

  get participants() {
    return this.get(Chat.KEY_PARTICIPANTS);
  }

  get participantsIds() {
    return this.get(Chat.KEY_PARTICIPANTS_IDS);
  }

  set participants(userList) {
    // Ensure each participant is a User instance
    const validUsers = userList.filter(user => {
      if (!(user instanceof Parse.User)) {
        console.error('Invalid participant type. Only User or Parse.User instances are allowed.', user);
        return false;
      }
      return true;
    });
    
    if (validUsers.length !== userList.length) {
      console.warn(`Filtered out ${userList.length - validUsers.length} invalid participants that were not User instances`);
    }
    
    this.addAllUnique(Chat.KEY_PARTICIPANTS, validUsers);
    this.addAllUnique(Chat.KEY_PARTICIPANTS_IDS, validUsers.map(user => user.id));
  }

  /**
   * Check if a chat exists between users or create a new one
   * @param {Object} params - Parameters for the query
   * @param {User} params.user - The user to chat with
   * @param {User} params.currentUser - The current user
   * @param {Function} params.onChat - Callback when chat is found
   * @param {Function} params.onNewChat - Callback when new chat is created
   * @param {Function} params.onError - Callback when error occurs
   * @returns {Promise<void>}
   */
  static async checkOrCreateChat({
    user,
    currentUser,
    onChat,
    onNewChat,
    onError
  }) {
    try {
      const query = new Parse.Query(Chat);
      query.containsAll(Chat.KEY_PARTICIPANTS_IDS, [currentUser.id, user.id]);
      
      const results = await query.find();
      
      if (results.length > 0) {
        onChat && onChat(results[0]);
        return;
      } else {
        const chat = new Chat();
        chat.participants = [currentUser, user];
        
        const savedChat = await chat.save();
        if (savedChat) {
          onNewChat && onNewChat(savedChat);
        } else {
          onNewChat && onNewChat(null);
        }
      }
    } catch (error) {
      console.error('Error checking or creating chat:', error);
      onError && onError();
    }
  }
  
  /**
   * Get all chats for a user
   * @param {User} user - The user to get chats for
   * @param {Object} options - Query options
   * @param {number} options.limit - Maximum number of chats to retrieve
   * @param {number} options.skip - Number of chats to skip (for pagination)
   * @returns {Promise<Array>} - Array of Chat objects
   */
  static async getChatsForUser(user, { limit = 20, skip = 0 } = {}) {
    const query = new Parse.Query(Chat);
    query.containsAll(Chat.KEY_PARTICIPANTS_IDS, [user.id]);
    query.include(Chat.KEY_PARTICIPANTS);
    query.include(Chat.KEY_LAST_MESSAGE);
    query.descending('updatedAt');
    query.limit(limit);
    query.skip(skip);
    
    try {
      const results = await query.find();
      return results;
    } catch (error) {
      console.error('Error fetching chats:', error);
      throw error;
    }
  }
}

// Register the Chat subclass with Parse
Parse.Object.registerSubclass('Chat', Chat);
