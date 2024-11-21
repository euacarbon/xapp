import './style.css';
import { WalletService } from './services/wallet.service.js';
import { TokenService } from './services/token.service.js';
import { UIService } from './services/ui.service.js';

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
    await this.updateBalances();
    this.initializeXumm();
  }

  // initializeXumm() {
  //   this.xumm.on('ready', async () => {
  //     try {
  //       const account = await this.xumm.user.account;
  //       const token = await this.xumm.user.token;

  //       console.log('XUMM user data:', account, token);
        
  //       // Update footer information
  //       document.getElementById('user-account').textContent = this.formatAddress(account);
  //       document.getElementById('user-token').textContent = this.formatToken(token);
  //     } catch (error) {
  //       console.error('Error fetching XUMM user data:', error);
  //     }
  //   });
  // }


  initializeXumm() {
    this.xumm.on('ready', async () => {
      console.log('Xumm SDK is ready');
      await this.fetchUserData(); // Fetch user data immediately when SDK is ready
    });
  
    this.xumm.on('success', () => {
      console.log('User has successfully signed in');
      this.fetchUserData(); // Refetch data if session is re-established
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
  
        // Update UI
        document.getElementById('user-account').textContent = this.formatAddress(account);
        document.getElementById('user-token').textContent = this.formatToken(token);
  
        // Store account and token
        this.account = account;
        this.token = token;
  
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
      const xrpBalance = await this.walletService.getXRPBalance(this.account, this.token);
      const tokenBalance = await this.tokenService.getTokenBalance();
  
      document.getElementById('xrp-balance').textContent = `${xrpBalance} XRP`;
      document.getElementById('token-balance').textContent = `${tokenBalance} Tokens`;
    } catch (error) {
      console.error('Failed to update balances:', error);
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

    // Currency Type Change
    document.getElementById('currency-type').addEventListener('change', (e) => {
      const feeNote = document.getElementById('fee-note');
      feeNote.classList.toggle('hidden', e.target.value === 'xrp');
    });

    // Buy Form
    document.getElementById('buy-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const xrpAmount = parseFloat(document.getElementById('xrp-amount').value);
      await this.handleBuy(xrpAmount);
    });

    // XRP Amount Change for Buy
    document.getElementById('xrp-amount').addEventListener('input', (e) => {
      const estimate = parseFloat(e.target.value) * 100;
      document.getElementById('token-estimate').textContent = 
        `Estimated tokens: ${estimate || 0}`;
    });

    // Retire Form
    document.getElementById('retire-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const amount = parseFloat(document.getElementById('retire-amount').value);
      await this.handleRetire(amount);
    });
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

  async handleSend(formData) {
    try {
      if (formData.type === 'xrp') {
        const account = await this.xumm.user.account; // Get Xumm account
        const token = await this.xumm.user.token; // Get Xumm token
  
        const payload = await this.walletService.sendXRP(
          account, // Sender
          formData.recipient, // Recipient
          formData.amount, // Amount
          token // Bearer token
        );
  
        // Open the payload in Xumm for signing
        this.xumm.xapp.openSignRequest({ uuid: payload.payload.uuid });
  
        this.uiService.showSuccess(`XRP transaction initiated. Please sign in Xumm.`);
      } else {
        await this.tokenService.sendTokens(formData.recipient, formData.amount);
        this.uiService.showSuccess(`Token transaction initiated.`);
      }
  
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

  async updateBalances() {
    try {
      const xrpBalance = await this.walletService.getXRPBalance();
      const tokenBalance = await this.tokenService.getTokenBalance();
      
      document.getElementById('xrp-balance').textContent = `${xrpBalance} XRP`;
      document.getElementById('token-balance').textContent = `${tokenBalance} Tokens`;
    } catch (error) {
      this.uiService.showError('Failed to update balances');
    }
  }
}

// Initialize the app
new App();