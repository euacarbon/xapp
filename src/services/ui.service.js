import Swal from 'sweetalert2';

export class UIService {
  showSuccess(message) {
    Swal.fire({
      title: 'Success!',
      text: message,
      icon: 'success',
      confirmButtonColor: '#1E90FF'
    });
  }

  showError(message) {
    Swal.fire({
      title: 'Error',
      text: message,
      icon: 'error',
      confirmButtonColor: '#1E90FF'
    });
  }
}