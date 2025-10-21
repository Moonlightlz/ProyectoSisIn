import { useState } from 'react';

export const useModal = () => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    onConfirm: null,
    confirmText: 'Aceptar',
    cancelText: 'Cancelar'
  });

  const showModal = (config) => {
    setModalState({
      isOpen: true,
      type: config.type || 'info',
      title: config.title || '',
      message: config.message || '',
      onConfirm: config.onConfirm || null,
      confirmText: config.confirmText || 'Aceptar',
      cancelText: config.cancelText || 'Cancelar'
    });
  };

  const hideModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  };

  const showSuccess = (title, message) => {
    showModal({
      type: 'success',
      title,
      message,
      confirmText: 'Entendido'
    });
  };

  const showError = (title, message) => {
    showModal({
      type: 'error',
      title,
      message,
      confirmText: 'Cerrar'
    });
  };

  const showWarning = (title, message) => {
    showModal({
      type: 'warning',
      title,
      message,
      confirmText: 'Entendido'
    });
  };

  const showConfirm = (title, message, onConfirm, options = {}) => {
    showModal({
      type: 'confirm',
      title,
      message,
      onConfirm: () => {
        onConfirm();
        hideModal();
      },
      confirmText: options.confirmText || 'Confirmar',
      cancelText: options.cancelText || 'Cancelar'
    });
  };

  return {
    modalState,
    showModal,
    hideModal,
    showSuccess,
    showError,
    showWarning,
    showConfirm
  };
};