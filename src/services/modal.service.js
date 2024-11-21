export class ModalService {
  constructor() {
    this.modal = document.getElementById('modal');
    this.modalTitle = document.getElementById('modal-title');
    this.modalBody = document.getElementById('modal-body');
  }

  showModal(title, content) {
    this.modalTitle.textContent = title;
    this.modalBody.innerHTML = content;
    this.modal.style.display = 'block';
  }

  closeModal() {
    this.modal.style.display = 'none';
    this.modalBody.innerHTML = '';
  }
}