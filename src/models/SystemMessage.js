import Parse from 'parse';
import Agent from './Agent';
import Host from './Host';
import User from './User';
import AgencyInvitation from './AgencyInvitation';
import Transaction from './Transaction';

export default class SystemMessage extends Parse.Object {
  constructor() {
    super(SystemMessage.keyTableName);
  }

  // Clone functionality (similar to Dart's ParseCloneable)
  clone(map) {
    const cloned = new SystemMessage();
    Object.keys(map).forEach(key => {
      cloned.set(key, map[key]);
    });
    return cloned;
  }

  // Table name constant
  static get keyTableName() { return 'SystemMessage'; }

  // Class constants
  static get className() { return SystemMessage.keyTableName; }

  // Message status constants
  static get systemMessageStatus() {
    return {
      PENDING: 'pending',
      ACCEPTED: 'accepted',
      REJECTED: 'rejected'
    };
  }

  // Message type constants
  static get systemMessageType() {
    return {
      HOST_JOIN_AGENCY: 'host_join_agency',
      HOST_ADDED_AGENCY: 'host_added_agency',
      HOST_LEAVE_AGENCY: 'host_leave_agency',
      HOST_REMOVED_AGENCY: 'host_removed_agency',
      AGENT_APPLY_CODE: 'agent_apply_code',
      CREDITS_PURCHASE: 'credits_purchase',
      CREDITS_TRADING: 'credits_trading',
      CREDITS_EXCHANGE: 'credits_exchange'
    };
  }

  // Field keys
  static get keys() {
    return {
      MESSAGE_TYPE: 'type',
      MESSAGE_STATUS: 'status',
      AUTHOR: 'author',
      AUTHOR_ID: 'authorId',
      RECEIVER: 'receiver',
      RECEIVER_ID: 'receiverId',
      HOST: 'host',
      HOST_ID: 'hostId',
      AGENT: 'agent',
      AGENT_ID: 'agentId',
      INVITATION: 'invitation',
      INVITATION_OF_INVITATION: 'invitation.invitation',
      INVITATION_ID: 'invitationId',
      TRANSACTION: 'transaction',
      TRANSACTION_ID: 'transactionId',
      READ: 'read',
      RELATED_MESSAGE: 'relatedMessage',
      MAIN_MESSAGE: 'mainMessage'
    };
  }

  /**
   * Process a host leave request
   * @param {string} invitationId - The ID of the invitation object
   * @param {string} action - The action to take ('accept' or 'reject')
   * @returns {Promise<Object>} - The result of the cloud code call
   */
  static async processLeaveRequest(invitationId, action) {
    try {
      // Find the system message associated with this invitation
      const query = new Parse.Query(SystemMessage);
      query.equalTo(SystemMessage.keys.INVITATION_ID, invitationId);
      query.equalTo(SystemMessage.keys.MESSAGE_TYPE, SystemMessage.systemMessageType.HOST_LEAVE_AGENCY);
      query.equalTo(SystemMessage.keys.MESSAGE_STATUS, SystemMessage.systemMessageStatus.PENDING);
      const systemMessage = await query.first();
      
      if (!systemMessage) {
        throw new Error('System message not found for this invitation');
      }
      
      // Call the cloud code function with the message ID
      const params = {
        requestId: systemMessage.id,
        action: action
      };
      
      return await Parse.Cloud.run('process_host_quit_request', params);
    } catch (error) {
      console.error('Error processing leave request:', error);
      throw error;
    }
  }
  
  /**
   * Process a host join request
   * @param {string} invitationId - The ID of the invitation object
   * @param {string} action - The action to take ('accept' or 'reject')
   * @returns {Promise<Object>} - The result of the cloud code call
   */
  static async processJoinRequest(invitationId, action) {
    try {
      // Find the system message associated with this invitation
      const query = new Parse.Query(SystemMessage);
      query.equalTo(SystemMessage.keys.INVITATION_ID, invitationId);
      query.equalTo(SystemMessage.keys.MESSAGE_TYPE, SystemMessage.systemMessageType.HOST_JOIN_AGENCY);
      query.equalTo(SystemMessage.keys.MESSAGE_STATUS, SystemMessage.systemMessageStatus.PENDING);
      const systemMessage = await query.first();
      
      if (!systemMessage) {
        throw new Error('System message not found for this join request');
      }
      
      // Call the cloud code function with the message ID
      const params = {
        requestId: systemMessage.id,
        action: action
      };
      
      return await Parse.Cloud.run('process_agent_request', params);
    } catch (error) {
      console.error('Error processing join request:', error);
      throw error;
    }
  }

  // Getters
  get getAuthor() {
    return this.get(SystemMessage.keys.AUTHOR);
  }

  get getReceiver() {
    return this.get(SystemMessage.keys.RECEIVER);
  }

  get getHost() {
    return this.get(SystemMessage.keys.HOST);
  }

  get getAgent() {
    return this.get(SystemMessage.keys.AGENT);
  }

  get getInvitation() {
    return this.get(SystemMessage.keys.INVITATION);
  }

  get getTransaction() {
    return this.get(SystemMessage.keys.TRANSACTION);
  }

  get getAuthorId() {
    return this.get(SystemMessage.keys.AUTHOR_ID);
  }

  get getReceiverId() {
    return this.get(SystemMessage.keys.RECEIVER_ID);
  }

  get getHostId() {
    return this.get(SystemMessage.keys.HOST_ID);
  }

  get getAgentId() {
    return this.get(SystemMessage.keys.AGENT_ID);
  }

  get getInvitationId() {
    return this.get(SystemMessage.keys.INVITATION_ID);
  }

  get getTransactionId() {
    return this.get(SystemMessage.keys.TRANSACTION_ID);
  }

  get getMessageType() {
    return this.get(SystemMessage.keys.MESSAGE_TYPE);
  }

  get getMessageStatus() {
    return this.get(SystemMessage.keys.MESSAGE_STATUS);
  }

  get isRead() {
    return this.get(SystemMessage.keys.READ) ?? false;
  }

  get getRelatedMessage() {
    return this.get(SystemMessage.keys.RELATED_MESSAGE);
  }

  get getMainMessage() {
    return this.get(SystemMessage.keys.MAIN_MESSAGE);
  }

  // Setters
  /**
   * @param {User} author
   */
  set setAuthor(author) {
    if (!(author instanceof User || author instanceof Parse.User)) {
      throw new Error('author must be an instance of User or Parse.User');
    }
    this.set(SystemMessage.keys.AUTHOR, author);
    this.set(SystemMessage.keys.AUTHOR_ID, author.id);
  }

  /**
   * @param {User} receiver
   */
  set setReceiver(receiver) {
    if (!(receiver instanceof User || receiver instanceof Parse.User)) {
      throw new Error('receiver must be an instance of User or Parse.User');
    }
    this.set(SystemMessage.keys.RECEIVER, receiver);
    this.set(SystemMessage.keys.RECEIVER_ID, receiver.id);
  }

  /**
   * @param {Host} host
   */
  set setHost(host) {
    if (!(host instanceof Host)) {
      throw new Error('host must be an instance of Host');
    }
    this.set(SystemMessage.keys.HOST, host);
    this.set(SystemMessage.keys.HOST_ID, host.id);
  }

  /**
   * @param {Agent} agent
   */
  set setAgent(agent) {
    if (!(agent instanceof Agent)) {
      throw new Error('agent must be an instance of Agent');
    }
    this.set(SystemMessage.keys.AGENT, agent);
    this.set(SystemMessage.keys.AGENT_ID, agent.id);
  }

  /**
   * @param {Transaction} transaction
   */
  set setTransaction(transaction) {
    if (!(transaction instanceof Transaction)) {
      throw new Error('transaction must be an instance of Transaction');
    }
    this.set(SystemMessage.keys.TRANSACTION, transaction);
    this.set(SystemMessage.keys.TRANSACTION_ID, transaction.id);
  }

  /**
   * @param {AgencyInvitation} invitation
   */
  set setInvitation(invitation) {
    if (!(invitation instanceof AgencyInvitation)) {
      throw new Error('invitation must be an instance of AgencyInvitation');
    }
    this.set(SystemMessage.keys.INVITATION, invitation);
    this.set(SystemMessage.keys.INVITATION_ID, invitation.id);
  }

  /**
   * @param {string} type
   */
  set setMessageType(type) {
    if (!Object.values(SystemMessage.systemMessageType).includes(type)) {
      throw new Error(`Invalid type. Must be one of: ${Object.values(SystemMessage.systemMessageType).join(', ')}`);
    }
    this.set(SystemMessage.keys.MESSAGE_TYPE, type);
  }

  /**
   * @param {string} status
   */
  set setMessageStatus(status) {
    if (!Object.values(SystemMessage.systemMessageStatus).includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${Object.values(SystemMessage.systemMessageStatus).join(', ')}`);
    }
    this.set(SystemMessage.keys.MESSAGE_STATUS, status);
  }

  /**
   * @param {boolean} read
   */
  set setRead(read) {
    this.set(SystemMessage.keys.READ, read);
  }

  /**
   * @param {SystemMessage} message
   */
  set setRelatedMessage(message) {
    if (!(message instanceof SystemMessage)) {
      throw new Error('message must be an instance of SystemMessage');
    }
    this.set(SystemMessage.keys.RELATED_MESSAGE, message);
  }

  /**
   * @param {SystemMessage} message
   */
  set setMainMessage(message) {
    if (!(message instanceof SystemMessage)) {
      throw new Error('message must be an instance of SystemMessage');
    }
    this.set(SystemMessage.keys.MAIN_MESSAGE, message);
  }
}

// Register the SystemMessage subclass
Parse.Object.registerSubclass(SystemMessage.keyTableName, SystemMessage);
