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

      console.log('response SEND:', response);
      if (!response.ok) {
        throw new Error('Transaction failed');
      }

      return await response.json(); // Return payload from the response
    } catch (error) {
      throw new Error('Failed to send XRP');
    }
  }



  async buyTokens(account, action, price, amount, token) {
    try {
      const response = await fetch(`${this.API_URL}/tokens/tradeToken`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ account, action, price, amount }),
      });

      if (!response.ok) {
        const errorResponse = await response.json();
        console.error('Server Error:', errorResponse);
        throw new Error(errorResponse.message || 'Transaction failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Error in buyTokens:', error);
      throw new Error('Failed to send buyTokens');
    }
  }



  async retireTokens(account, amountBurned, token) {
    try {
      const response = await fetch(`${this.API_URL}/nfts/mintNFT`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ account, amountBurned }),
      });

      if (!response.ok) {
        const errorResponse = await response.json();
        console.error('Server Error:', errorResponse);
        throw new Error(errorResponse.message || 'Transaction failed');
      }

      return await response.json(); // Return payload from the response
    } catch (error) {
      console.error('Error in Minting:', error);
      throw new Error('Failed to send retireTokens');
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



