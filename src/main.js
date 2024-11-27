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
    this.currentxrpBalance = 0;

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
          // Store in userContext
          userContext.setAccount(account);
          userContext.setToken(token);

          // Fetch balances
          // await this.updateBalances();
          await this.fetchUserData();

        } else {
          throw new Error('Account or token not available.');
        }
      } catch (error) {
        console.error('Error initializing XUMM:', error);

      }
    });

    // this.xumm.on('success', () => {
    //   console.log('User has successfully signed in');
    //   this.fetchUserData(); // Re-fetch data
    // });

    this.xumm.xapp.on('payload', async (data) => {

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
        this.uiService.showError('An error occurred while processing the transaction.');
      }
    });

    this.xumm.on('error', (error) => {
      console.error('Xumm SDK error:', error);
    });
  }

  async fetchUserData() {
    try {
      const account = await this.xumm.user.account;
      const token = await this.xumm.user.token;

      if (account && token) {

        // Store in userContext
        userContext.setAccount(account);
        userContext.setToken(token);
        await this.updateBalances();
      } else {
        throw new Error('Account or token not available.');
      }
    } catch (error) {
      console.error('Error fetching XUMM user data:', error);
   }
  }

  async updateBalances() {
    try {
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

      this.currentTokenBalance = tokenBalance.toFixed(8);
      this.currentxrpBalance = xrpBalance.toFixed(8);


      // Update UI with the fetched balances
      document.getElementById('xrp-balance').textContent = `${parseFloat(xrpBalance).toFixed(4)} XRP`;
      document.getElementById('token-balance').textContent = `${parseFloat(tokenBalance).toFixed(4)} Tokens`;
      

      // this.uiService.showSuccess('Balances updated successfully!');
    } catch (error) {
      console.error('Error in updateBalances:', error.message);
      // this.uiService.showError('Failed to update balances');
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

    // TRUSTLINE FORM

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

        const amount = parseFloat(document.getElementById('xrp-amount').value);
        const pricePerXRP = parseFloat(document.getElementById('xrp-price').value);

        if (isNaN(amount) || isNaN(pricePerXRP) || amount <= 0 || pricePerXRP <= 0) {
          return this.uiService.showError('Invalid input for amount or price.');
        }

        const formData = {
          amount,
          price: amount * pricePerXRP, 
        };

        await this.handleBuy(formData);
      });
    }

    // Retire Form
    const retireForm = document.getElementById('retire-form');
    if (retireForm) {
      retireForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        await this.handleRetire();
      });
    }
  }


  async handleEnable(tokenName) {
    try {
      const account = userContext.getAccount();
      const token = userContext.getToken();
      const issuerAddress = import.meta.env.VITE_ISSUER_ADDRESS;
      const currencyCode = import.meta.env.VITE_CURRENCY_CODE;
      const trust_limit = import.meta.env.VITE_CURRENCY_TRUST_LIMIT || 50000000; // Default to 50M if not set

      const payload = await this.tokenService.createTrustline(
        account,
        issuerAddress,
        currencyCode,
        trust_limit,
        token
      );

      this.xumm.xapp.openSignRequest({ uuid: payload.payload.uuid });
      // this.uiService.showSuccess(`${tokenName} trustline set. You can receive token.`);

      document.getElementById('enable-form').reset();
    } catch (error) {
      this.uiService.showError(error.message);
      throw error; 
    }
  }


  async handleSend(formData) {
    try {
      const account = userContext.getAccount();
      const token = userContext.getToken();

      if (!account || !token) {
        throw new Error('User account or token is missing.');
      }

      if (formData.amount > this.currentTokenBalance) {
        throw new Error('Insufficient balance');
      }

      const originalBalance = this.currentTokenBalance;
      const originalxRPBalance = this.currentxrpBalance;


      const payload = await this.tokenService.sendTokens(
        account,
        formData.recipient,
        formData.amount,
        token
      );

      this.xumm.xapp.openSignRequest({ uuid: payload.payload.uuid });

      // Poll until balance updates
      await this.pollBalanceUpdate(originalBalance, originalxRPBalance);

      document.getElementById('send-form').reset();
    } catch (error) {
      this.uiService.showError(error.message);
    }
  }




  async handleBuy(formData) {
    try {
      const account = userContext.getAccount();
      const token = userContext.getToken();

      if (!account || !token) {
        throw new Error('User account or token is missing.');
      }

      if (formData.amount > this.currentxrpBalance) {
        throw new Error('Insufficient XRP balance');
      }

      const originalBalance = this.currentTokenBalance;
      const originalxRPBalance = this.currentxrpBalance;


      // Send the trade request via TokenService
      const payload = await this.tokenService.buyTokens(
        account,
        "buy", // action
        formData.price, 
        formData.amount, 
        token
      );

      this.xumm.xapp.openSignRequest({ uuid: payload.payload.uuid });

      // Poll until balance updates
      await this.pollBalanceUpdate(originalBalance, originalxRPBalance);

      document.getElementById('buy-form').reset();
    } catch (error) {
      this.uiService.showError(error.message);
    }
  }




  // async handleRetire() {
  //   try {
  //     const account = userContext.getAccount();
  //     const token = userContext.getToken();
  //     const amountBurned = this.currentTokenBalance;
  //     const recipient = import.meta.env.VITE_ISSUER_ADDRESS;

  //     // Validate account, token, and balance
  //     if (!account || !token) {
  //       throw new Error('User account or token is missing.');
  //     }

  //     if (amountBurned <= 0) {
  //       throw new Error('Insufficient token balance to retire.');
  //     }

  //     const originalBalance = this.currentTokenBalance;
  //     const originalxRPBalance = this.currentxrpBalance;

  //     const feePercentage = 0.1;
  //     const amountToBurn = parseFloat(amountBurned) -parseFloat((amountBurned * feePercentage / 100));

  //     // Step 1: Create the payment transaction payload to send back the burned amount
  //     const paymentPayload = await this.tokenService.sendTokens(
  //       account,
  //       recipient,
  //       amountToBurn,
  //       token
  //     );

  //     this.xumm.xapp.openSignRequest({ uuid: paymentPayload.payload.uuid });

  //     this.xumm.xapp.on('payload', async (data) => {
  //       console.log('Payload resolved:', JSON.stringify(data, null, 2));

  //       try {
  //         // Check the reason field for the payload resolution status
  //         if (data.reason === "SIGNED") {
  //           const nftPayload = await this.tokenService.retireTokens(account, amountBurned, token);

  //           this.xumm.xapp.openSignRequest({ uuid: nftPayload.payload.uuid });
  //         }
  //       } catch (error) {
  //         console.error('Error processing payload:', error);
  //         this.uiService.showError('An error occurred while processing the transaction.');
  //       }
  //     });

  //     await this.pollBalanceUpdate(originalBalance, originalxRPBalance);

  //     document.getElementById('retire-form').reset();

  //     // this.uiService.showSuccess('Tokens retired and NFT minted successfully!');
  //   } catch (error) {
  //     this.uiService.showError(error.message);
  //   }
  // }



  async handleRetire() {
    try {
      const account = userContext.getAccount();
      const token = userContext.getToken();
      const amountBurned = this.currentTokenBalance;
      const recipient = import.meta.env.VITE_ISSUER_ADDRESS;
  
      // Validate account, token, and balance
      if (!account || !token) {
        throw new Error('User account or token is missing.');
      }
  
      if (amountBurned <= 0.1) {
        throw new Error('Insufficient token balance to retire.');
      }
  
      const originalBalance = this.currentTokenBalance;
      const originalxRPBalance = this.currentxrpBalance;
  
      const feePercentage = 0.1;
      const amountToBurn = parseFloat(amountBurned) - parseFloat((amountBurned * feePercentage) / 100);
  
      // Step 1: Create the payment transaction payload
      const paymentPayload = await this.tokenService.sendTokens(
        account,
        recipient,
        amountToBurn,
        token
      );  
      this.xumm.xapp.openSignRequest({ uuid: paymentPayload.payload.uuid });
  
      // Set up a flag for the payment listener
      let paymentHandled = false;
  
      const handlePaymentResolved = async (data) => {
        if (data.uuid === paymentPayload.payload.uuid && !paymentHandled) {
          paymentHandled = true; // Mark this listener as handled
  
          if (data.reason === 'SIGNED') {
  
            // Proceed to create and sign the NFT mint transaction
            const nftPayload = await this.tokenService.retireTokens(account, amountBurned, token);
  
            this.xumm.xapp.openSignRequest({ uuid: nftPayload.payload.uuid });
  
            // Set up a flag for the NFT listener
            let nftHandled = false;
  
            const handleNFTResolved = (nftData) => {
              if (nftData.uuid === nftPayload.payload.uuid && !nftHandled) {
                nftHandled = true; // Mark this listener as handled
  
                if (nftData.reason === 'SIGNED') {
                  this.uiService.showSuccess('Tokens retired and NFT minted successfully!');
                } else {
                  this.uiService.showError('NFT mint transaction was not signed.');
                }
              }
            };
  
            // Attach listener for the NFT resolution
            this.xumm.xapp.on('payload', handleNFTResolved);
          } else {
            this.uiService.showError('Payment transaction was not signed.');
          }
        }
      };
  
      // Attach listener for the payment resolution
      this.xumm.xapp.on('payload', handlePaymentResolved);
  
      // Poll until the balance updates
      await this.pollBalanceUpdate(originalBalance, originalxRPBalance);
  
      document.getElementById('retire-form').reset();
    } catch (error) {
      console.error('Error in handleRetire:', error);
      this.uiService.showError(error.message);
    }
  }
  
  

  async pollBalanceUpdate(originalBalance, originalxRPBalance, retries = 5, interval = 5000) {
    for (let i = 0; i < retries; i++) {
      await this.updateBalances();

      // Check if the balance has updated
      if (this.currentTokenBalance !== originalBalance) {
        return; // Exit polling when balance changes
      }

      if (this.currentxrpBalance !== originalxRPBalance) {
        return;
      }

      // Wait before the next retry
      await new Promise(resolve => setTimeout(resolve, interval));
    }

    console.warn('Balance update polling timed out');
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