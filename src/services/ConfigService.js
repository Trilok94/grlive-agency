import Parse from 'parse';

class ConfigService {
  static instance = null;
  #config = null;

  static getInstance() {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  async initialize() {
    try {
      this.#config = await Parse.Config.get();
    } catch (error) {
      console.error('Error fetching Parse config:', error);
      throw error;
    }
  }

  getPlatformFees() {
    return this.#config?.get('platform_fees') ?? 30; // default 30%
  }

  getUSDValue() {
    return this.#config?.get('usd_credits') ?? 1; // default value
  }

  getCoinsValue() {
    return this.#config?.get('credits_usd') ?? 185; // default value
  }

  getWithdrawPercent() {
    return this.#config?.get('withdraw_percent') ?? 100; // default 100%
  }

  getCoinValueUsd() {
    return this.getUSDValue() / this.getCoinsValue();
  }
  
  getPayoutValletFees() {
    return this.#config?.get('payout_vallet_fees') ?? 4.5; // default 4.5%
  }
  
  getDiamondsNeededToRedeem() {
    return this.#config?.get('diamonds_needed_to_redeem') ?? 4000; // default 4000 diamonds
  }
  
  getPayoutArrivalHours() {
    return this.#config?.get('payout_arrival_hours') ?? 72; // default 72 hours (3 days)
  }

  getUserCanJoinAgencyFromDashboard() {
    return this.#config?.get('join_agency_from_dashboard') ?? false; // default false
  }

  getAgentFixedCommissionAmount() {
    return this.#config?.get('agent_fixed_commission_amount') ?? 5; // default 5
  }

  isAgentCommissionFixed() {
    return this.#config?.get('is_agent_commission_fixed') ?? true; // default false
  }
}

export default ConfigService;
