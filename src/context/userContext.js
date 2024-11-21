// src/context/userContext.js

export class UserContext {
    constructor() {
      this.account = null;
      this.token = null;
    }
  
    // Set user account
    setAccount(account) {
      this.account = account;
    }
  
    // Get user account
    getAccount() {
      return this.account;
    }
  
    // Set user token
    setToken(token) {
      this.token = token;
    }
  
    // Get user token
    getToken() {
      return this.token;
    }
  
    // Check if user context is ready
    isReady() {
      return this.account !== null && this.token !== null;
    }
  }
  
  // Create and export a singleton instance
  export const userContext = new UserContext();
  