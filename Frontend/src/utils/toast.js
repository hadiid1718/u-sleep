import { toast } from 'react-toastify';

/**
 * Show success toast notification
 * @param {string} message - The message to display
 * @param {object} options - Optional toast configuration
 */
export const showSuccessToast = (message, options = {}) => {
  toast.success(message, {
    position: 'top-right',
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    ...options,
  });
};

/**
 * Show error toast notification
 * @param {string} message - The message to display
 * @param {object} options - Optional toast configuration
 */
export const showErrorToast = (message, options = {}) => {
  toast.error(message, {
    position: 'top-right',
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    ...options,
  });
};

/**
 * Show warning toast notification
 * @param {string} message - The message to display
 * @param {object} options - Optional toast configuration
 */
export const showWarningToast = (message, options = {}) => {
  toast.warning(message, {
    position: 'top-right',
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    ...options,
  });
};

/**
 * Show info toast notification
 * @param {string} message - The message to display
 * @param {object} options - Optional toast configuration
 */
export const showInfoToast = (message, options = {}) => {
  toast.info(message, {
    position: 'top-right',
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    ...options,
  });
};

/**
 * Show loading toast notification
 * @param {string} message - The message to display
 * @param {object} options - Optional toast configuration
 * @returns {string} - Toast ID for updating later
 */
export const showLoadingToast = (message, options = {}) => {
  return toast.loading(message, {
    position: 'top-right',
    hideProgressBar: false,
    closeOnClick: false,
    pauseOnHover: true,
    draggable: false,
    ...options,
  });
};

/**
 * Update an existing toast
 * @param {string} toastId - The toast ID to update
 * @param {object} updates - Updates to apply
 */
export const updateToast = (toastId, updates) => {
  toast.update(toastId, updates);
};

/**
 * Dismiss all toasts
 */
export const dismissAllToasts = () => {
  toast.dismiss();
};

/**
 * Dismiss a specific toast
 * @param {string} toastId - The toast ID to dismiss
 */
export const dismissToast = (toastId) => {
  toast.dismiss(toastId);
};
