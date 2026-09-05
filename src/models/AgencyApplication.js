import Parse from 'parse';
import User from './User';
import Report from './Report';

export default class AgencyApplication extends Parse.Object {
  constructor() {
    super('AgencyApplication');
  }

  // Class constants
  static get className() { return 'AgencyApplication'; }

  // Application Status
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
  static get keys() {
    return {
      AUTHOR: 'author',
      AUTHOR_ID: 'authorId',
      STATUS: 'status',
      REPORT: 'report',
      AGENCY_NAME: 'agencyName',
      AGENCY_DESCRIPTION: 'agencyDescription',
      CONTACT_EMAIL: 'contactEmail',
      PAYMENT_METHOD: 'paymentMethod',
      FIRST_NAME: 'firstName',
      LAST_NAME: 'lastName',
      DATE_OF_BIRTH: 'dateOfBirth',
      COUNTRY: 'country',
      ADDRESS: 'address',
      MESSAGE: 'message',
      DOCS_FILES: 'docsFiles',
      UID: 'uid',
    };
  }

  // Getters
  get author() {
    return this.get(AgencyApplication.keys.AUTHOR);
  }

  get authorId() {
    return this.get(AgencyApplication.keys.AUTHOR_ID);
  }

  get status() {
    return this.get(AgencyApplication.keys.STATUS) || AgencyApplication.status.PENDING;
  }

  get report() {
    return this.get(AgencyApplication.keys.REPORT);
  }

  get agencyName() {
    return this.get(AgencyApplication.keys.AGENCY_NAME);
  }

  get agencyDescription() {
    return this.get(AgencyApplication.keys.AGENCY_DESCRIPTION);
  }

  get contactEmail() {
    return this.get(AgencyApplication.keys.CONTACT_EMAIL);
  }

  get paymentMethod() {
    return this.get(AgencyApplication.keys.PAYMENT_METHOD);
  }

  get firstName() {
    return this.get(AgencyApplication.keys.FIRST_NAME);
  }

  get lastName() {
    return this.get(AgencyApplication.keys.LAST_NAME);
  }

  get dateOfBirth() {
    return this.get(AgencyApplication.keys.DATE_OF_BIRTH);
  }

  get country() {
    return this.get(AgencyApplication.keys.COUNTRY);
  }

  get address() {
    return this.get(AgencyApplication.keys.ADDRESS);
  }

  get message() {
    return this.get(AgencyApplication.keys.MESSAGE);
  }

  get docsFiles() {
    return this.get(AgencyApplication.keys.DOCS_FILES);
  }

  get uid() {
    return this.get(AgencyApplication.keys.UID);
  }

  // Setters
  setAuthor(author) {
    if (!(author instanceof User || author instanceof Parse.User)) {
      throw new Error('author must be an instance of User or Parse.User');
    }
    this.set(AgencyApplication.keys.AUTHOR, author);
    this.set(AgencyApplication.keys.AUTHOR_ID, author.id);
  }

  setStatus(status) {
    if (!Object.values(AgencyApplication.status).includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${Object.values(AgencyApplication.status).join(', ')}`);
    }
    this.set(AgencyApplication.keys.STATUS, status);
  }

  setReport(report) {
    if (!(report instanceof Report)) {
      throw new Error('report must be an instance of Report');
    }
    this.set(AgencyApplication.keys.REPORT, report);
  }

  setAgencyName(name) {
    this.set(AgencyApplication.keys.AGENCY_NAME, name);
  }

  setAgencyDescription(description) {
    this.set(AgencyApplication.keys.AGENCY_DESCRIPTION, description);
  }

  setContactEmail(email) {
    this.set(AgencyApplication.keys.CONTACT_EMAIL, email);
  }

  setPaymentMethod(method) {
    this.set(AgencyApplication.keys.PAYMENT_METHOD, method);
  }

  setFirstName(firstName) {
    this.set(AgencyApplication.keys.FIRST_NAME, firstName);
  }

  setLastName(lastName) {
    this.set(AgencyApplication.keys.LAST_NAME, lastName);
  }

  setDateOfBirth(dateOfBirth) {
    this.set(AgencyApplication.keys.DATE_OF_BIRTH, dateOfBirth);
  }

  setCountry(country) {
    this.set(AgencyApplication.keys.COUNTRY, country);
  }

  setAddress(address) {
    this.set(AgencyApplication.keys.ADDRESS, address);
  }

  setMessage(message) {
    this.set(AgencyApplication.keys.MESSAGE, message);
  }

  setDocsFiles(docsFiles) {
    this.set(AgencyApplication.keys.DOCS_FILES, docsFiles);
  }

  setUid(uid) {
    this.set(AgencyApplication.keys.UID, uid);
  }

  // Static methods for queries
  static async getApplicationByAuthorId(authorId) {
    const query = new Parse.Query(AgencyApplication);
    query.equalTo(AgencyApplication.keys.AUTHOR_ID, authorId);
    return query.first();
  }

  static async getApplicationsByStatus(status) {
    if (!Object.values(AgencyApplication.status).includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${Object.values(AgencyApplication.status).join(', ')}`);
    }
    const query = new Parse.Query(AgencyApplication);
    query.equalTo(AgencyApplication.keys.STATUS, status);
    return query.find();
  }

  static async getPendingApplications() {
    return this.getApplicationsByStatus(AgencyApplication.status.PENDING);
  }
}

// Register the AgencyApplication subclass
Parse.Object.registerSubclass('AgencyApplication', AgencyApplication);
