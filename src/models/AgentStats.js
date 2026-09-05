import Parse from 'parse';

export default class AgentStats extends Parse.Object {
  constructor() {
    super('AgentStats');
  }

  // Class constants
  static get className() { return 'AgentStats'; }

  // Field keys
  static keys = {
    CREATED_AT: 'createdAt',
    AUTHOR: 'author',
    AUTHOR_ID: 'authorId',
    AGENT: 'agent',
    AGENT_ID: 'agentId',
    AGENT_UID: 'uid',
    DATE: 'date',
    DIAMONDS: 'diamonds',
    STREAMS: 'streams',
    TOTAL_EARNING: 'total_earning',
    HOST_EARNING: 'host_earning',
    AGENT_EARNING: 'agent_earning',
    TOTAL_COMMISSION: 'total_commission',
    HOST_COMMISSION: 'host_commission',
    AGENT_COMMISSION: 'agent_commission',
    COMMISSION_PERCENT: 'commission_percent'
  };

  // Getters
  get author() {
    return this.get(AgentStats.keys.AUTHOR);
  }

  get authorId() {
    return this.get(AgentStats.keys.AUTHOR_ID);
  }

  get agent() {
    return this.get(AgentStats.keys.AGENT);
  }

  get agentId() {
    return this.get(AgentStats.keys.AGENT_ID);
  }

  get agentUid() {
    return this.get(AgentStats.keys.AGENT_UID) || 0;
  }

  get streams() {
    return this.get(AgentStats.keys.STREAMS) || [];
  }

  get diamonds() {
    return this.get(AgentStats.keys.DIAMONDS) || 0;
  }

  get totalEarning() {
    return this.get(AgentStats.keys.TOTAL_EARNING) || 0;
  }

  get hostEarning() {
    return this.get(AgentStats.keys.HOST_EARNING) || 0;
  }

  get agentEarning() {
    return this.get(AgentStats.keys.AGENT_EARNING) || 0;
  }

  get totalCommission() {
    return this.get(AgentStats.keys.TOTAL_COMMISSION) || 0;
  }

  get hostCommission() {
    return this.get(AgentStats.keys.HOST_COMMISSION) || 0;
  }

  get agentCommission() {
    return this.get(AgentStats.keys.AGENT_COMMISSION) || 0;
  }

  get commissionPercent() {
    return this.get(AgentStats.keys.COMMISSION_PERCENT) || 4;
  }

  get date() {
    return this.get(AgentStats.keys.DATE);
  }

  // Setters
  setAuthor(author) {
    this.set(AgentStats.keys.AUTHOR, author);
  }

  setAuthorId(authorId) {
    this.set(AgentStats.keys.AUTHOR_ID, authorId);
  }

  setAgent(agent) {
    this.set(AgentStats.keys.AGENT, agent);
  }

  setAgentId(agentId) {
    this.set(AgentStats.keys.AGENT_ID, agentId);
  }

  setAgentUid(uid) {
    this.set(AgentStats.keys.AGENT_UID, uid);
  }

  setStreams(streams) {
    this.set(AgentStats.keys.STREAMS, streams);
  }

  setDiamonds(diamonds) {
    this.set(AgentStats.keys.DIAMONDS, diamonds);
  }

  setTotalEarning(earning) {
    this.set(AgentStats.keys.TOTAL_EARNING, earning);
  }

  setHostEarning(earning) {
    this.set(AgentStats.keys.HOST_EARNING, earning);
  }

  setAgentEarning(earning) {
    this.set(AgentStats.keys.AGENT_EARNING, earning);
  }

  setTotalCommission(commission) {
    this.set(AgentStats.keys.TOTAL_COMMISSION, commission);
  }

  setHostCommission(commission) {
    this.set(AgentStats.keys.HOST_COMMISSION, commission);
  }

  setAgentCommission(commission) {
    this.set(AgentStats.keys.AGENT_COMMISSION, commission);
  }

  setCommissionPercent(percent) {
    this.set(AgentStats.keys.COMMISSION_PERCENT, percent);
  }

  setDate(date) {
    this.set(AgentStats.keys.DATE, date);
  }

  // Static methods for queries
  static async getAgentStats(agentId, startDate, endDate) {
    const query = new Parse.Query(AgentStats);
    query.equalTo(AgentStats.keys.AGENT_ID, agentId);
    
    if (startDate) {
      query.greaterThanOrEqualTo(AgentStats.keys.DATE, startDate);
    }
    if (endDate) {
      query.lessThanOrEqualTo(AgentStats.keys.DATE, endDate);
    }

    query.include('agent');
    query.include('author');
    query.descending(AgentStats.keys.DATE);
    
    return query.find();
  }

  static async getAgentStatsByMonth(agentId, month, year) {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    return this.getAgentStats(agentId, startDate, endDate);
  }

  static async getCurrentMonthStats(agentId) {
    const now = new Date();
    return this.getAgentStatsByMonth(agentId, now.getMonth(), now.getFullYear());
  }

  static async getLastMonthStats(agentId) {
    const now = new Date();
    const lastMonth = now.getMonth() - 1;
    const year = lastMonth < 0 ? now.getFullYear() - 1 : now.getFullYear();
    const month = lastMonth < 0 ? 11 : lastMonth;
    return this.getAgentStatsByMonth(agentId, month, year);
  }
}

// Register the AgentStats subclass
Parse.Object.registerSubclass('AgentStats', AgentStats);
