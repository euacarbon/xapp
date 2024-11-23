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
    this.xumm = new Xumm(import.meta.env.VITE_XUMM_API_KEY);
    this.currentTokenBalance = 0;

    this.initializeApp();
  }

  async initializeApp() {
    this.setupEventListeners();
    this.initializeXumm();
  }

  showSection(sectionId) {
    // Update toggle buttons
    document.querySelectorAll('.toggle-button').forEach(button => {
      button.classList.toggle('active', button.dataset.section === sectionId);
    });

    // Update sections
    document.querySelectorAll('.section').forEach(section => {
      section.classList.toggle('active', section.id === `${sectionId}-section`);
    });
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
          // await this.updateBalances();
          await this.fetchUserData(); 

        } else {
          throw new Error('Account or token not available.');
        }
      } catch (error) {
        console.error('Error fetching XUMM user data:', error);
        document.getElementById('user-account').textContent = 'Failed to load account';
        document.getElementById('user-token').textContent = 'Failed to load token';
      }
    });

    // this.xumm.on('success', () => {
    //   console.log('User has successfully signed in');
    //   this.fetchUserData(); // Re-fetch data
    // });

    this.xumm.xapp.on('payload', async (data) => {
      console.log('Payload resolved:', JSON.stringify(data, null, 2));
    
      try {
        // Check the reason field for the payload resolution status
        if (data.reason === "SIGNED") {
          this.uiService.showSuccess('Transaction signed successfully!');
        } else if (data.reason === "DECLINED") {
          this.uiService.showError('Transaction was rejected by the user.');
        } else {
          this.uiService.showError('Unexpected payload resolution reason.');
        }
      } catch (error) {
        console.error('Error processing payload:', error);
        this.uiService.showError('An error occurred while processing the transaction.');
      }
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
      // Show loading indicators
      document.getElementById('xrp-balance').textContent = 'Loading...';
      document.getElementById('token-balance').textContent = 'Loading...';
  
      const account = userContext.getAccount();
      const token = userContext.getToken();
  
      if (!account || !token) {
        throw new Error('User account or token is missing.');
      }
  
      // Fetch balances
      const xrpBalance = await this.walletService.getXRPBalance(account, token);
      const tokenBalance = await this.tokenService.getTokenBalance(account, token);

      this.currentTokenBalance = tokenBalance;

  
      // Update UI with the fetched balances
      document.getElementById('xrp-balance').textContent = `${xrpBalance} XRP`;
      document.getElementById('token-balance').textContent = `${tokenBalance} Tokens`;
  
      // Show success message after balances are updated
      // this.uiService.showSuccess('Balances updated successfully!');
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
      button.addEventListener('click', (e) => {
        const section = e.target.closest('.toggle-button').dataset.section;
        this.showSection(section);
      });
    });

    // Currency Type Change
    const currencyTypeSelect = document.getElementById('currency-type');
    if (currencyTypeSelect) {
      currencyTypeSelect.addEventListener('change', (e) => {
        const feeNote = document.getElementById('fee-note');
        if (feeNote) {
          feeNote.classList.toggle('hidden', e.target.value === 'xrp');
        }
      });
    }

    // Send Form
    const sendForm = document.getElementById('send-form');
    if (sendForm) {
      sendForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = {
          type: document.getElementById('currency-type').value,
          recipient: document.getElementById('recipient').value,
          amount: parseFloat(document.getElementById('amount').value)
        };
        await this.handleSend(formData);
      });
    }

    const enableForm = document.getElementById('enable-form');
    if (enableForm) {
      enableForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Get token name dynamically
        const tokenName = document.getElementById('token-name').textContent.trim();

        try {
          // Bind handleEnable to the current instance
          await this.handleEnable(tokenName);
        } catch (error) {
          console.error('Error enabling token:', error.message);
        }
      });
    }

    // Buy Form
    const buyForm = document.getElementById('buy-form');
    if (buyForm) {
      buyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const xrpAmount = parseFloat(document.getElementById('xrp-amount').value);
        await this.handleBuy(xrpAmount);
      });
    }

    // Retire Form
    const retireForm = document.getElementById('retire-form');
    if (retireForm) {
      retireForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const amount = parseFloat(document.getElementById('retire-amount').value);
        await this.handleRetire(amount);
      });
    }
  }



  async handleEnable(tokenName) {
    try {
      const account = userContext.getAccount();
      const token = userContext.getToken();
      const issuerAddress =  import.meta.env.VITE_ISSUER_ADDRESS;
      const currencyCode = import.meta.env.VITE_CURRENCY_CODE;
      const trust_limit = import.meta.env.VITE_CURRENCY_TRUST_LIMIT || 50000000; // Default to 50M if not set

      const payload = await this.tokenService.createTrustline(
        account,
        issuerAddress,
        currencyCode,
        trust_limit, 
        token
      );
  
  
      console.log('Trustline payload:', payload);
  
      // Open the Xumm sign request using the UUID from the payload
      this.xumm.xapp.openSignRequest({ uuid: payload.payload.uuid });
      // this.uiService.showSuccess(`${tokenName} trustline set. You can receive token.`);
  
      document.getElementById('enable-form').reset();
    } catch (error) {
      // Show error message if trustline creation fails
      this.uiService.showError(error.message);
      throw error; // Re-throw to log in the form submission catch block
    }
  }


  
  async handleSend(formData) {
    try {
      const account = userContext.getAccount();
      const token = userContext.getToken();

      if (!account || !token) {
        throw new Error('Session Expired, Close xApp and Open again.');
      }

     // Check if the user has sufficient balance
     if (formData.amount > this.currentTokenBalance) {
      throw new Error('Insufficient balance');
    }

      const payload = await this.tokenService.sendTokens(
        account,
        formData.recipient, 
        formData.amount,
        token // Bearer token
      );

      this.xumm.xapp.openSignRequest({ uuid: payload.payload.uuid });
      // this.uiService.showSuccess(`XRP transaction initiated. Please sign in Xumm.`);
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


// Dynamically set the token name from .env
document.addEventListener('DOMContentLoaded', () => {
  const tokenNameElement = document.getElementById('token-name');
  if (tokenNameElement) {
    const tokenName = import.meta.env.VITE_CURRENCY_CODE || 'Token'; // Fallback to 'Token' if env is not set
    tokenNameElement.textContent = tokenName;
  }
});


// Initialize the app
new App();