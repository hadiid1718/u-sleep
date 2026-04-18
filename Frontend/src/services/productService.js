import { apiRequest } from './core/apiClient';

export const getProducts = () => apiRequest('/products');
