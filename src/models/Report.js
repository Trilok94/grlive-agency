import Parse from 'parse';
import User from './User';

export default class Report extends Parse.Object {
  constructor() {
    super('Report');
  }

  // Class constants
  static get className() { return 'Report'; }

  // Report Types
  static get reportTypes() {
    return {
      PROFILE: 'PROFILE',
      POST: 'POST',
      LIVE: 'LIVE'
    };
  }

  // Report States
  static get states() {
    return {
      RESOLVED: 'resolved',
      PENDING: 'pending'
    };
  }

  // Report Categories
  static get categories() {
    return {
      CONSULT: 'CAT_CON',
      REPORT_COMPLAINT: 'CAT_REP',
      FEEDBACKS: 'CAT_FED',
      BUSINESS_COOPERATION: 'CAT_BUS_COO'
    };
  }

  // Report Types
  static get reportReasons() {
    return {
      FAKE_PROFILE: 'fake_profile',
      RUDE: 'rude',
      INAPPROPRIATE: 'inappropriate',
      SCAM_COMMERCIAL: 'scam_commercial',
      HATE: 'hate',
      BAD_BEHAVIOR: 'bad_behavior',
      UNDERAGE: 'underage',
      NOT_INTERESTED: 'not_interested'
    };
  }

  // Business application types
  static get businessApplicationTypes() {
    return {
      AGENCY_APPLICATION: 'BUS_AGE_APP',
      HOST_APPLICATION: 'BUS_AGE_HOST'
    };
  }

  // Consult Types
  static get consultTypes() {
    return {
      HOST_REWARD: 'CON_HOT_REW',
      FAILURE_RECEIVING_COIN: 'CON_FAIL_COI',
      FACE_AUTHENTICATION: 'CON_FAC_AUT',
      CHANGE_GENDER: 'CON_CHA_GEN',
      APPEAL_ACCOUNT_SUSPENSION: 'CON_ACC_SUS',
      INVITATION_REWARD: 'CON_INV_REW',
      OTHER: 'CON_OTH'
    };
  }

  // Field keys
  static get keys() {
    return {
      ACCUSER: 'accuser',
      ACCUSER_ID: 'accuserId',
      ACCUSED: 'accused',
      ACCUSED_ID: 'accusedId',
      MESSAGE: 'message',
      DESCRIPTION: 'description',
      RESPONSE: 'response',
      STATE: 'state',
      REPORT_TYPE: 'reportType',
      REPORT_POST: 'post',
      REPORT_LIVE_STREAMING: 'live',
      IMAGES_LIST: 'list_of_images',
      VIDEO: 'video',
      VIDEO_THUMBNAIL: 'thumbnail',
      CATEGORY_QUESTION: 'category_question',
      ISSUE_DETAIL: 'issue_detail',
      CATEGORY_QUESTION_CODE: 'category_question_code',
      ISSUE_DETAIL_CODE: 'issue_detail_code',
      USER_UID: 'uid',
      // Agency fields
      AGENCY_NAME: 'agency_name',
      AGENCY_DESCRIPTION: 'agency_description',
      CONTACT_EMAIL: 'contact_email',
      PAYMENT_METHOD: 'payment_method'
    };
  }

  // Getters
  get accuser() {
    return this.get(Report.keys.ACCUSER);
  }

  get accuserId() {
    return this.get(Report.keys.ACCUSER_ID);
  }

  get accused() {
    return this.get(Report.keys.ACCUSED);
  }

  get accusedId() {
    return this.get(Report.keys.ACCUSED_ID);
  }

  get message() {
    return this.get(Report.keys.MESSAGE);
  }

  get description() {
    return this.get(Report.keys.DESCRIPTION) || '';
  }

  get response() {
    return this.get(Report.keys.RESPONSE) || '';
  }

  get state() {
    return this.get(Report.keys.STATE) || Report.states.PENDING;
  }

  get reportType() {
    return this.get(Report.keys.REPORT_TYPE);
  }

  get imagesList() {
    return this.get(Report.keys.IMAGES_LIST) || [];
  }

  get video() {
    return this.get(Report.keys.VIDEO);
  }

  get videoThumbnail() {
    return this.get(Report.keys.VIDEO_THUMBNAIL);
  }

  get categoryQuestion() {
    return this.get(Report.keys.CATEGORY_QUESTION);
  }

  get issueDetail() {
    return this.get(Report.keys.ISSUE_DETAIL);
  }

  get categoryQuestionCode() {
    return this.get(Report.keys.CATEGORY_QUESTION_CODE);
  }

  get issueDetailCode() {
    return this.get(Report.keys.ISSUE_DETAIL_CODE);
  }

  get userUid() {
    return this.get(Report.keys.USER_UID);
  }

  // Setters
  setAccuser(accuser) {
    if (!(accuser instanceof User)) {
      throw new Error('accuser must be an instance of User');
    }
    this.set(Report.keys.ACCUSER, accuser);
    this.set(Report.keys.ACCUSER_ID, accuser.id);
    this.set(Report.keys.USER_UID, accuser.get('uid'));
  }

  setAccused(accused) {
    if (!(accused instanceof User)) {
      throw new Error('accused must be an instance of User');
    }
    this.set(Report.keys.ACCUSED, accused);
    this.set(Report.keys.ACCUSED_ID, accused.id);
  }

  setMessage(message) {
    this.set(Report.keys.MESSAGE, message);
  }

  setDescription(description) {
    this.set(Report.keys.DESCRIPTION, description);
  }

  setResponse(response) {
    this.set(Report.keys.RESPONSE, response);
  }

  setState(state) {
    if (!Object.values(Report.states).includes(state)) {
      throw new Error(`Invalid state. Must be one of: ${Object.values(Report.states).join(', ')}`);
    }
    this.set(Report.keys.STATE, state);
  }

  setReportType(reportType) {
    if (!Object.values(Report.reportTypes).includes(reportType)) {
      throw new Error(`Invalid report type. Must be one of: ${Object.values(Report.reportTypes).join(', ')}`);
    }
    this.set(Report.keys.REPORT_TYPE, reportType);
  }

  setImagesList(imagesList) {
    if (!Array.isArray(imagesList)) {
      throw new Error('imagesList must be an array of Parse.File');
    }
    imagesList.forEach(image => {
      if (!(image instanceof Parse.File)) {
        throw new Error('Each image must be an instance of Parse.File');
      }
    });
    this.set(Report.keys.IMAGES_LIST, imagesList);
  }

  setVideo(video) {
    if (!(video instanceof Parse.File)) {
      throw new Error('video must be an instance of Parse.File');
    }
    this.set(Report.keys.VIDEO, video);
  }

  setVideoThumbnail(thumbnail) {
    if (!(thumbnail instanceof Parse.File)) {
      throw new Error('thumbnail must be an instance of Parse.File');
    }
    this.set(Report.keys.VIDEO_THUMBNAIL, thumbnail);
  }

  setCategoryQuestion(category) {
    this.set(Report.keys.CATEGORY_QUESTION, category);
  }

  setIssueDetail(issue) {
    this.set(Report.keys.ISSUE_DETAIL, issue);
  }

  setCategoryQuestionCode(code) {
    this.set(Report.keys.CATEGORY_QUESTION_CODE, code);
  }

  setIssueDetailCode(code) {
    this.set(Report.keys.ISSUE_DETAIL_CODE, code);
  }

  setUserUid(uid) {
    this.set(Report.keys.USER_UID, uid);
  }

  // Agency field getters
  get agencyName() {
    return this.get(Report.keys.AGENCY_NAME);
  }

  get agencyDescription() {
    return this.get(Report.keys.AGENCY_DESCRIPTION);
  }

  get contactEmail() {
    return this.get(Report.keys.CONTACT_EMAIL);
  }

  get paymentMethod() {
    return this.get(Report.keys.PAYMENT_METHOD);
  }

  // Agency field setters
  setAgencyName(name) {
    this.set(Report.keys.AGENCY_NAME, name);
  }

  setAgencyDescription(description) {
    this.set(Report.keys.AGENCY_DESCRIPTION, description);
  }

  setContactEmail(email) {
    this.set(Report.keys.CONTACT_EMAIL, email);
  }

  setPaymentMethod(method) {
    this.set(Report.keys.PAYMENT_METHOD, method);
  }
}

// Register the Report subclass
Parse.Object.registerSubclass('Report', Report);
