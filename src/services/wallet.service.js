export class WalletService {
  constructor() {
    this.API_URL = import.meta.env.VITE_BASE_URL; 
  }

  async getXRPBalance(account, token) {
    console.log('Calling getXRPBalance API...');
    console.log('API URL:', `${this.API_URL}/tokens/getXRPBalance?account=${account}`);
    console.log('Authorization Header:', `Bearer ${token}`);
  
    try {
      const response = await fetch(`${this.API_URL}/tokens/getXRPBalance?account=${account}`, {
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
      const balance = data.balance?.balance || 0; // Default to 0 if undefined
      return balance;
    } catch (error) {
      console.error('Error in getXRPBalance:', error.message);
      throw error;
    }
  }
  

  async sendXRP(sender, recipient, amount, token) {
    try {
      const response = await fetch(`${this.API_URL}/tokens/send`, {
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
}
