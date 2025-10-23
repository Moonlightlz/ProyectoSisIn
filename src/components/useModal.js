import { useState } from 'react';

const initialState = {
  isOpen: false,
  title: '',
  message: '',
  type: 'info',
  onConfirm: null,
  confirmText: 'Aceptar',
  cancelText: 'Cancelar'
};

export const useModal = () => {
  const [modalState, setModalState] = useState(initialState);

  const hideModal = () => {
    if (modalState.isOpen) {
      setModalState(initialState);
    }
  };

  const showModal = (config) => {
    setModalState({ ...initialState, ...config, isOpen: true });
  };

  const showConfirm = (title, message, onConfirm, options = {}) => {
    showModal({
      title,
      message,
      onConfirm: async () => {
        const result = await onConfirm();
        // No cerrar el modal si la función de confirmación devuelve explícitamente `false`.
        if (result !== false) {
          hideModal(); // Cierra el modal después de confirmar
        }
      },
      type: 'confirm',
      confirmText: options.confirmText || 'Confirmar',
      cancelText: options.cancelText || 'Cancelar'
    });
  };

  const showSuccess = (title, message) => {
    // Muestra el modal de éxito
    showModal({
      title,
      message,
      type: 'success',
    });

    // Cierra el modal automáticamente después de 2 segundos
    setTimeout(() => hideModal(), 2000);
  };

  const showError = (title, message) => {
    showModal({
      title,
      message,
      type: 'error',
    });
  };

  return { modalState, hideModal, showConfirm, showSuccess, showError };
};