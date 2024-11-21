export class Router {
  constructor() {
    this.pages = ['welcome', 'send', 'buy', 'retire'];
    this.currentPage = 'welcome';
  }

  navigateTo(page) {
    if (!this.pages.includes(page)) return;

    // Hide all pages
    this.pages.forEach(p => {
      const pageElement = document.getElementById(`${p}-page`);
      if (pageElement) {
        pageElement.classList.add('hidden');
      }
    });

    // Show selected page
    const selectedPage = document.getElementById(`${page}-page`);
    if (selectedPage) {
      selectedPage.classList.remove('hidden');
    }

    // Update active state of nav buttons
    document.querySelectorAll('[data-page]').forEach(button => {
      button.classList.toggle('active', button.dataset.page === page);
    });

    this.currentPage = page;
  }
}