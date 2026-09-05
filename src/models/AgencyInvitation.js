import Parse from 'parse';
import Agent from './Agent';
import Host from './Host';
import User from './User';

export default class AgencyInvitation extends Parse.Object {
  constructor() {
    super(AgencyInvitation.keyTableName);
  }

  // Clone functionality (similar to Dart's ParseCloneable)
  clone(map) {
    const cloned = new AgencyInvitation();
    Object.keys(map).forEach(key => {
      cloned.set(key, map[key]);
    });
    return cloned;
  }

  // Table name constant
  static get keyTableName() { return 'AgencyInvitation'; }

  // Class constants
  static get className() { return AgencyInvitation.keyTableName; }

  // Invitation status constants
  static get invitationStatus() {
    return {
      PENDING: 'pending',
      ACCEPTED: 'accepted',
      REJECTED: 'rejected'
    };
  }

  // Invitation type constants
  static get invitationType() {
    return {
      JOIN: 'join',
      INVITE: 'invite',
      LEAVE: 'leave',
      AUTO_LEAVE: 'auto_leave',
      REMOVE: 'remove'
    };
  }

  // Field keys
  static get keys() {
    return {
      INVITATION_TYPE: 'type',
      AGENT: 'agent',
      AGENT_ID: 'agentId',
      HOST: 'host',
      HOST_ID: 'hostId',
      HOST_AUTHOR: 'author',
      HOST_AUTHOR_ID: 'authorId',
      HOST_AUTHOR_SUB: 'host.author',
      INVITATION_STATUS: 'invitationStatus'
    };
  }

  // Getters
  get getAgent() {
    return this.get(AgencyInvitation.keys.AGENT);
  }

  get getAgentId() {
    return this.get(AgencyInvitation.keys.AGENT_ID);
  }

  get getHost() {
    return this.get(AgencyInvitation.keys.HOST);
  }

  get getHostId() {
    return this.get(AgencyInvitation.keys.HOST_ID);
  }

  get getHostAuthor() {
    return this.get(AgencyInvitation.keys.HOST_AUTHOR);
  }

  get getHostAuthorId() {
    return this.get(AgencyInvitation.keys.HOST_AUTHOR_ID);
  }

  get getInvitationStatus() {
    return this.get(AgencyInvitation.keys.INVITATION_STATUS);
  }

  get getInvitationType() {
    return this.get(AgencyInvitation.keys.INVITATION_TYPE);
  }

  // Setters
  /**
   * @param {Agent} agent
   */
  set setAgent(agent) {
    if (!(agent instanceof Agent)) {
      throw new Error('agent must be an instance of Agent');
    }
    this.set(AgencyInvitation.keys.AGENT, agent);
  }

  /**
   * @param {string} agentId
   */
  set setAgentId(agentId) {
    this.set(AgencyInvitation.keys.AGENT_ID, agentId);
  }

  /**
   * @param {Host} host
   */
  set setHost(host) {
    if (!(host instanceof Host)) {
      throw new Error('host must be an instance of Host');
    }
    this.set(AgencyInvitation.keys.HOST, host);
  }

  /**
   * @param {string} hostId
   */
  set setHostId(hostId) {
    this.set(AgencyInvitation.keys.HOST_ID, hostId);
  }

  /**
   * @param {User} author
   */
  set setHostAuthor(author) {
    if (!(author instanceof User || author instanceof Parse.User)) {
      throw new Error('author must be an instance of User or Parse.User');
    }
    this.set(AgencyInvitation.keys.HOST_AUTHOR, author);
  }

  /**
   * @param {string} authorId
   */
  set setHostAuthorId(authorId) {
    this.set(AgencyInvitation.keys.HOST_AUTHOR_ID, authorId);
  }

  /**
   * @param {string} status
   */
  set setInvitationStatus(status) {
    if (!Object.values(AgencyInvitation.invitationStatus).includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${Object.values(AgencyInvitation.invitationStatus).join(', ')}`);
    }
    this.set(AgencyInvitation.keys.INVITATION_STATUS, status);
  }

  /**
   * @param {string} type
   */
  set setInvitationType(type) {
    if (!Object.values(AgencyInvitation.invitationType).includes(type)) {
      throw new Error(`Invalid type. Must be one of: ${Object.values(AgencyInvitation.invitationType).join(', ')}`);
    }
    this.set(AgencyInvitation.keys.INVITATION_TYPE, type);
  }
}

// Register the AgencyInvitation subclass
Parse.Object.registerSubclass(AgencyInvitation.keyTableName, AgencyInvitation);
