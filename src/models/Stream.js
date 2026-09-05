// Stream.js
import Parse from 'parse';
import { convertDiamondsToUsdFormat } from '../utils/helpers';

export default class Stream extends Parse.Object {
    constructor() {
      super(Stream.keyTableName);
    }
  
    // Clone functionality (similar to Dart's ParseCloneable)
    clone(map) {
      const cloned = new Stream();
      Object.keys(map).forEach(key => {
        cloned.set(key, map[key]);
      });
      return cloned;
    }
  
    // Table name constant
    static get keyTableName() { return 'Stream'; }
  
    // Class constants
    static get className() { return Stream.keyTableName; }

  // Constants
  static get STREAM_TYPE() {
    return {
      LIVE_MULTI: "live_multi",
      LIVE: "live",
      LIVE_AUDIO: "audio",
      GAME: "game"
    };
  }

  static get AUDIENCE_TYPE() {
    return {
      PUBLIC: "public",
      PRIVATE: "private",
      PREMIUM: "premium"
    };
  }

  static periodsKeys = {
    today: 'today',
    yesterday: 'yesterday',
    thisWeek: 'thisWeek',
    lastWeek: 'lastWeek',
    thisMonth: 'thisMonth',
    lastMonth: 'lastMonth',
    last30Days: 'last30Days',
    last90Days: 'last90Days'
  };

  // Keys
  static get keys() {
    return {
      AUTHOR: "author",
      AUTHOR_ID: "authorId",
      AUTHOR_USER_NAME: "username",
      STREAM_TYPE: "type",
      STREAM_AUDIENCE_TYPE: "audienceType",
      STREAM_LIVE_ID: "liveId",
      ON_GOING: "onGoing",
      EVENT: "event",
      EVENT_ID: "eventId",
      VIEWERS_COUNTER: "viewersCount",
      ROOM_ID: "roomId",
      DIAMONDS: "diamonds",
      VIEWERS: "viewers",
      COMMENT_MUTED_USERS: "commentMutedUsers",
      MUTED_USERS: "mutedUsers",
      CO_HOSTS: "coHosts",
      VIEWERS_TOTAL: "viewersTotal",
      PRIVATE_GIFT: "private",
      COVER: "coverFile",
      BUYERS: "buyers",
      DESCRIPTION: "description",
      LIVE_TAG_ID: "liveTagId",
      IS_PK: "isPk",
      PK_DIAMONDS: "pk_diamonds",
      SEATS: "seats",
      OPPONENT_LIVE: "opponentLive",
      OPPONENT_LIVE_COVER: "opponentLive.coverFile",
      PK_STARTED_AT: "pkStartedAt",
      PK_SCORE_WIN: "pkWin",
      COUNTRY_CODE: "countryCode",
      CONTINENT_CODE: "continentCode",
      REGION: "region",
      SUB_REGION: "subRegion",
      CITY: "city",
      COUNTRY: "country",
      GIFT_GIVER: "gifterId",
      FOLLOWERS: "followers",
      VIEW_DURATION: "Duration",
      STARTED_AT: "startTime",
      ENDED_AT: "endTime",
      MESSAGE_ID: "messageId"
    };
  }

  // Author
  getAuthor() {
    return this.get(Stream.keys.AUTHOR);
  }

  setAuthor(user) {
    return this.set(Stream.keys.AUTHOR, user);
  }

  // GeoPoint
  getGeoPoint() {
    return this.get('geoPoint');
  }

  setGeoPoint(geoPoint) {
    return this.set('geoPoint', geoPoint);
  }

  // PK Start Time
  getPkStartTime() {
    return this.get(Stream.keys.PK_STARTED_AT) || new Date();
  }

  setPkStartTime(startTime) {
    return this.set(Stream.keys.PK_STARTED_AT, startTime);
  }

  // Opponent Live
  getOpponentLive() {
    return this.get(Stream.keys.OPPONENT_LIVE);
  }

  setOpponentLive(opponentLive) {
    return this.set(Stream.keys.OPPONENT_LIVE, opponentLive);
  }

  // Author ID
  getAuthorId() {
    return this.get(Stream.keys.AUTHOR_ID);
  }

  setAuthorId(userId) {
    return this.set(Stream.keys.AUTHOR_ID, userId);
  }

  // Author Username
  getAuthorUserName() {
    return this.get(Stream.keys.AUTHOR_USER_NAME) || "";
  }

  setAuthorUserName(username) {
    return this.set(Stream.keys.AUTHOR_USER_NAME, username);
  }

  // Live ID
  getLiveId() {
    return this.get(Stream.keys.STREAM_LIVE_ID) || "";
  }

  setLiveId(liveId) {
    return this.set(Stream.keys.STREAM_LIVE_ID, liveId);
  }

  // Stream Type
  getStreamType() {
    return this.get(Stream.keys.STREAM_TYPE) || Stream.STREAM_TYPE.LIVE;
  }

  setStreamType(type) {
    return this.set(Stream.keys.STREAM_TYPE, type);
  }

  // Stream Audience Type
  getStreamAudienceType() {
    return this.get(Stream.keys.STREAM_AUDIENCE_TYPE) || Stream.AUDIENCE_TYPE.PUBLIC;
  }

  setStreamAudienceType(audienceType) {
    return this.set(Stream.keys.STREAM_AUDIENCE_TYPE, audienceType);
  }

  // On Going
  isGoing() {
    return this.get(Stream.keys.ON_GOING) || false;
  }

  setOnGoing(onGoing) {
    return this.set(Stream.keys.ON_GOING, onGoing);
  }

  // Room ID
  getRoomId() {
    return this.get(Stream.keys.ROOM_ID) || "";
  }

  setRoomId(roomId) {
    return this.set(Stream.keys.ROOM_ID, roomId);
  }

  // Live Tag ID
  getLiveTagId() {
    return this.get(Stream.keys.LIVE_TAG_ID) || "";
  }

  setLiveTagId(liveTagId) {
    return this.set(Stream.keys.LIVE_TAG_ID, liveTagId);
  }

  // Live Title
  getLiveTitle() {
    return this.get(Stream.keys.DESCRIPTION) || this.getAuthor()?.get("fullName");
  }

  getLiveTitleNormal() {
    return this.get(Stream.keys.DESCRIPTION) || "";
  }

  getLiveTitleOrId() {
    return this.get(Stream.keys.DESCRIPTION) || this.getAuthor()?.get("uid")?.toString();
  }

  setLiveTitle(description) {
    return this.set(Stream.keys.DESCRIPTION, description);
  }

  // Live Seats
  getLiveSeats() {
    return this.get(Stream.keys.SEATS) || 1;
  }

  setLiveSeats(seats) {
    return this.set(Stream.keys.SEATS, seats);
  }

  // PK Score Win
  getPkScoreWin() {
    return this.get(Stream.keys.PK_SCORE_WIN) || 0;
  }

  // Static methods for querying streams
  static async getStreamsByPeriod(period, limit = 20) {
    const query = new Parse.Query(Stream);
    query.descending(Stream.keys.STARTED_AT);
    query.limit(limit);

    // Add period filter
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case Stream.periodsKeys.today:
        startDate.setHours(0, 0, 0, 0);
        break;
      case Stream.periodsKeys.yesterday:
        startDate.setDate(now.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case Stream.periodsKeys.thisWeek:
        startDate.setDate(now.getDate() - now.getDay());
        startDate.setHours(0, 0, 0, 0);
        break;
      case Stream.periodsKeys.lastWeek:
        startDate.setDate(now.getDate() - now.getDay() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;
      case Stream.periodsKeys.thisMonth:
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case Stream.periodsKeys.lastMonth:
        startDate.setMonth(now.getMonth() - 1);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case Stream.periodsKeys.last30Days:
        startDate.setDate(now.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
        break;
      case Stream.periodsKeys.last90Days:
        startDate.setDate(now.getDate() - 90);
        startDate.setHours(0, 0, 0, 0);
        break;
      default:
        startDate.setHours(0, 0, 0, 0);
    }

    query.greaterThanOrEqualTo(Stream.keys.STARTED_AT, startDate);
    
    // Handle end dates
    if (period === Stream.periodsKeys.lastMonth) {
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      query.lessThan(Stream.keys.STARTED_AT, endDate);
    } else if (period === Stream.periodsKeys.lastWeek) {
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);
      query.lessThan(Stream.keys.STARTED_AT, endDate);
    } else if (period === Stream.periodsKeys.yesterday) {
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      query.lessThan(Stream.keys.STARTED_AT, endDate);
    } else {
      // For today, thisWeek, thisMonth, last30Days, last90Days use current time as end date
      query.lessThan(Stream.keys.STARTED_AT, now);
    }

    return query.find();
  }

  addPkScoreWin() {
    return this.increment(Stream.keys.PK_SCORE_WIN);
  }

  restartPkScoreWin() {
    return this.set(Stream.keys.PK_SCORE_WIN, 0);
  }

  // PK Diamonds
  getPkDiamonds() {
    return this.get(Stream.keys.PK_DIAMONDS) || 0;
  }

  restartPkDiamonds() {
    return this.set(Stream.keys.PK_DIAMONDS, 0);
  }

  // Is PK
  isPk() {
    return this.get(Stream.keys.IS_PK) || false;
  }

  setPk(isPk) {
    return this.set(Stream.keys.IS_PK, isPk);
  }

  // Diamonds
  getDiamonds() {
    return this.get(Stream.keys.DIAMONDS) || 0;
  }

  // Viewers Count
  getViewersCount() {
    return this.get(Stream.keys.VIEWERS_COUNTER) || 0;
  }

  setViewersCount(totalCounter) {
    return this.set(Stream.keys.VIEWERS_COUNTER, totalCounter);
  }

  // Viewers Total
  getViewersTotal() {
    return this.get(Stream.keys.VIEWERS_TOTAL) || [];
  }

  addViewerTotal(objectId) {
    const viewers = this.getViewersTotal();
    if (!viewers.includes(objectId)) {
      viewers.push(objectId);
      return this.set(Stream.keys.VIEWERS_TOTAL, viewers);
    }
    return this;
  }

  // Viewers
  getViewers() {
    return this.get(Stream.keys.VIEWERS) || [];
  }

  addViewer(objectId) {
    const viewers = this.getViewers();
    if (!viewers.includes(objectId)) {
      viewers.push(objectId);
      return this.set(Stream.keys.VIEWERS, viewers);
    }
    return this;
  }

  removeViewer(objectId) {
    const viewers = this.getViewers().filter(id => id !== objectId);
    return this.set(Stream.keys.VIEWERS, viewers);
  }

  // Comment Muted Users
  getCommentMutedUsers() {
    return this.get(Stream.keys.COMMENT_MUTED_USERS) || [];
  }

  addCommentMutedUser(objectId) {
    const users = this.getCommentMutedUsers();
    if (!users.includes(objectId)) {
      users.push(objectId);
      return this.set(Stream.keys.COMMENT_MUTED_USERS, users);
    }
    return this;
  }

  removeCommentMutedUser(objectId) {
    const users = this.getCommentMutedUsers().filter(id => id !== objectId);
    return this.set(Stream.keys.COMMENT_MUTED_USERS, users);
  }

  // Muted Users
  getMutedUsers() {
    return this.get(Stream.keys.MUTED_USERS) || [];
  }

  addMutedUser(objectId) {
    const users = this.getMutedUsers();
    if (!users.includes(objectId)) {
      users.push(objectId);
      return this.set(Stream.keys.MUTED_USERS, users);
    }
    return this;
  }

  removeMutedUser(objectId) {
    const users = this.getMutedUsers().filter(id => id !== objectId);
    return this.set(Stream.keys.MUTED_USERS, users);
  }

  // Co-Hosts
  getCoHosts() {
    return this.get(Stream.keys.CO_HOSTS) || [];
  }

  addCoHost(objectId) {
    const hosts = this.getCoHosts();
    if (!hosts.includes(objectId)) {
      hosts.push(objectId);
      return this.set(Stream.keys.CO_HOSTS, hosts);
    }
    return this;
  }

  addAllCoHost(objectIds) {
    return this.set(Stream.keys.CO_HOSTS, objectIds);
  }

  removeCoHost(objectId) {
    const hosts = this.getCoHosts().filter(id => id !== objectId);
    return this.set(Stream.keys.CO_HOSTS, hosts);
  }

  // Private Gift
  getPrivateGift() {
    return this.get(Stream.keys.PRIVATE_GIFT);
  }

  setPrivateGift(gift) {
    return this.set(Stream.keys.PRIVATE_GIFT, gift);
  }

  // Gift Givers
  getGiftGivers() {
    return this.get(Stream.keys.GIFT_GIVER) || [];
  }

  // Followers
  getFollowers() {
    return this.get(Stream.keys.FOLLOWERS) || [];
  }

  // Cover File
  getCoverFile() {
    return this.get(Stream.keys.COVER) || this.getAuthor()?.get("avatarFile");
  }

  setCoverFile(coverFile) {
    return this.set(Stream.keys.COVER, coverFile);
  }

  // Buyers
  getBuyers() {
    return this.get(Stream.keys.BUYERS) || [];
  }

  addBuyer(objectId) {
    const buyers = this.getBuyers();
    if (!buyers.includes(objectId)) {
      buyers.push(objectId);
      return this.set(Stream.keys.BUYERS, buyers);
    }
    return this;
  }

  // Continent Code
  getContinentCode() {
    return this.get(Stream.keys.CONTINENT_CODE) || "";
  }

  setContinentCode(continentCode) {
    return this.set(Stream.keys.CONTINENT_CODE, continentCode);
  }

  // Country Code
  getCountryCode() {
    return this.get(Stream.keys.COUNTRY_CODE) || this.getAuthor()?.get("countryCode");
  }

  setCountryCode(countryCode) {
    return this.set(Stream.keys.COUNTRY_CODE, countryCode);
  }

  // Region
  getRegion() {
    return this.get(Stream.keys.REGION) || "";
  }

  setRegion(region) {
    return this.set(Stream.keys.REGION, region);
  }

  // Sub Region
  getSubRegion() {
    return this.get(Stream.keys.SUB_REGION) || "";
  }

  setSubRegion(subRegion) {
    return this.set(Stream.keys.SUB_REGION, subRegion);
  }

  // Country
  getCountry() {
    return this.get(Stream.keys.COUNTRY) || this.getAuthor()?.get("country");
  }

  setCountry(country) {
    return this.set(Stream.keys.COUNTRY, country);
  }

  // City
  getCity() {
    return this.get(Stream.keys.CITY) || "";
  }

  setCity(city) {
    return this.set(Stream.keys.CITY, city);
  }

  // Event
  getEvent() {
    return this.get(Stream.keys.EVENT);
  }

  setEvent(event) {
    return this.set(Stream.keys.EVENT, event);
  }

  // Event ID
  getEventId() {
    return this.get(Stream.keys.EVENT_ID);
  }

  setEventId(eventId) {
    return this.set(Stream.keys.EVENT_ID, eventId);
  }

  // View Duration
  getViewDuration() {
    return this.get(Stream.keys.VIEW_DURATION) || 0;
  }

  setViewDuration(viewDuration) {
    return this.increment(Stream.keys.VIEW_DURATION, viewDuration);
  }

  // Started At
  get startedAt() {
    return this.get(Stream.keys.STARTED_AT) || this.createdAt || new Date();
  }

  // Ended At
  get endedAt() {
    return this.get(Stream.keys.ENDED_AT) || new Date();
  }

  // Stream Type Checkers
  get isPremiumLive() {
    return this.getStreamAudienceType() === Stream.AUDIENCE_TYPE.PREMIUM;
  }

  get isPrivateLive() {
    return this.getStreamAudienceType() === Stream.AUDIENCE_TYPE.PRIVATE;
  }

  get isPublicLive() {
    return this.getStreamAudienceType() === Stream.AUDIENCE_TYPE.PUBLIC;
  }

  // Message ID
  getMessageId() {
    return this.get(Stream.keys.MESSAGE_ID);
  }

  setMessageId(messageId) {
    return this.set(Stream.keys.MESSAGE_ID, messageId);
  }

  // Helper method to create a new stream
  static create(attributes = {}) {
    const stream = new Stream();
    Object.entries(attributes).forEach(([key, value]) => {
      stream.set(key, value);
    });
    return stream;
  }

  // Static method to query streams
  static query() {
    return new Parse.Query(Stream);
  }

  // Query recent streams by author ID
  static async getRecentStreamsByAuthorId(authorId, limit = 5) {
    const query = new Parse.Query(Stream);
    query.equalTo(Stream.keys.AUTHOR_ID, authorId);
    query.descending('createdAt');
    query.limit(limit);
    return query.find();
  }

  // Format duration
  formatDuration() {
    const totalSeconds = this.getViewDuration() || 0;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}h ${minutes}min`;
  }

  // Calculate earnings
  getEarnings() {
    const diamonds = this.get(Stream.keys.DIAMONDS) || 0;
    return convertDiamondsToUsdFormat(diamonds);
  }
}

// Register the subclass with Parse
Parse.Object.registerSubclass(Stream.keyTableName, Stream);