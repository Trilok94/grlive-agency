import Parse from 'parse';
import { convertDiamondsToUsdFormat } from '../utils/helpers';
import User from './User';

class HostSupporterStats extends Parse.Object {
  constructor() {
    super('HostSupporterStats');
  }

  // Keys
  static keys = {
    DATE: 'date',
    SENDER: 'sender',
    SENDER_ID: 'senderId',
    RECEIVER: 'receiver',
    RECEIVER_ID: 'receiverId',
    RECEIVER_UID: 'receiverUid',
    HOST: 'host',
    HOST_ID: 'hostId',
    CREDITS: 'credits',
    DIAMONDS: 'diamonds',
    TOTAL_RECEIVED: 'totalReceived'
  };

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

  static getPeriodDates(period) {
    const now = new Date();
    const startDate = new Date();
    const endDate = new Date();

    switch (period) {
      case this.periodsKeys.today:
        startDate.setHours(0, 0, 0, 0);
        break;
      case this.periodsKeys.yesterday:
        startDate.setDate(now.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setDate(now.getDate() - 1);
        endDate.setHours(23, 59, 59, 999);
        break;
      case this.periodsKeys.thisWeek:
        startDate.setDate(now.getDate() - now.getDay());
        startDate.setHours(0, 0, 0, 0);
        break;
      case this.periodsKeys.lastWeek:
        startDate.setDate(now.getDate() - now.getDay() - 7);
        startDate.setHours(0, 0, 0, 0);
        endDate.setDate(now.getDate() - now.getDay() - 1);
        endDate.setHours(23, 59, 59, 999);
        break;
      case this.periodsKeys.thisMonth:
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case this.periodsKeys.lastMonth:
        startDate.setMonth(now.getMonth() - 1, 1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setDate(0); // Last day of previous month
        endDate.setHours(23, 59, 59, 999);
        break;
      case this.periodsKeys.last30Days:
        startDate.setDate(now.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
        break;
      case this.periodsKeys.last90Days:
        startDate.setDate(now.getDate() - 90);
        startDate.setHours(0, 0, 0, 0);
        break;
      default:
        startDate.setDate(now.getDate() - 30); // Default to last 30 days
        startDate.setHours(0, 0, 0, 0);
    }

    return { startDate, endDate };
  }

  // Get top supporters for a host with period filter
  static async getTopSupporters(receiverId, period = this.periodsKeys.last30Days, limit = 10) {
    const query = new Parse.Query(HostSupporterStats);
    const { startDate, endDate } = this.getPeriodDates(period);

    // Filter by receiver and date
    query.equalTo(HostSupporterStats.keys.RECEIVER_ID, receiverId);
    query.greaterThanOrEqualTo(HostSupporterStats.keys.DATE, startDate);
    if (endDate) {
      query.lessThanOrEqualTo(HostSupporterStats.keys.DATE, endDate);
    }

    // Include sender data
    query.include(HostSupporterStats.keys.SENDER);
    
    // Sort by diamonds (highest first)
    query.descending(HostSupporterStats.keys.DIAMONDS);
    query.limit(limit);

    const results = await query.find();

    // Group results by sender
    const supporterMap = new Map();
    
    results.forEach(stat => {
      const senderId = stat.get(HostSupporterStats.keys.SENDER_ID);
      const sender = stat.get(HostSupporterStats.keys.SENDER);
      
      if (!supporterMap.has(senderId)) {
        supporterMap.set(senderId, {
          sender,
          totalCredits: 0,
          totalDiamonds: 0,
          lastSupport: stat.get(HostSupporterStats.keys.DATE),
          totalReceived: 0
        });
      }
      
      const supporter = supporterMap.get(senderId);
      supporter.totalCredits += stat.get(HostSupporterStats.keys.CREDITS) || 0;
      supporter.totalDiamonds += stat.get(HostSupporterStats.keys.DIAMONDS) || 0;
      supporter.totalReceived += stat.get(HostSupporterStats.keys.TOTAL_RECEIVED) || 0;
      
      const statDate = stat.get(HostSupporterStats.keys.DATE);
      if (statDate > supporter.lastSupport) {
        supporter.lastSupport = statDate;
      }
    });

    // Convert map to array and sort by total diamonds
    const sortedSupporters = Array.from(supporterMap.values())
      .sort((a, b) => b.totalDiamonds - a.totalDiamonds)
      .slice(0, limit);
    
    return sortedSupporters.map(supporter => ({
      user: supporter.sender?.get(User.keys.FULL_NAME),
      userId: supporter.sender?.id,
      totalSupport: convertDiamondsToUsdFormat(supporter.totalDiamonds), // Convert diamonds to dollars
      totalGifts: supporter.totalReceived,
      totalCredits: supporter.totalCredits,
      totalDiamonds: supporter.totalDiamonds,
    }));
  }

  // Helper method to create a new stats entry
  static create(attributes = {}) {
    const stats = new HostSupporterStats();
    Object.entries(attributes).forEach(([key, value]) => {
      stats.set(key, value);
    });
    return stats;
  }

  // Static method to query stats
  static query() {
    return new Parse.Query(HostSupporterStats);
  }
}

// Register the subclass with Parse
Parse.Object.registerSubclass('HostSupporterStats', HostSupporterStats);

export default HostSupporterStats;
