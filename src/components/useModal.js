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
      onConfirm: () => {
        onConfirm();
        hideModal(); // Cierra el modal después de confirmar
      },
      type: 'confirm',
      confirmText: options.confirmText || 'Confirmar',
      cancelText: options.cancelText || 'Cancelar'
    });
  };

  return { modalState, hideModal, showConfirm };
};