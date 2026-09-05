import Parse from 'parse';
import User from './User';

export default class Transaction extends Parse.Object {
  constructor() {
    super(Transaction.keyTableName);
  }

  // Clone functionality (similar to Dart's ParseCloneable)
  clone(map) {
    const cloned = new Transaction();
    Object.keys(map).forEach(key => {
      cloned.set(key, map[key]);
    });
    return cloned;
  }

  // Table name constant
  static get keyTableName() { return 'Transactions'; }

  // Class constants
  static get className() { return Transaction.keyTableName; }

  // Transaction type constants
  static get transactionType() {
    return {
      TOP_UP: 'top_up',
      EXCHANGE: 'exchange',
      TRADING: 'trading',
      GIFT_LIVE: 'gift_live',
      HOST_COMMISSION: 'host_commission',
      COMPENSATION: 'compensation',
      PAYOUT_WITHDRAW: 'payout_withdraw',

    };
  }

  // Field keys
  static get keys() {
    return {
      TRANSACTION_TYPE: 'type',
      AUTHOR: 'author',
      AUTHOR_ID: 'authorId',
      RECEIVER: 'receiver',
      RECEIVER_ID: 'receiverId',
      CREDITS: 'credits',
      TRADING_CREDITS: 'trading',
      DIAMONDS: 'diamonds',
      CREDITS_AFTER: 'authorCredits',
      CREATED_AT: 'createdAt'
    };
  }

  // Getters
  get getAuthor() {
    return this.get(Transaction.keys.AUTHOR);
  }

  get getReceiver() {
    return this.get(Transaction.keys.RECEIVER);
  }

  get getAuthorId() {
    return this.get(Transaction.keys.AUTHOR_ID);
  }

  get getReceiverId() {
    return this.get(Transaction.keys.RECEIVER_ID);
  }

  get getTransactionType() {
    return this.get(Transaction.keys.TRANSACTION_TYPE);
  }

  get getCredits() {
    return this.get(Transaction.keys.CREDITS) ?? 0;
  }

  get getTradingCredits() {
    return this.get(Transaction.keys.TRADING_CREDITS) ?? 0;
  }

  get getDiamonds() {
    return this.get(Transaction.keys.DIAMONDS) ?? 0;
  }

  get getCreditsAfter() {
    return this.get(Transaction.keys.CREDITS_AFTER) ?? 0;
  }

  get getCreatedAt() {
    return this.get(Transaction.keys.CREATED_AT);
  }

  // Setters
  /**
   * @param {User} author
   */
  set setAuthor(author) {
    if (!(author instanceof User || author instanceof Parse.User)) {
      throw new Error('author must be an instance of User or Parse.User');
    }
    this.set(Transaction.keys.AUTHOR, author);
    this.set(Transaction.keys.AUTHOR_ID, author.id);
  }

  /**
   * @param {User} receiver
   */
  set setReceiver(receiver) {
    if (!(receiver instanceof User || receiver instanceof Parse.User)) {
      throw new Error('receiver must be an instance of User or Parse.User');
    }
    this.set(Transaction.keys.RECEIVER, receiver);
    this.set(Transaction.keys.RECEIVER_ID, receiver.id);
  }

  /**
   * @param {string} type
   */
  set setTransactionType(type) {
    if (!Object.values(Transaction.transactionType).includes(type)) {
      throw new Error(`Invalid type. Must be one of: ${Object.values(Transaction.transactionType).join(', ')}`);
    }
    this.set(Transaction.keys.TRANSACTION_TYPE, type);
  }

  /**
   * @param {number} credits
   */
  set setCredits(credits) {
    this.set(Transaction.keys.CREDITS, credits);
  }

  /**
   * @param {number} credits
   */
  set setTradingCredits(credits) {
    this.set(Transaction.keys.TRADING_CREDITS, credits);
  }

  /**
   * @param {number} diamonds
   */
  set setDiamonds(diamonds) {
    this.set(Transaction.keys.DIAMONDS, diamonds);
  }

  /**
   * @param {number} credits
   */
  set setCreditsAfter(credits) {
    this.set(Transaction.keys.CREDITS_AFTER, credits);
  }
}

// Register the Transaction subclass
Parse.Object.registerSubclass(Transaction.keyTableName, Transaction);
