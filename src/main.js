import './style.css';
import { WalletService } from './services/wallet.service.js';
import { TokenService } from './services/token.service.js';
import { UIService } from './services/ui.service.js';
import { userContext } from './context/userContext.js';

class App {
  constructor() {
    this.walletService = new WalletService();
    this.tokenService = new TokenService();
    this.uiService = new UIService();
    this.xumm = new Xumm('4821bc5b-0aad-4df5-aa7f-3f92040f69e1');
    this.initializeApp();
  }

  async initializeApp() {
    this.setupEventListeners();
    this.initializeXumm();
  }

  initializeXumm() {
    this.xumm.on('ready', async () => {
      console.log('Xumm SDK is ready');
      try {
        const account = await this.xumm.user.account;
        const token = await this.xumm.user.token;

        if (account && token) {
          console.log('XUMM user account:', account);
          console.log('XUMM user token:', token);

          // Store in userContext
          userContext.setAccount(account);
          userContext.setToken(token);

          // Update UI
          document.getElementById('user-account').textContent = this.formatAddress(account);
          document.getElementById('user-token').textContent = this.formatToken(token);

          // Fetch balances
          await this.updateBalances();
        } else {
          throw new Error('Account or token not available.');
        }
      } catch (error) {
        console.error('Error fetching XUMM user data:', error);
        document.getElementById('user-account').textContent = 'Failed to load account';
        document.getElementById('user-token').textContent = 'Failed to load token';
      }
    });

    this.xumm.on('success', () => {
      console.log('User has successfully signed in');
      this.fetchUserData(); // Re-fetch data
    });

    this.xumm.on('error', (error) => {
      console.error('Xumm SDK error:', error);
      document.getElementById('user-account').textContent = 'Error loading account';
      document.getElementById('user-token').textContent = 'Error loading token';
    });
  }

  async fetchUserData() {
    try {
      const account = await this.xumm.user.account;
      const token = await this.xumm.user.token;

      if (account && token) {
        console.log('XUMM user data:', account, token);

        // Store in userContext
        userContext.setAccount(account);
        userContext.setToken(token);

        // Update UI
        document.getElementById('user-account').textContent = this.formatAddress(account);
        document.getElementById('user-token').textContent = this.formatToken(token);

        // Fetch balances
        await this.updateBalances();
      } else {
        throw new Error('Account or token not available.');
      }
    } catch (error) {
      console.error('Error fetching XUMM user data:', error);
      document.getElementById('user-account').textContent = 'Failed to load account';
      document.getElementById('user-token').textContent = 'Failed to load token';
    }
  }

  async updateBalances() {
    try {
      const account = userContext.getAccount();
      const token = userContext.getToken();

      if (!account || !token) {
        throw new Error('User account or token is missing.');
      }

      const xrpBalance = await this.walletService.getXRPBalance(account, token);
      document.getElementById('xrp-balance').textContent = `${xrpBalance} XRP`;

      const tokenBalance = await this.tokenService.getTokenBalance();
      document.getElementById('token-balance').textContent = `${tokenBalance} Tokens`;
    } catch (error) {
      console.error('Error in updateBalances:', error.message);
      this.uiService.showError('Failed to update balances');
    }
  }

  formatAddress(address) {
    if (!address) return 'Not connected';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  formatToken(token) {
    if (!token) return 'No token';
    return `${token.slice(0, 6)}...${token.slice(-4)}`;
  }

  setupEventListeners() {
    // Toggle Buttons
    document.querySelectorAll('.toggle-button').forEach(button => {
      button.addEventListener('click', () => {
        const section = button.dataset.section;
        this.showSection(section);
      });
    });

    // Send Form
    document.getElementById('send-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = {
        type: document.getElementById('currency-type').value,
        recipient: document.getElementById('recipient').value,
        amount: parseFloat(document.getElementById('amount').value)
      };
      await this.handleSend(formData);
    });

    // Other form listeners
    document.getElementById('buy-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const xrpAmount = parseFloat(document.getElementById('xrp-amount').value);
      await this.handleBuy(xrpAmount);
    });

    document.getElementById('retire-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const amount = parseFloat(document.getElementById('retire-amount').value);
      await this.handleRetire(amount);
    });
  }

  async handleSend(formData) {
    try {
      const account = userContext.getAccount();
      const token = userContext.getToken();

      const payload = await this.walletService.sendXRP(
        account, // Sender
        formData.recipient, // Recipient
        formData.amount, // Amount
        token // Bearer token
      );

      this.xumm.xapp.openSignRequest({ uuid: payload.payload.uuid });
      this.uiService.showSuccess(`XRP transaction initiated. Please sign in Xumm.`);
      await this.updateBalances();
      document.getElementById('send-form').reset();
    } catch (error) {
      this.uiService.showError(error.message);
    }
  }

  async handleBuy(xrpAmount) {
    try {
      await this.tokenService.buyTokens(xrpAmount);
      this.uiService.showSuccess('Tokens purchased successfully');
      await this.updateBalances();
      document.getElementById('buy-form').reset();
    } catch (error) {
      this.uiService.showError(error.message);
    }
  }

  async handleRetire(amount) {
    try {
      await this.tokenService.retireTokens(amount);
      this.uiService.showSuccess('Tokens retired and NFT received');
      await this.updateBalances();
      document.getElementById('retire-form').reset();
    } catch (error) {
      this.uiService.showError(error.message);
    }
  }
}

// Initialize the app
new App();
