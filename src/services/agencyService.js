import Report from '../models/Report';
import Parse from 'parse';
import AgencyApplication from '../models/AgencyApplication';
import Agent from '../models/Agent';
import User from '../models/User';
import PayoutMethod from '../models/PayoutMethod';

export const agencyService = {
  /**
   * Check if user has a pending agency application
   * @param {Parse.User} user - Current user
   * @returns {Promise<AgencyApplication|null>} The pending application if exists, null otherwise
   */
  async checkPendingApplication(user) {
    if (!user) return null;

    const query = new Parse.Query(AgencyApplication);
    query.equalTo(AgencyApplication.keys.AUTHOR_ID, user.id);
    query.containedIn(AgencyApplication.keys.STATUS, [AgencyApplication.status.REJECTED, AgencyApplication.status.PENDING, AgencyApplication.status.ACCEPTED, AgencyApplication.status.COMPLETED]);
    query.include(AgencyApplication.keys.REPORT);
    query.include(AgencyApplication.keys.AUTHOR);
    
    return query.first();
  },
  /**
   * Submit agency registration form by creating a report
   * @param {Object} params
   * @param {Parse.User} params.user - Current user submitting the form
   * @param {string} params.agencyName - Name of the agency
   * @param {string} params.agencyDescription - Description of the agency
   * @param {string} params.contactEmail - Contact email for the agency
   * @param {string} params.paymentMethod - Payment method for the agency
   * @param {Parse.File[]} params.docsFiles - Array of Parse.File documents
   * @returns {Promise<Report>} The created report
   */
  async submitAgencyRegistration({
    user,
    agencyName,
    agencyDescription,
    contactEmail,
    firstName,
    lastName,
    dateOfBirth,
    country,
    address,
    paymentMethod,
    docsFiles = []
  }) {
    // Validate inputs
    if (!user || !agencyName || !agencyDescription || !contactEmail || !paymentMethod || !firstName || !lastName || !dateOfBirth || !country || !address || !docsFiles) {
      throw new Error('Missing required fields');
    }

    if (!Array.isArray(docsFiles)) {
      throw new Error('Docs files must be an array of Parse.File');
    }

    // Create the report
    const agencyApplication = new AgencyApplication();

    // Set agency details
    agencyApplication.setAgencyName(agencyName);
    agencyApplication.setAgencyDescription(agencyDescription);
    agencyApplication.setContactEmail(contactEmail);
    agencyApplication.setFirstName(firstName);
    agencyApplication.setLastName(lastName);
    agencyApplication.setDateOfBirth(dateOfBirth);
    agencyApplication.setCountry(country);
    agencyApplication.setAddress(address);
    agencyApplication.setPaymentMethod(paymentMethod);
    agencyApplication.setAuthor(user);
    agencyApplication.setUid(user.get(User.keys.UID));
    agencyApplication.setStatus(AgencyApplication.status.PENDING);

    // Set documents
    if (docsFiles.length > 0) {
      agencyApplication.setDocsFiles(docsFiles);
    }

    // Save the report
    await agencyApplication.save();

    // Return the report - AgencyApplication will be created server-side
    return agencyApplication;
  },
  /**
   * Search for agencies based on a query string
   * @param {string} query - Search term for agency name or code
   * @returns {Promise<Array>} List of matching agencies
   */
  /**
   * Get an agency by its unique code
   * @param {string|number} code - The agency's unique code
   * @returns {Promise<Object|null>} The agency details if found, null otherwise
   * @throws {Error} If code is not a valid number
   */
  async getAgencyByCode(code) {
    try {
      // Convert code to number and validate
      const numericCode = Number(code);
      if (isNaN(numericCode)) {
        throw new Error('Agency code must be a valid number');
      }

      const agency = await Agent.getAgencyByCode(numericCode);
      
      if (!agency) return null;
      
      const author = agency.get(Agent.keys.AUTHOR);

      return {
        id: agency.id,
        name: agency.get(Agent.keys.NAME) ?? author.get(User.keys.FULL_NAME),
        logo: agency.get(Agent.keys.LOGO)?.url() || author.get(User.keys.AVATAR_FILE)?.url(),
        memberCount: agency.get(Agent.keys.HOST_IDS)?.length || 0,
        description: agency.get(Agent.keys.DESCRIPTION) || 'No description available',
        author: author,
        createdAt: agency.get(Agent.keys.CREATED_AT),
        uid: agency.get(Agent.keys.UID) ?? author.get(User.keys.UID),
        rules: agency.get(Agent.keys.RULES) || '',
        commissions: agency.get(Agent.keys.COMMISSIONS) || '',
        support: agency.get(Agent.keys.SUPPORT) || '',
      };
    } catch (error) {
      console.error(`Error getting agency by code '${code}':`, error);
      throw error;
    }
  },

  async searchAgencies(query) {
    try {
      // Create queries for name and code search
      const nameQuery = new Parse.Query('Agents');
      nameQuery.matches('name', new RegExp(query, 'i'));
      
      const codeQuery = new Parse.Query('Agents');
      if (!isNaN(Number(query))) {
        codeQuery.equalTo('uid', Number(query));
      } else {
        // If not a number, make this query never match
        codeQuery.equalTo('uid', -1);
      }
      
      // Combine queries with OR
      const mainQuery = Parse.Query.or(nameQuery, codeQuery);
      mainQuery.include('author');
      mainQuery.limit(20);
      
      // Execute the query
      const agencies = await mainQuery.find();
      
      // Log the number of agencies found
      console.log(`Searched agencies with query '${query}': Found ${agencies.length} agencies`);
      
      // Transform Parse objects to a more usable format
      const formattedAgencies = agencies.map(agency => {
        const logDetails = {
          id: agency.id,
          name: agency.get('name'),
          hostCount: agency.get('hostIds')?.length || 0
        };
        
        console.log('Agency Details:', logDetails);

        const author = agency.get(Agent.keys.AUTHOR);
        
        return {
          id: agency.id,
          name: agency.get(Agent.keys.NAME) ?? author.get(User.keys.FULL_NAME),
          logo: agency.get(Agent.keys.LOGO)?.url() || author.get(User.keys.AVATAR_FILE)?.url(),
          memberCount: agency.get(Agent.keys.HOST_IDS)?.length || 0,
          description: agency.get(Agent.keys.DESCRIPTION) || 'No description available',
          author: author,
          createdAt: agency.get(Agent.keys.CREATED_AT),
          uid: agency.get(Agent.keys.UID) ?? author.get(User.keys.UID),
          rules: agency.get(Agent.keys.RULES) || '',
          commissions: agency.get(Agent.keys.COMMISSIONS) || '',
          support: agency.get(Agent.keys.SUPPORT) || '',
        };
      });
      
      return formattedAgencies;
    } catch (error) {
      console.error(`Agency Search Error for query '${query}':`, error);
      throw error;
    }
  },

  /**
   * Pre-fetch a list of agencies
   * @param {number} limit - Number of agencies to fetch, default 10
   * @returns {Promise<Array>} List of agencies
   */
  async getPreloadedAgencies(limit = 10) {
    try {
      // Create a query for the Agents class
      const agencyQuery = new Parse.Query('Agents');
      
      // Ensure we have a valid class name
      console.log('Query Class Name:', agencyQuery.className);
      
      // Add multiple conditions to find active agencies
      //agencyQuery.exists('name');  // Must have a name
      //agencyQuery.greaterThan('hostIds', []);  // Must have hosts
      
      // Include related user information
      agencyQuery.include('author');
      
      // Limit results
      agencyQuery.limit(limit);
      
      // Sort by number of hosts (most active first), then by creation date
      agencyQuery.descending('hostIds');
      agencyQuery.descending('createdAt');
      
      // Execute the query
      const agencies = await agencyQuery.find();
      
      // Log the number of agencies found
      console.log(`Fetched ${agencies.length} preloaded agencies`);
      
      // Transform Parse objects to a more usable format
      const formattedAgencies = agencies.map(agency => {
        
        const author = agency.get(Agent.keys.AUTHOR);
        return {
          id: agency.id,
          name: agency.get(Agent.keys.NAME) ?? author.get(User.keys.FULL_NAME),
          logo: agency.get(Agent.keys.LOGO)?.url() || author.get(User.keys.AVATAR_FILE)?.url(),
          memberCount: agency.get(Agent.keys.HOST_IDS)?.length || 0,
          description: agency.get(Agent.keys.DESCRIPTION) || 'No description available',
          author: author,
          createdAt: agency.get(Agent.keys.CREATED_AT),
          uid: agency.get(Agent.keys.UID) ?? author.get(User.keys.UID),
          rules: agency.get(Agent.keys.RULES) || '',
          commissions: agency.get(Agent.keys.COMMISSIONS) || '',
          support: agency.get(Agent.keys.SUPPORT) || '',
        };
      });
      
      return formattedAgencies;
    } catch (error) {
      console.error('Error fetching preloaded agencies:', error);
      throw error;
    }
  },

  /**
   * Send a join request to an agency
   * @param {Parse.User} user - Current user sending the request
   * @param {Object} agency - Agency to join
   * @returns {Promise<Parse.Object>} The created join request
   */
  async sendJoinRequest(user, agency) {
    try {
      // Create a new AgencyJoinRequest object
      const AgencyJoinRequest = Parse.Object.extend('AgencyJoinRequest');
      const joinRequest = new AgencyJoinRequest();
      
      // Set request details
      joinRequest.set('user', user);
      joinRequest.set('agency', agency);
      joinRequest.set('status', 'pending');
      
      // Save the join request
      const savedRequest = await joinRequest.save();
      
      return savedRequest;
    } catch (error) {
      const errorMessage = error.message || 'Unknown error occurred';
      const errorCode = error.code || 'NO_CODE';
      
      console.error(`Join Request Error (${errorCode}):`, errorMessage);
      
      // Throw a more informative error
      throw new Error(`Failed to send join request: ${errorMessage}`);
    }
  },

  /**
   * Get join requests for a specific agency
   * @param {Parse.Object} agency - Agency to fetch join requests for
   * @returns {Promise<Array>} List of join requests
   */
  async getJoinRequests(agency) {
    try {
      const query = new Parse.Query('AgencyJoinRequest');
      query.equalTo('agency', agency);
      query.include('user');
      query.equalTo('status', 'pending');
      
      return await query.find();
    } catch (error) {
      const errorMessage = error.message || 'Unknown error occurred';
      const errorCode = error.code || 'NO_CODE';
      
      console.error(`Join Requests Fetch Error (${errorCode}):`, errorMessage);
      
      // Throw a more informative error
      throw new Error(`Failed to fetch join requests: ${errorMessage}`);
    }
  },

  /**
   * Get agent data for a specific user ID
   * @param {string} userId - User ID to fetch agent data for
   * @returns {Promise<Parse.Object|null>} The agent object if found, null otherwise
   */
  async getAgentByUserId(userId) {
    try {
      if (!userId) return null;
      
      // Create a query for the Agents class
      const agentQuery = new Parse.Query('Agents');
      
      // Find the agent where the author is the current user
      const userPointer = new Parse.User();
      userPointer.id = userId;
      agentQuery.equalTo(Agent.keys.AUTHOR, userPointer);
      
      // Include related user information
      agentQuery.include(Agent.keys.AUTHOR);
      
      // Execute the query
      const agent = await agentQuery.first();
      
      return agent;
    } catch (error) {
      console.error('Error fetching agent by user ID:', error);
      throw error;
    }
  },
  
  /**
   * Update an existing agent with company information
   * @param {Object} agentData - The agent data to update
   * @param {Parse.User} agentData.user - The user associated with the agent
   * @param {string} agentData.name - The name of the agency
   * @param {string} agentData.companyName - The company name
   * @param {string} agentData.companyRegistrationNumber - The company registration number
   * @param {string} agentData.companyTaxId - The company tax ID
   * @param {string} agentData.companyAddress - The company address
   * @param {string} agentData.companyCity - The company city
   * @param {string} agentData.companyPostalCode - The company postal code
   * @param {string} agentData.companyCountry - The company country
   * @returns {Promise<Agent>} The updated agent
   */
  async updateAgent(agentData) {
    try {
      const { user } = agentData;
      
      if (!user) {
        throw new Error('User is required');
      }
      
      // Get the existing agent or create a new one
      let agent = await this.getAgentByUserId(user.id);
      
      if (!agent) {
        // Create a new agent if one doesn't exist
        agent = new Agent();
        agent.set(Agent.keys.AUTHOR, user);
        agent.set(Agent.keys.AUTHOR_ID, user.id);
        agent.set(Agent.keys.STATUS, AgencyApplication.status.COMPLETED);
        agent.name = agentData.name || '';
      }
      
      // Update company information
      if (agentData.companyName) agent.companyName = agentData.companyName;
      if (agentData.companyRegistrationNumber) agent.companyRegistrationNumber = agentData.companyRegistrationNumber;
      if (agentData.companyTaxId) agent.companyTaxId = agentData.companyTaxId;
      if (agentData.companyAddress) agent.companyAddress = agentData.companyAddress;
      if (agentData.companyCity) agent.companyCity = agentData.companyCity;
      if (agentData.companyPostalCode) agent.companyPostalCode = agentData.companyPostalCode;
      if (agentData.companyCountry) agent.companyCountry = agentData.companyCountry;
      if (agentData.logo) agent.set(Agent.keys.LOGO, agentData.logo);
      
      // Save the agent
      agent.set(Agent.keys.STATUS, AgencyApplication.status.COMPLETED);
      await agent.save();
      
      // Update the user's agent reference
      user.set(User.keys.AGENT, agent);
      user.set(User.keys.AGENT_ID, agent.id);
      await user.save();
      
      return agent;
    } catch (error) {
      console.error('Error updating agent:', error);
      throw error;
    }
  },
  
  /**
   * Save a payment method for a user
   * @param {Object} paymentMethodData - The payment method data
   * @param {Parse.User} user - The user to associate with this payment method
   * @returns {Promise<PayoutMethod>} The saved payment method
   */
  async savePaymentMethod(paymentMethodData, user) {
    try {
      if (!user) {
        throw new Error('User is required');
      }
      
      // Create the payment method
      const data = {
        paymentMethod: PayoutMethod.paymentMethods.VALLET,
        name: paymentMethodData.accountName,
        surname: paymentMethodData.accountSurname,
        email: paymentMethodData.email,
        country: paymentMethodData.country,
        city: paymentMethodData.city,
        phoneNumber: paymentMethodData.phoneNumber,
        bankName: paymentMethodData.bankName,
        accountId: paymentMethodData.accountId
      };
      
      // Create the payment method
      const payoutMethod = await PayoutMethod.createPayoutMethod(data, user);
      
      // Update the user's payment method reference
      user.set(User.keys.PAYOUT_VALLET, payoutMethod);
      user.set(User.keys.SELECTED_PAYMENT_METHOD, payoutMethod);
      user.set(User.keys.SELECTED_PAYMENT_METHOD_ID, payoutMethod.id);
      await user.save();
      
      return payoutMethod;
    } catch (error) {
      console.error('Error saving payment method:', error);
      throw error;
    }
  }
};

export default agencyService;
