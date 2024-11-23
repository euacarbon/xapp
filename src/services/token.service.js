export class TokenService {
  constructor() {
    this.API_URL = import.meta.env.VITE_BASE_URL;
  }


  async getTokenBalance(account, token) {

    try {
      const response = await fetch(`${this.API_URL}/tokens/getTokenBalance?account=${account}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed API call: ${response.status}`);
      }

      const data = await response.json();
      const balance = data.data?.balance || 0;
      return balance;
    } catch (error) {
      console.error('Error in getTokenBalance:', error.message);
      throw error;
    }
  }


  async sendTokens(sender, recipient, amount, token) {
    try {
      const response = await fetch(`${this.API_URL}/tokens/sendToken`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ sender, destination: recipient, amount }),
      });

      if (!response.ok) {
        throw new Error('Transaction failed');
      }

      return await response.json(); // Return payload from the response
    } catch (error) {
      throw new Error('Failed to send XRP');
    }
  }



  async buyTokens(xrpAmount) {
    try {
      const response = await fetch(`${this.API_URL}/buy-tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ xrpAmount }),
      });

      if (!response.ok) {
        throw new Error('Purchase failed');
      }

      return await response.json();
    } catch (error) {
      throw new Error('Failed to buy tokens');
    }
  }


  async retireTokens(amount) {
    try {
      const response = await fetch(`${this.API_URL}/retire-tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      });

      if (!response.ok) {
        throw new Error('Retirement failed');
      }

      return await response.json();
    } catch (error) {
      throw new Error('Failed to retire tokens');
    }
  }


  async createTrustline(userAccount, issuerAddress, currencyCode, value, token) {
    try {
      const response = await fetch(`${this.API_URL}/tokens/createTrustLine`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ userAccount, issuerAddress, currencyCode, value }),
      });

      if (!response.ok) {
        throw new Error('Transaction failed');
      }

      return await response.json(); // Return payload from the response
    } catch (error) {
      throw new Error('Failed to send createTrustLine');
    }
  }

}



