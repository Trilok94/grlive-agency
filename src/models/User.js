import Parse from 'parse';
import Agent from './Agent';
import Host from './Host';

export default class User extends Parse.User {
  constructor() {
    super('_User');
  }

  // Class constants
  static get className() { return '_User'; }

  // Role constants
  static get roles() {
    return {
      HOST: 'host',
      AGENT: 'agent',
      ADMIN: 'admin'
    };
  }
  
  // Field keys
  static get keys() {
    return {
      // ROLE field is deprecated, using Parse.Role instead
      OBJECT_ID: 'objectId',
      USERNAME: 'username',
      EMAIL: 'email',
      EMAIL_VERIFIED: 'emailVerified',
      FULL_NAME: 'name',
      FIRST_NAME: 'first_name',
      LAST_NAME: 'last_name',
      AVATAR: 'avatar',
      AVATAR_FILE: 'avatar_file',
      PHONE_NUMBER: 'phone_number',
      COUNTRY_DIAL_CODE: 'country_dial_code',
      AGENT: 'agent',
      AGENT_ID: 'agentId',
      AGENCY: 'agency',
      AGENCY_ID: 'agencyId',
      HOST: 'host',
      HOST_ID: 'hostId',
      UID: 'uid',
      LAST_AGENCY_DATE: 'lastAgencyDate',
      DIAMONDS_TOTAL: 'diamondsTotal',
      IS_LIVE_STREAMING: 'isLiveStreaming',
      STATUS: 'status',
      DIAMONDS: 'diamonds',
      CREDITS_TRADE: 'creditsTrade',
      
      // Payment method pointers
      SELECTED_PAYMENT_METHOD: 'payment_method',
      SELECTED_PAYMENT_METHOD_ID: 'payment_method_id',
      PAYOUT_PAYONEER: 'method_payonner',
      PAYOUT_PAYPAL: 'method_paypal',
      PAYOUT_BNB: 'method_bnb',
      PAYOUT_USDT: 'method_usdt',
      PAYOUT_VALLET: 'method_vallet'
    };
  }

  // Role management should be done through Parse.Role
  // These methods are kept for backwards compatibility
  get role() {
    console.warn('role getter is deprecated. Please use getRoles() to get user roles.');
    return null;
  }

  get fullName() {
    return this.get(User.keys.FULL_NAME);
  }

  get firstName() {
    return this.get(User.keys.FIRST_NAME);
  }

  get lastName() {
    return this.get(User.keys.LAST_NAME);
  }

  get avatar() {
    return this.get(User.keys.AVATAR);
  }

  get avatarFile() {
    return this.get(User.keys.AVATAR_FILE);
  }

  get phoneNumber() {
    return this.get(User.keys.PHONE_NUMBER);
  }

  get countryDialCode() {
    return this.get(User.keys.COUNTRY_DIAL_CODE);
  }

  get agent() {
    return this.get(User.keys.AGENT);
  }

  get agentId() {
    return this.get(User.keys.AGENT_ID);
  }

  get agency() {
    return this.get(User.keys.AGENCY);
  }

  get agencyId() {
    return this.get(User.keys.AGENCY_ID);
  }

  get host() {
    return this.get(User.keys.HOST);
  }
  
  get hostId() {
    return this.get(User.keys.HOST_ID);
  }

  get uid() {
    return this.get(User.keys.UID);
  }

  get diamondsTotal() {
    return this.get(User.keys.DIAMONDS_TOTAL);
  }
  get isLiveStreaming() {
    return this.get(User.keys.IS_LIVE_STREAMING);
  }
  get status() {
    return this.get(User.keys.STATUS);
  }

  get diamonds() {
    return this.get(User.keys.DIAMONDS);
  }

  get selectedPaymentMethod() {
    return this.get(User.keys.SELECTED_PAYMENT_METHOD);
  }

  get creditsTrade() {
    return this.get(User.keys.CREDITS_TRADE);
  }

  get payoutPaypal() {
    return this.get(User.keys.PAYOUT_PAYPAL);
  }

  get payoutPayoneer() {
    return this.get(User.keys.PAYOUT_PAYONEER);
  }

  get payoutBnb() {
    return this.get(User.keys.PAYOUT_BNB);
  }

  get payoutUsdt() {
    return this.get(User.keys.PAYOUT_USDT);
  }

  get payoutVallet() {
    return this.get(User.keys.PAYOUT_VALLET);
  }

  // Role management should be done through Parse.Role
  // These methods are kept for backwards compatibility
  setRole(role) {
    console.warn('setRole is deprecated. Please use Parse.Role to manage user roles.');
    return;
  }

  setFullName(name) {
    this.set(User.keys.FULL_NAME, name);
  }

  setFirstName(firstName) {
    this.set(User.keys.FIRST_NAME, firstName);
  }

  setLastName(lastName) {
    this.set(User.keys.LAST_NAME, lastName);
  }

  setAvatar(avatarUrl) {
    this.set(User.keys.AVATAR, avatarUrl);
  }

  setAvatarFile(file) {
    if (!(file instanceof Parse.File)) {
      throw new Error('avatarFile must be an instance of Parse.File');
    }
    this.set(User.keys.AVATAR_FILE, file);
  }

  setPhoneNumber(phoneNumber) {
    this.set(User.keys.PHONE_NUMBER, phoneNumber);
  }

  setCountryDialCode(dialCode) {
    this.set(User.keys.COUNTRY_DIAL_CODE, dialCode);
  }

  setAgent(agent) {
    if (!(agent instanceof Agent)) {
      throw new Error('agent must be an instance of Agent');
    }
    this.set(User.keys.AGENT, agent);
    this.set(User.keys.AGENT_ID, agent.id);
  }

  setAgency(agency) {
    if (!(agency instanceof Agent)) {
      throw new Error('agency must be an instance of Agent');
    }
    this.set(User.keys.AGENCY, agency);
    this.set(User.keys.AGENCY_ID, agency.id);
  }

  setHost(host) {
    if (!(host instanceof Host)) {
      throw new Error('host must be an instance of Host');
    }
    this.set(User.keys.HOST, host);
    this.set(User.keys.HOST_ID, host.id);
  }

  // Role checks
  async getRoles() {
    const rolesQuery = new Parse.Query(Parse.Role);
    rolesQuery.equalTo('users', this);
    const roles = await rolesQuery.find();
    return roles.map(role => role.getName());
  }

  async hasRole(roleName) {
    const roleQuery = new Parse.Query(Parse.Role);
    roleQuery.equalTo('name', roleName);
    roleQuery.equalTo('users', this);
    const role = await roleQuery.first();
    return !!role;
  }

  async isHost() {
    return await this.hasRole(User.roles.HOST);
  }

  async isAgent() {
    return await this.hasRole(User.roles.AGENT);
  }

  async isAdmin() {
    return await this.hasRole(User.roles.ADMIN);
  }

  // Static methods for queries
  static async getUserById(userId) {
    const query = new Parse.Query(User);
    return query.get(userId);
  }

  static async getUserByEmail(email) {
    const query = new Parse.Query(User);
    query.equalTo(User.keys.EMAIL, email);
    return query.first();
  }

  static async getUsersByRole(roleName) {
    if (!Object.values(User.roles).includes(roleName)) {
      throw new Error(`Invalid role. Must be one of: ${Object.values(User.roles).join(', ')}`);
    }

    // First get the role
    const roleQuery = new Parse.Query(Parse.Role);
    roleQuery.equalTo('name', roleName);
    const role = await roleQuery.first();

    if (!role) {
      return [];
    }

    // Then get the users with this role
    const relation = role.getUsers();
    const userQuery = relation.query();
    return userQuery.find();
  }

  static async getAgencyUsers(agencyId) {
    const query = new Parse.Query(User);
    query.equalTo(User.keys.AGENCY_ID, agencyId);
    return query.find();
  }
}

// Register the User subclass
Parse.Object.registerSubclass('_User', User);
