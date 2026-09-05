import Parse from 'parse';
import Agent from './Agent';
import User from './User';
import HostStreamStats from './HostStreamStats';

export default class Host extends Parse.Object {
  constructor() {
    super(Host.keyTableName);
  }

  // Clone functionality (similar to Dart's ParseCloneable)
  clone(map) {
    const cloned = new Host();
    Object.keys(map).forEach(key => {
      cloned.set(key, map[key]);
    });
    return cloned;
  }

  // Table name constant
  static get keyTableName() { return 'Hosts'; }

  // Class constants
  static get className() { return Host.keyTableName; }
  
  // Field keys
  static get keys() {
    return {
      // Match Dart static String keys
      CREATED_AT: 'createdAt',
      AUTHOR: 'author',
      AUTHOR_ID: 'authorId',
      OBJECT_ID: 'objectId',
      DURATION: 'duration',
      PARTY_DURATION: 'party_duration',
      LIVE_DURATION: 'live_duration',
      MULTI_DURATION: 'multi_duration',
      AUDIO_DURATION: 'audio_duration',
      AGENCY: 'agency',
      AGENCY_ID: 'agencyId',
      STREAMS: 'streams',
      INVITER_ID: 'inviterId',
      DIAMONDS: 'diamonds',
      LIVE_EARNING: 'live_earning',
      PARTY_EARNING: 'party_earning',
      VIEWERS: 'viewers',
      COMMISSION_SENT: 'commission_sent'
    };
  }

  // Getters
  get getAuthor() {
    return this.get(Host.keys.AUTHOR);
  }

  get getAuthorId() {
    return this.get(Host.keys.AUTHOR_ID);
  }

  get getDuration() {
    return this.get(Host.keys.DURATION) ?? 0;
  }

  get getPartyDuration() {
    return this.get(Host.keys.PARTY_DURATION) ?? 0;
  }

  get getLiveDuration() {
    return this.get(Host.keys.LIVE_DURATION) ?? 0;
  }

  get getMultiDuration() {
    return this.get(Host.keys.MULTI_DURATION) ?? 0;
  }

  get getAuthDuration() {
    return this.get(Host.keys.AUDIO_DURATION) ?? 0;
  }

  get agency() {
    return this.get(Host.keys.AGENCY);
  }

  get agencyId() {
    return this.get(Host.keys.AGENCY_ID);
  }

  get streams() {
    return this.get(Host.keys.STREAMS) || [];
  }

  get getInviterId() {
    return this.get(Host.keys.INVITER_ID);
  }

  get getEarnedCoins() {
    return this.get(Host.keys.DIAMONDS);
  }

  get liveEarning() {
    return this.get(Host.keys.LIVE_EARNING) || 0;
  }

  get partyEarning() {
    return this.get(Host.keys.PARTY_EARNING) || 0;
  }

  get viewers() {
    return this.get(Host.keys.VIEWERS) || [];
  }

  get getCommission() {
    return this.get(Host.keys.COMMISSION_SENT) || 0;
  }

  // Setters
  setAuthor(author) {
    if (!(author instanceof User || author instanceof Parse.User)) {
      throw new Error('author must be an instance of User or Parse.User');
    }
    this.set(Host.keys.AUTHOR, author);
  }

  /**
   * @param {string} authorId
   */
  set setAuthorId(authorId) {
    this.set(Host.keys.AUTHOR_ID, authorId);
  }

  /**
   * @param {string} streamId
   */
  set setStream(streamId) {
    this.addUnique(Host.keys.STREAMS, streamId);
  }

  /**
   * @param {string} inviterId
   */
  set setInviterId(inviterId) {
    this.set(Host.keys.INVITER_ID, inviterId);
  }

  setAgency(agency) {
    if (!(agency instanceof Agent)) {
      throw new Error('agency must be an instance of Agent');
    }
    this.set(Host.keys.AGENCY, agency);
    this.set(Host.keys.AGENCY_ID, agency.id);
  }

  removeAgency() {
    this.unset(Host.keys.AGENCY);
    this.unset(Host.keys.AGENCY_ID);
  }

  // Static methods for queries
  static async getHostByAuthorId(authorId) {
    const query = new Parse.Query(Host);
    query.equalTo(Host.keys.AUTHOR_ID, authorId);
    return query.first();
  }

  static async getHostsByAgencyId(agencyId) {
    const query = new Parse.Query(Host);
    query.equalTo(Host.keys.AGENCY_ID, agencyId);
    return query.find();
  }

  static async getHostsByInviterId(inviterId) {
    const query = new Parse.Query(Host);
    query.equalTo(Host.keys.INVITER_ID, inviterId);
    return query.find();
  }

  /**
   * Get all hosts data with author details and earnings for an agent
   * @param {Agent} agent - The agent object
   * @returns {Object} - Contains hosts array and total earnings
   */
  static async getHostsData(agent) {
    if (!agent || !agent.hostIds || agent.hostIds.length === 0) {
      return { hosts: [], totalEarnings: 0 };
    }

    try {
      // Create a query for hosts with the given hostIds
      const query = new Parse.Query(Host);
      query.containedIn(Host.keys.OBJECT_ID, agent.hostIds);
      query.include(Host.keys.AUTHOR); // Include the author object
      query.limit(1000); // Set a high limit to ensure we get all hosts

      // Fetch the hosts
      const hosts = await query.find();
      
      // Process the hosts data to include author details
      const hostsData = hosts.map(host => {
        const author = host.getAuthor;
        return {
          id: host.id,
          hostId: host.getAuthorId,
          name: author ? author.get(User.keys.FULL_NAME) : 'Unknown',
          uid: author ? author.get(User.keys.UID) : '',
          avatar: author && author.get(User.keys.AVATAR_FILE) ? author.get(User.keys.AVATAR_FILE).url() : null,
          status: author ? author.get(User.keys.STATUS) : HostStreamStats.status.OFFLINE,
          hostEarnings: author ? author.get(User.keys.DIAMONDS_TOTAL) || 0 : 0,
          streamCount: host.streams.length || 0,
          totalStreamTime: host.getDuration || 0,
          commissionSent: host.getCommission || 0,
          author: author
        };
      });

      // Calculate total earnings
      const totalEarnings = hostsData.reduce((sum, host) => sum + host.hostEarnings, 0);

      // Update status
      /* const user = hostsData[hostId];
      let status = HostStreamStats.status.OFFLINE;
      const userStatus = user.get(UserModel.keys.STATUS);
      if(user.get(UserModel.keys.IS_LIVE_STREAMING)){
        status = HostStreamStats.status.STREAMING;
      } else if (userStatus) {
        status = userStatus;
      } */

      return {
        //status,
        hosts: hostsData,
        totalEarnings
      };
    } catch (error) {
      console.error('Error fetching hosts data:', error);
      return { hosts: [], totalEarnings: 0 };
    }
  }
}

// Register the Host subclass
Parse.Object.registerSubclass('Hosts', Host);
