export class WalletService {
  constructor() {
    this.API_URL = import.meta.env.VITE_BASE_URL; // Fetch from .env
  }

  async getXRPBalance(account, token) {
    try {
      const response = await fetch(`${this.API_URL}/tokens/getXRPBalance?account=${account}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch XRP balance');
      }

      const data = await response.json();
      return data.balance; // Return XRP balance from the response
    } catch (error) {
      throw new Error('Failed to fetch XRP balance');
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
