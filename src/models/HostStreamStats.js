import Parse from 'parse';
import Agent from './Agent';
import UserModel from './User';

export default class HostStreamStats extends Parse.Object {
  constructor() {
    super('HostStreamStats');
  }

  // Class constants
  static get className() { return 'HostStreamStats'; }

  // Field keys
  static keys = {
    CREATED_AT: 'createdAt',
    AUTHOR: 'author',
    AUTHOR_ID: 'authorId',
    HOST: 'host',
    HOST_ID: 'hostId',
    DATE: 'date',
    DIAMONDS: 'diamonds',
    COMMISSION_SENT: 'commission_sent',
    LIVE_EARNING: 'live_earning',
    PARTY_EARNING: 'party_earning',
    STREAMS: 'streams',
    DURATION: 'duration',
    PARTY_DURATION: 'party_duration',
    LIVE_DURATION: 'live_duration',
    MULTI_DURATION: 'multi_duration',
    AUDIO_DURATION: 'audio_duration'
  };

  static get status() {
    return {
      OFFLINE: 'offline',
      ONLINE: 'online',
      STREAMING: 'streaming'
    };
  }

  // Getters
  get author() {
    return this.get(HostStreamStats.keys.AUTHOR);
  }

  get authorId() {
    return this.get(HostStreamStats.keys.AUTHOR_ID);
  }

  get host() {
    return this.get(HostStreamStats.keys.HOST);
  }

  get hostId() {
    return this.get(HostStreamStats.keys.HOST_ID);
  }

  get streams() {
    return this.get(HostStreamStats.keys.STREAMS) || [];
  }

  get diamonds() {
    return this.get(HostStreamStats.keys.DIAMONDS) || 0;
  }

  get liveEarning() {
    return this.get(HostStreamStats.keys.LIVE_EARNING) || 0;
  }

  get partyEarning() {
    return this.get(HostStreamStats.keys.PARTY_EARNING) || 0;
  }

  get commissionSent() {
    return this.get(HostStreamStats.keys.COMMISSION_SENT) || 0;
  }

  get duration() {
    return this.get(HostStreamStats.keys.DURATION) || 0;
  }

  get partyDuration() {
    return this.get(HostStreamStats.keys.PARTY_DURATION) || 0;
  }

  get liveDuration() {
    return this.get(HostStreamStats.keys.LIVE_DURATION) || 0;
  }

  get multiDuration() {
    return this.get(HostStreamStats.keys.MULTI_DURATION) || 0;
  }

  get audioDuration() {
    return this.get(HostStreamStats.keys.AUDIO_DURATION) || 0;
  }

  get date() {
    return this.get(HostStreamStats.keys.DATE);
  }

  // Setters
  setAuthor(author) {
    this.set(HostStreamStats.keys.AUTHOR, author);
  }

  setAuthorId(authorId) {
    this.set(HostStreamStats.keys.AUTHOR_ID, authorId);
  }

  setHost(host) {
    this.set(HostStreamStats.keys.HOST, host);
  }

  setHostId(hostId) {
    this.set(HostStreamStats.keys.HOST_ID, hostId);
  }

  setStreams(streams) {
    this.set(HostStreamStats.keys.STREAMS, streams);
  }

  setDiamonds(diamonds) {
    this.set(HostStreamStats.keys.DIAMONDS, diamonds);
  }

  setLiveEarning(earning) {
    this.set(HostStreamStats.keys.LIVE_EARNING, earning);
  }

  setPartyEarning(earning) {
    this.set(HostStreamStats.keys.PARTY_EARNING, earning);
  }

  setCommissionSent(commission) {
    this.set(HostStreamStats.keys.COMMISSION_SENT, commission);
  }

  setDuration(duration) {
    this.set(HostStreamStats.keys.DURATION, duration);
  }

  setPartyDuration(duration) {
    this.set(HostStreamStats.keys.PARTY_DURATION, duration);
  }

  setLiveDuration(duration) {
    this.set(HostStreamStats.keys.LIVE_DURATION, duration);
  }

  setMultiDuration(duration) {
    this.set(HostStreamStats.keys.MULTI_DURATION, duration);
  }

  setAudioDuration(duration) {
    this.set(HostStreamStats.keys.AUDIO_DURATION, duration);
  }

  setDate(date) {
    this.set(HostStreamStats.keys.DATE, date);
  }

  static async getAgentDashboardStats(agent, startDate, endDate) {
    // Get the agent to access the hostIds
    
    if (!agent) {
      console.error('Agent not found');
      return { activeHosts: 0, totalRevenue: 0 };
    }
    
    const hostIds = agent.get(Agent.keys.HOST_IDS) || [];
    
    if (hostIds.length === 0) {
      return { activeHosts: 0, totalRevenue: 0 };
    }
    
    const query = new Parse.Query(HostStreamStats.className);
    
    // Filter by date range
    if (startDate) {
      query.greaterThanOrEqualTo(HostStreamStats.keys.DATE, startDate);
    }
    if (endDate) {
      query.lessThanOrEqualTo(HostStreamStats.keys.DATE, endDate);
    }
    
    // Filter by hostIds from the agent
    query.containedIn(HostStreamStats.keys.HOST_ID, hostIds);
    
    try {
      const results = await query.find();
      
      // Calculate unique active hosts
      const uniqueHostIds = new Set(results.map(result => result.get(HostStreamStats.keys.HOST_ID)));
      const activeHosts = uniqueHostIds.size;
      
      // Calculate total revenue (sum of commission_sent)
      const totalRevenue = results.reduce((sum, result) => {
        return sum + (result.get(HostStreamStats.keys.COMMISSION_SENT) || 0);
      }, 0);

      return { 
        activeHosts, 
        totalRevenue 
      };
    } catch (error) {
      console.error('Error getting agent dashboard stats:', error);
      return { activeHosts: 0, totalRevenue: 0 };
    }
  }
  
  static async getManagedHostsData(agent, startDate, endDate) {
    if (!agent) {
      console.error('Agent not found');
      return [];
    }
    
    const hostIds = agent.get(Agent.keys.HOST_IDS) || [];
    
    if (hostIds.length === 0) {
      return [];
    }
    
    // First get all the host users
    
    const userQuery = new Parse.Query(UserModel.className);
    userQuery.containedIn(UserModel.keys.HOST_ID, hostIds);
    const hostUsers = await userQuery.find();
    
    // Create a map of host IDs to user objects
    const hostUserMap = {};
    hostUsers.forEach(user => {
      hostUserMap[user.get(UserModel.keys.HOST_ID)] = user;
    });
    
    // Now get the stream stats for these hosts
    const query = new Parse.Query(HostStreamStats.className);
    
    // Filter by date range
    if (startDate) {
      query.greaterThanOrEqualTo(HostStreamStats.keys.DATE, startDate);
    }
    if (endDate) {
      query.lessThanOrEqualTo(HostStreamStats.keys.DATE, endDate);
    }
    
    // Filter by hostIds from the agent
    query.containedIn(HostStreamStats.keys.HOST_ID, hostIds);
    
    try {
      const results = await query.find();
      
      // Group results by hostId
      const hostStatsMap = {};
      
      results.forEach(result => {
        const hostId = result.get(HostStreamStats.keys.HOST_ID);
        
        if (!hostStatsMap[hostId]) {
          hostStatsMap[hostId] = {
            hostId,
            uid: hostUserMap[hostId]?.get(UserModel.keys.UID) || hostId,
            name: hostUserMap[hostId]?.get(UserModel.keys.FULL_NAME),
            avatar: hostUserMap[hostId]?.get(UserModel.keys.AVATAR_FILE)?.url() || null,
            totalRevenue: 0,
            totalEarnings: 0,
            totalStreamTime: 0,
            streamCount: 0,
            lastActive: null,
            status: HostStreamStats.status.OFFLINE
          };
        }
        
        // Update host stats
        const stats = hostStatsMap[hostId];
        stats.totalRevenue += result.get(HostStreamStats.keys.COMMISSION_SENT) || 0;
        stats.totalEarnings += result.get(HostStreamStats.keys.DIAMONDS) || 0;
        
        // Update status
        const user = hostUserMap[hostId];
        const userStatus = user.get(UserModel.keys.STATUS);
        if(user.get(UserModel.keys.IS_LIVE_STREAMING)){
          stats.status = HostStreamStats.status.STREAMING;
        } else if (userStatus) {
          stats.status = userStatus;
        }
        // Count streams
        const streams = result.get(HostStreamStats.keys.STREAMS) || [];
        stats.streamCount += streams.length;
        
        // Calculate stream time
        stats.totalStreamTime += result.get(HostStreamStats.keys.DURATION) || 0;
        
        // Track last activity
        const date = result.get(HostStreamStats.keys.DATE);
        if (!stats.lastActive || date > stats.lastActive) {
          stats.lastActive = date;
        }
      });
      
      // Convert map to array and sort by revenue
      return Object.values(hostStatsMap).sort((a, b) => b.totalRevenue - a.totalRevenue);
      
    } catch (error) {
      console.error('Error getting managed hosts data:', error);
      return [];
    }
  }
}

// Register the HostStreamStats subclass
Parse.Object.registerSubclass(HostStreamStats.className, HostStreamStats);
