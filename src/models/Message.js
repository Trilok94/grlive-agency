import Parse from 'parse';
import { User } from './User';

/**
 * Message model for the chat functionality
 * Based on the Flutter MessageModel implementation
 */
export class Message extends Parse.Object {
  constructor() {
    super('Message');
  }

  // Message types constants
  static MESSAGE_TYPE_TEXT = 'text';
  static MESSAGE_TYPE_IMAGE = 'image';
  static MESSAGE_TYPE_VIDEO = 'video';
  static MESSAGE_TYPE_GIF = 'gif';
  static MESSAGE_TYPE_GIFT = 'gift';
  static MESSAGE_TYPE_VOICE = 'voice';
  static MESSAGE_TYPE_VIDEO_CALL = 'videoCall';
  static MESSAGE_TYPE_VOICE_CALL = 'voiceCall';
  static MESSAGE_TYPE_PRIVATE_LIVE = 'privateLive';

  // Field keys
  static KEY_IS_PREMIUM = 'isPremium';
  static KEY_PREMIUM_USER_IDS = 'premiumUserIds';
  static KEY_MESSAGE_TYPE = 'type';
  static KEY_CHAT_ID = 'chatId';
  static KEY_READ = 'read';
  static KEY_SENDER = 'sender';
  static KEY_SENDER_ID = 'senderId';
  static KEY_PARTICIPANTS = 'participants';
  static KEY_PARTICIPANTS_IDS = 'participantsIds';
  static KEY_TEXT_MESSAGE = 'message';
  static KEY_MEDIA_FILE = 'media';
  static KEY_MEDIA_FILE_THUMB = 'thumb';
  static KEY_GIFT = 'gift';
  static KEY_DURATION = 'duration';
  static KEY_SIZE = 'size';
  static KEY_CALL = 'call';
  static KEY_STREAM = 'stream';
  static KEY_DELETED_BY = 'deletedBy';
  static KEY_LIVE_ONGOING = 'liveOnGoing';
  static KEY_LIVE_START_TIME = 'liveStartTime';
  static KEY_LIVE_END_TIME = 'liveEndTime';
  static KEY_LIVE_DURATION = 'liveDuration';

  // Getters and setters
  get sender() {
    return this.get(Message.KEY_SENDER);
  }

  set sender(user) {
    this.set(Message.KEY_SENDER, user);
    this.set(Message.KEY_SENDER_ID, user.id);
  }

  get senderId() {
    return this.get(Message.KEY_SENDER_ID);
  }

  get message() {
    return this.get(Message.KEY_TEXT_MESSAGE) || '';
  }

  set message(text) {
    this.set(Message.KEY_TEXT_MESSAGE, text);
  }

  get type() {
    return this.get(Message.KEY_MESSAGE_TYPE);
  }

  set type(messageType) {
    this.set(Message.KEY_MESSAGE_TYPE, messageType);
  }

  get mediaFile() {
    return this.get(Message.KEY_MEDIA_FILE);
  }

  set mediaFile(file) {
    this.set(Message.KEY_MEDIA_FILE, file);
  }

  get thumbFile() {
    return this.get(Message.KEY_MEDIA_FILE_THUMB);
  }

  set thumbFile(file) {
    this.set(Message.KEY_MEDIA_FILE_THUMB, file);
  }

  get gift() {
    return this.get(Message.KEY_GIFT);
  }

  set gift(giftObj) {
    this.set(Message.KEY_GIFT, giftObj);
  }

  get stream() {
    return this.get(Message.KEY_STREAM);
  }

  set stream(streamObj) {
    this.set(Message.KEY_STREAM, streamObj);
  }

  get chatId() {
    return this.get(Message.KEY_CHAT_ID);
  }

  set chatId(id) {
    this.set(Message.KEY_CHAT_ID, id);
  }

  get isRead() {
    return this.get(Message.KEY_READ) || false;
  }

  set isRead(read) {
    this.set(Message.KEY_READ, read);
  }

  get isPremium() {
    return this.get(Message.KEY_IS_PREMIUM) || false;
  }

  set isPremium(premium) {
    this.set(Message.KEY_IS_PREMIUM, premium);
  }

  get mediaDuration() {
    return this.get(Message.KEY_DURATION) || 0;
  }

  set mediaDuration(duration) {
    this.set(Message.KEY_DURATION, duration);
  }

  get mediaSize() {
    return this.get(Message.KEY_SIZE);
  }

  set mediaSize(size) {
    this.set(Message.KEY_SIZE, size);
  }

  get participants() {
    return this.get(Message.KEY_PARTICIPANTS);
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
    
    this.addAllUnique(Message.KEY_PARTICIPANTS, validUsers);
    this.addAllUnique(Message.KEY_PARTICIPANTS_IDS, validUsers.map(user => user.id));
  }

  get participantsIds() {
    return this.get(Message.KEY_PARTICIPANTS_IDS);
  }

  get premiumPaidUserIds() {
    return this.get(Message.KEY_PREMIUM_USER_IDS) || [];
  }

  addPremiumPaidUserId(userId) {
    this.addAllUnique(Message.KEY_PREMIUM_USER_IDS, [userId]);
  }

  get call() {
    return this.get(Message.KEY_CALL);
  }

  set call(callObj) {
    this.set(Message.KEY_CALL, callObj);
  }

  get messageDeletedByUsers() {
    return this.get(Message.KEY_DELETED_BY) || [];
  }

  addDeletedBy(userId) {
    this.addAllUnique(Message.KEY_DELETED_BY, [userId]);
  }

  setDeletedByAll(participantsIds) {
    this.addAllUnique(Message.KEY_DELETED_BY, participantsIds);
  }

  get isLiveOnGoing() {
    return this.get(Message.KEY_LIVE_ONGOING) || false;
  }

  get liveStartTime() {
    return this.get(Message.KEY_LIVE_START_TIME);
  }

  get liveEndTime() {
    return this.get(Message.KEY_LIVE_END_TIME);
  }

  get liveDuration() {
    return this.get(Message.KEY_LIVE_DURATION) || 0;
  }

  /**
   * Query or create a chat between the current user and another user
   * @param {Object} params - Parameters for the query
   * @param {User} params.user - The user to chat with
   * @param {User} params.currentUser - The current user
   * @param {boolean} params.createChat - Whether to create a chat if none exists
   * @param {Function} params.onChatAvailable - Callback when chat is found
   * @param {Function} params.onCreateNewChat - Callback when new chat is created
   * @param {Function} params.onError - Callback when error occurs
   * @returns {Promise<void>}
   */
  static async queryChat({
    user,
    currentUser,
    createChat = true,
    onChatAvailable,
    onCreateNewChat,
    onError
  }) {
    try {
      const Chat = Parse.Object.extend('Chat');
      const query = new Parse.Query(Chat);
      query.containsAll('participantsIds', [currentUser.id, user.id]);
      
      const results = await query.find();
      
      if (results.length > 0) {
        onChatAvailable && onChatAvailable(results[0]);
        return;
      } else if (createChat) {
        const chat = new Chat();
        chat.addAllUnique('participants', [currentUser, user]);
        chat.addAllUnique('participantsIds', [currentUser.id, user.id]);
        
        const savedChat = await chat.save();
        onCreateNewChat && onCreateNewChat(savedChat);
      } else {
        onCreateNewChat && onCreateNewChat(null);
      }
    } catch (error) {
      console.error('Error querying chat:', error);
      onError && onError();
    }
  }

  /**
   * Get messages for a specific chat
   * @param {string} chatId - The chat ID
   * @param {number} limit - Maximum number of messages to retrieve
   * @param {number} skip - Number of messages to skip (for pagination)
   * @returns {Promise<Array>} - Array of Message objects
   */
  static async getMessages(chatId, limit = 100, skip = 0, includeImage = true) {
    // Create a query for text messages
    const textQuery = new Parse.Query(Message);
    textQuery.equalTo(Message.KEY_CHAT_ID, chatId);
    textQuery.equalTo(Message.KEY_MESSAGE_TYPE, Message.MESSAGE_TYPE_TEXT);
    
    // Create a query for image messages
    const imageQuery = new Parse.Query(Message);
    imageQuery.equalTo(Message.KEY_CHAT_ID, chatId);
    imageQuery.equalTo(Message.KEY_MESSAGE_TYPE, Message.MESSAGE_TYPE_IMAGE);
    
    // Combine the queries with OR
    const query = includeImage ? Parse.Query.or(textQuery, imageQuery) : textQuery;
    query.descending('createdAt');
    query.limit(limit);
    query.skip(skip);
    query.include(Message.KEY_SENDER);
    
    try {
      const results = await query.find();
      return results;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  /**
   * Send a new text message
   * @param {string} chatId - The chat ID
   * @param {string} text - Message text
   * @param {User} sender - The sender user
   * @param {Array} participants - Array of participant users
   * @returns {Promise<Message>} - The saved message
   */
  static async sendTextMessage(chatId, text, sender, participants) {
    const message = new Message();
    message.set(Message.KEY_TEXT_MESSAGE, text);
    message.set(Message.KEY_MESSAGE_TYPE, Message.MESSAGE_TYPE_TEXT);
    message.set(Message.KEY_CHAT_ID, chatId);
    message.set(Message.KEY_SENDER, sender);
    message.set(Message.KEY_SENDER_ID, sender.id);
    message.set(Message.KEY_READ, false);
    message.addAllUnique(Message.KEY_PARTICIPANTS, participants);
    message.addAllUnique(Message.KEY_PARTICIPANTS_IDS, participants.map(user => user.id));
    
    try {
      return await message.save();
    } catch (error) {
      console.error('Error sending text message:', error);
      throw error;
    }
  }

  /**
   * Send a new image message
   * @param {string} chatId - The chat ID
   * @param {Parse.File} imageFile - The image file to send
   * @param {Parse.File} thumbFile - Optional thumbnail file
   * @param {User} sender - The sender user
   * @param {Array} participants - Array of participant users
   * @returns {Promise<Message>} - The saved message
   */
  static async sendImageMessage(chatId, imageFile, thumbFile, sender, participants) {
    const message = new Message();
    message.set(Message.KEY_MESSAGE_TYPE, Message.MESSAGE_TYPE_IMAGE);
    message.set(Message.KEY_MEDIA_FILE, imageFile);
    if (thumbFile) {
      message.set(Message.KEY_MEDIA_FILE_THUMB, thumbFile);
    }
    message.set(Message.KEY_CHAT_ID, chatId);
    message.set(Message.KEY_SENDER, sender);
    message.set(Message.KEY_SENDER_ID, sender.id);
    message.set(Message.KEY_READ, false);
    message.addAllUnique(Message.KEY_PARTICIPANTS, participants);
    message.addAllUnique(Message.KEY_PARTICIPANTS_IDS, participants.map(user => user.id));
    
    try {
      return await message.save();
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }
}

// Register the Message subclass with Parse
Parse.Object.registerSubclass('Message', Message);
