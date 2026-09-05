import Parse from 'parse';

export default class Agent extends Parse.Object {
  constructor() {
    super('Agents');
  }

  // Class constants
  static get className() { return 'Agents'; }

  static get status() {
    return {
      PENDING: 'pending',
      ACCEPTED: 'accepted',
      REJECTED: 'rejected',
      ACTIVATED: 'activated',
      COMPLETED: 'completed',
      SUSPENDED: 'suspended',
    };
  }
  
  // Field keys
  static keys = {
    CREATED_AT: 'createdAt',
    AUTHOR: 'author',
    AUTHOR_ID: 'authorId',
    INVITER_ID: 'inviterId',
    HOST_IDS: 'hostIds',
    STREAMS: 'streams',
    INVITED_AGENTS: 'invitedAgents',
    DIAMONDS_TOTAL: 'diamondsTotal',
    DIAMONDS_AVAILABLE: 'diamonds',
    NAME: 'name',
    LOGO: 'logo',
    DESCRIPTION: 'description',
    UID: 'uid',
    RULES: 'rules',
    COMMISSIONS: 'commissions',
    SUPPORT: 'support',
    EMAIL: 'contactEmail',
    COMPANY_NAME: 'companyName',
    COMPANY_REGISTRATION_NUMBER: 'companyRegistrationNumber',
    COMPANY_TAX_ID: 'companyTaxId',
    COMPANY_ADDRESS: 'companyAddress',
    COMPANY_CITY: 'companyCity',
    COMPANY_POSTAL_CODE: 'companyPostalCode',
    COMPANY_COUNTRY: 'companyCountry',
    COMPANY_WEBSITE: 'companyWebsite',
    STATUS: 'status', // 'pending', 'accepted', 'rejected', 'activated', 'completed',
    AGENCY_APPLICATION_ID: 'agencyApplicationId',
  };

  // Getters
  get author() {
    return this.get(Agent.keys.AUTHOR);
  }

  get authorId() {
    return this.get(Agent.keys.AUTHOR_ID);
  }

  get inviterId() {
    return this.get(Agent.keys.INVITER_ID);
  }

  get hostIds() {
    return this.get(Agent.keys.HOST_IDS) || [];
  }

  get streams() {
    return this.get(Agent.keys.STREAMS) || [];
  }

  get invitedAgents() {
    return this.get(Agent.keys.INVITED_AGENTS) || [];
  }

  get diamondsTotal() {
    return this.get(Agent.keys.DIAMONDS_TOTAL) || 0;
  }

  get diamondsAvailable() {
    return this.get(Agent.keys.DIAMONDS_AVAILABLE) || 0;
  }

  get name() {
    return this.get(Agent.keys.NAME);
  }

  get logo() {
    return this.get(Agent.keys.LOGO);
  }

  get description() {
    return this.get(Agent.keys.DESCRIPTION);
  }

  get uid() {
    return this.get(Agent.keys.UID);
  }

  get rules() {
    return this.get(Agent.keys.RULES);
  }

  get commissions() {
    return this.get(Agent.keys.COMMISSIONS);
  }

  get support() {
    return this.get(Agent.keys.SUPPORT);
  }

  get getAgent() {
    return this.get(Agent.keys.AUTHOR);
  }

  get contactEmail() {
    return this.get(Agent.keys.EMAIL);
  }

  get companyName() {
    return this.get(Agent.keys.COMPANY_NAME);
  }

  get companyRegistrationNumber() {
    return this.get(Agent.keys.COMPANY_REGISTRATION_NUMBER);
  }

  get companyTaxId() {
    return this.get(Agent.keys.COMPANY_TAX_ID);
  }

  get companyAddress() {
    return this.get(Agent.keys.COMPANY_ADDRESS);
  }

  get companyCity() {
    return this.get(Agent.keys.COMPANY_CITY);
  }

  get companyPostalCode() {
    return this.get(Agent.keys.COMPANY_POSTAL_CODE);
  }

  get companyCountry() {
    return this.get(Agent.keys.COMPANY_COUNTRY);
  }

  // Setters
  setAuthor(author) {
    this.set(Agent.keys.AUTHOR, author);
  }

  setAuthorId(authorId) {
    this.set(Agent.keys.AUTHOR_ID, authorId);
  }

  addStream(streamId) {
    this.addUnique(Agent.keys.STREAMS, streamId);
  }

  addHost(hostId) {
    this.addUnique(Agent.keys.HOST_IDS, hostId);
  }

  addInvitedAgent(agentId) {
    this.addUnique(Agent.keys.INVITED_AGENTS, agentId);
  }

  set name(name) {
    this.set(Agent.keys.NAME, name);
  }

  set logo(logo) {
    this.set(Agent.keys.LOGO, logo);
  }

  set description(description) {
    this.set(Agent.keys.DESCRIPTION, description);
  }

  set hostIds(hostIds) {
    this.set(Agent.keys.HOST_IDS, hostIds);
  }

  set author(author) {
    this.set(Agent.keys.AUTHOR, author);
  }

  set createdAt(createdAt) {
    this.set(Agent.keys.CREATED_AT, createdAt);
  }

  set uid(uid) {
    this.set(Agent.keys.UID, uid);
  }

  set rules(rules) {
    this.set(Agent.keys.RULES, rules);
  }

  set commissions(commissions) {
    this.set(Agent.keys.COMMISSIONS, commissions);
  }

  set support(support) {
    this.set(Agent.keys.SUPPORT, support);
  }

  set contactEmail(contactEmail) {
    this.set(Agent.keys.EMAIL, contactEmail);
  }

  set companyName(companyName) {
    this.set(Agent.keys.COMPANY_NAME, companyName);
  }

  set companyRegistrationNumber(companyRegistrationNumber) {
    this.set(Agent.keys.COMPANY_REGISTRATION_NUMBER, companyRegistrationNumber);
  }

  set companyTaxId(companyTaxId) {
    this.set(Agent.keys.COMPANY_TAX_ID, companyTaxId);
  }

  set companyAddress(companyAddress) {
    this.set(Agent.keys.COMPANY_ADDRESS, companyAddress);
  }

  set companyCity(companyCity) {
    this.set(Agent.keys.COMPANY_CITY, companyCity);
  }

  set companyPostalCode(companyPostalCode) {
    this.set(Agent.keys.COMPANY_POSTAL_CODE, companyPostalCode);
  }

  set companyCountry(companyCountry) {
    this.set(Agent.keys.COMPANY_COUNTRY, companyCountry);
  }

  // Static methods for queries
  static async getAgentByAuthorId(authorId) {
    const query = new Parse.Query(Agent);
    query.include('author');
    query.equalTo(Agent.keys.AUTHOR_ID, authorId);
    return query.first();
  }

  /**
   * Get an agency by its unique code
   * @param {number} code - The agency's unique code
   * @returns {Promise<Agent|null>} The agency if found, null otherwise
   * @throws {Error} If code is not a valid number
   */
  static async getAgencyByCode(code) {
    if (typeof code !== 'number' || isNaN(code)) {
      throw new Error('Agency code must be a valid number');
    }

    const query = new Parse.Query(Agent);
    query.equalTo(Agent.keys.UID, code);
    query.include('author');
    return query.first();
  }

  static async getAgentByInviterId(inviterId) {
    const query = new Parse.Query(Agent);
    query.equalTo(Agent.keys.INVITER_ID, inviterId);
    query.include('author');
    return query.find();
  }
}

// Register the Agent subclass
Parse.Object.registerSubclass('Agents', Agent);
