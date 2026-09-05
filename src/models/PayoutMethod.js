import Parse from 'parse';
import User from './User';

/**
 * PayoutMethod model for handling payout methods like bank accounts, PayPal, etc.
 * Based on the Flutter PayoutMethodModel
 */
class PayoutMethod extends Parse.Object {
  constructor() {
    super('PayoutMethod');
  }

  // Payment method types
  static paymentMethods = {
    PAYONEER: 'payoneer',
    BNB: 'bnb',
    PAYPAL: 'paypal',
    USDT: 'usdt',
    IBAN: 'iban',
    VALLET: 'vallet',
    BANK: 'bank' // Added for consistency with the agency dashboard
  };

  // Keys for Parse fields
  static keys = {
    CREATED_AT: 'createdAt',
    UPDATED_AT: 'updatedAt',
    OBJECT_ID: 'objectId',
    
    PAYMENT_METHOD: 'payment_method',
    
    AUTHOR: 'author',
    AUTHOR_ID: 'authorId',
    
    NAME: 'name',
    SURNAME: 'surname',
    EMAIL: 'email',
    
    WALLET_ADDRESS: 'wallet_address',
    
    // New fields
    COUNTRY: 'country',
    CITY: 'city',
    ACCOUNT_ID: 'account_id',
    BANK_NAME: 'bank_name',
    PHONE_NUMBER: 'phone_number',
    
    // Additional fields for banking info
    ACCOUNT_HOLDER: 'account_holder',
    ACCOUNT_NUMBER: 'account_number',
    ROUTING_NUMBER: 'routing_number',
    SWIFT_CODE: 'swift_code',
    IBAN_NUMBER: 'iban_number',
    POSTAL_CODE: 'postal_code'
  };

  // Getters and setters
  getWalletAddress() {
    return this.get(PayoutMethod.keys.WALLET_ADDRESS) || '';
  }
  
  setWalletAddress(walletAddress) {
    this.set(PayoutMethod.keys.WALLET_ADDRESS, walletAddress);
    return this;
  }
  
  getEmail() {
    return this.get(PayoutMethod.keys.EMAIL) || '';
  }
  
  setEmail(email) {
    this.set(PayoutMethod.keys.EMAIL, email);
    return this;
  }
  
  getName() {
    return this.get(PayoutMethod.keys.NAME) || '';
  }
  
  setName(name) {
    this.set(PayoutMethod.keys.NAME, name);
    return this;
  }
  
  getSurname() {
    return this.get(PayoutMethod.keys.SURNAME) || '';
  }
  
  setSurname(surname) {
    this.set(PayoutMethod.keys.SURNAME, surname);
    return this;
  }
  
  getAuthorId() {
    return this.get(PayoutMethod.keys.AUTHOR_ID);
  }
  
  setAuthorId(authorId) {
    this.set(PayoutMethod.keys.AUTHOR_ID, authorId);
    return this;
  }
  
  getAuthor() {
    return this.get(PayoutMethod.keys.AUTHOR);
  }
  
  setAuthor(author) {
    this.set(PayoutMethod.keys.AUTHOR, author);
    return this;
  }
  
  getPaymentMethod() {
    return this.get(PayoutMethod.keys.PAYMENT_METHOD) || '';
  }
  
  setPaymentMethod(method) {
    this.set(PayoutMethod.keys.PAYMENT_METHOD, method);
    return this;
  }
  
  // New getters and setters
  getCountry() {
    return this.get(PayoutMethod.keys.COUNTRY) || '';
  }
  
  setCountry(country) {
    this.set(PayoutMethod.keys.COUNTRY, country);
    return this;
  }
  
  getCity() {
    return this.get(PayoutMethod.keys.CITY) || '';
  }
  
  setCity(city) {
    this.set(PayoutMethod.keys.CITY, city);
    return this;
  }
  
  getAccountId() {
    return this.get(PayoutMethod.keys.ACCOUNT_ID) || '';
  }
  
  setAccountId(accountId) {
    this.set(PayoutMethod.keys.ACCOUNT_ID, accountId);
    return this;
  }
  
  getBankName() {
    return this.get(PayoutMethod.keys.BANK_NAME) || '';
  }
  
  setBankName(bankName) {
    this.set(PayoutMethod.keys.BANK_NAME, bankName);
    return this;
  }
  
  getPhoneNumber() {
    return this.get(PayoutMethod.keys.PHONE_NUMBER) || '';
  }
  
  setPhoneNumber(phoneNumber) {
    this.set(PayoutMethod.keys.PHONE_NUMBER, phoneNumber);
    return this;
  }
  
  // Additional methods for banking info
  getAccountHolder() {
    return this.get(PayoutMethod.keys.ACCOUNT_HOLDER) || '';
  }
  
  setAccountHolder(accountHolder) {
    this.set(PayoutMethod.keys.ACCOUNT_HOLDER, accountHolder);
    return this;
  }
  
  getAccountNumber() {
    return this.get(PayoutMethod.keys.ACCOUNT_NUMBER) || '';
  }
  
  setAccountNumber(accountNumber) {
    this.set(PayoutMethod.keys.ACCOUNT_NUMBER, accountNumber);
    return this;
  }
  
  getRoutingNumber() {
    return this.get(PayoutMethod.keys.ROUTING_NUMBER) || '';
  }
  
  setRoutingNumber(routingNumber) {
    this.set(PayoutMethod.keys.ROUTING_NUMBER, routingNumber);
    return this;
  }
  
  getSwiftCode() {
    return this.get(PayoutMethod.keys.SWIFT_CODE) || '';
  }
  
  setSwiftCode(swiftCode) {
    this.set(PayoutMethod.keys.SWIFT_CODE, swiftCode);
    return this;
  }
  
  getIbanNumber() {
    return this.get(PayoutMethod.keys.IBAN_NUMBER) || '';
  }
  
  setIbanNumber(ibanNumber) {
    this.set(PayoutMethod.keys.IBAN_NUMBER, ibanNumber);
    return this;
  }
  
  getPostalCode() {
    return this.get(PayoutMethod.keys.POSTAL_CODE) || '';
  }
  
  setPostalCode(postalCode) {
    this.set(PayoutMethod.keys.POSTAL_CODE, postalCode);
    return this;
  }
  
  /**
   * Create a new payout method for a user
   * @param {Object} data - The payout method data
   * @param {Parse.User} user - The user to associate with this payout method
   * @returns {Promise<PayoutMethod>} The saved payout method
   */
  static async createPayoutMethod(data, user) {
    const payoutMethod = new PayoutMethod();
    
    // Set the author
    const userPointer = new Parse.User();
    userPointer.id = user.id;
    payoutMethod.setAuthor(userPointer);
    payoutMethod.setAuthorId(user.id);
    
    // Set payment method type
    payoutMethod.setPaymentMethod(data.paymentMethod);
    
    // Set common fields
    if (data.name) payoutMethod.setName(data.name);
    if (data.surname) payoutMethod.setSurname(data.surname);
    if (data.email) payoutMethod.setEmail(data.email);
    if (data.country) payoutMethod.setCountry(data.country);
    if (data.city) payoutMethod.setCity(data.city);
    if (data.phoneNumber) payoutMethod.setPhoneNumber(data.phoneNumber);
    
    // Set method-specific fields
    switch (data.paymentMethod) {
      case PayoutMethod.paymentMethods.PAYPAL:
        payoutMethod.setEmail(data.email);
        break;
      case PayoutMethod.paymentMethods.BANK:
      case PayoutMethod.paymentMethods.IBAN:
        payoutMethod.setBankName(data.bankName);
        payoutMethod.setAccountHolder(data.accountHolder);
        payoutMethod.setAccountNumber(data.accountNumber);
        payoutMethod.setRoutingNumber(data.routingNumber);
        payoutMethod.setSwiftCode(data.swiftCode);
        payoutMethod.setIbanNumber(data.ibanNumber);
        break;
      case PayoutMethod.paymentMethods.USDT:
      case PayoutMethod.paymentMethods.BNB:
      case PayoutMethod.paymentMethods.VALLET:
        payoutMethod.setWalletAddress(data.accountId);
        payoutMethod.setBankName(data.bankName);
        payoutMethod.setAccountId(data.accountId);
        payoutMethod.setAccountHolder(data.accountHolder);
        payoutMethod.setSwiftCode(data.swiftCode);
        payoutMethod.setIbanNumber(data.ibanNumber);
        break;
    }
    
    return await payoutMethod.save();
  }
  
  /**
   * Get all payout methods for a user
   * @param {string} userId - The user ID to get payout methods for
   * @returns {Promise<Array<PayoutMethod>>} Array of payout methods
   */
  static async getPayoutMethodsForUser(userId) {
    const query = new Parse.Query(PayoutMethod);
    query.equalTo(PayoutMethod.keys.AUTHOR_ID, userId);
    return await query.find();
  }
  
  /**
   * Get a specific payout method by ID
   * @param {string} payoutMethodId - The ID of the payout method to get
   * @returns {Promise<PayoutMethod|null>} The payout method or null if not found
   */
  static async getPayoutMethodById(payoutMethodId) {
    const query = new Parse.Query(PayoutMethod);
    return await query.get(payoutMethodId);
  }
}

// Register the PayoutMethod subclass
Parse.Object.registerSubclass('PayoutMethod', PayoutMethod);

export default PayoutMethod;
