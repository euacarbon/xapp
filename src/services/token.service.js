export class TokenService {
  constructor() {
    this.API_URL = import.meta.env.VITE_BASE_URL; 
  }

 
  async getTokenBalance(account, token) {
    console.log('API URL:', `${this.API_URL}/tokens/getTokenBalance?account=${account}`);
    console.log('Authorization Header:', `Bearer ${token}`);
  
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
      console.log('API Response:', data);
  
      // Extract balance from the nested structure
      const balance = data.data?.balance || 0; // Default to 0 if undefined
      return balance;
    } catch (error) {
      console.error('Error in getTokenBalance:', error.message);
      throw error;
    }
  }

  async sendTokens(recipient, amount) {
    try {
      const response = await fetch(`${this.API_URL}/send-tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recipient, amount }),
      });
      
      if (!response.ok) {
        throw new Error('Transaction failed');
      }
      
      return await response.json();
    } catch (error) {
      throw new Error('Failed to send tokens');
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
}