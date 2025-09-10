import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

// Set up axios interceptors for global error handling
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token');
            toast.error('Session expired. Please login again.');
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
        }
        return Promise.reject(error);
    }
);

// Custom hook for API calls with loading, error handling, and caching
export const useApi = (url, options = {}) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refetchTrigger, setRefetchTrigger] = useState(0);

    const { 
        immediate = true, 
        onSuccess, 
        onError,
        showToast = true,
        dependencies = []
    } = options;

    const fetchData = useCallback(async () => {
        if (!url) return;
        
        try {
            setLoading(true);
            setError(null);
            
            const token = localStorage.getItem('token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            
            const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}${url}`, { headers });
            
            setData(response.data);
            
            if (onSuccess) {
                onSuccess(response.data);
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'An error occurred';
            setError(errorMessage);
            
            if (showToast) {
                toast.error(errorMessage);
            }
            
            if (onError) {
                onError(err);
            }
        } finally {
            setLoading(false);
        }
    }, [url, onSuccess, onError, showToast, refetchTrigger]);

    const refetch = useCallback(() => {
        setRefetchTrigger(prev => prev + 1);
    }, []);

    useEffect(() => {
        if (immediate && url) {
            fetchData();
        }
    }, [immediate, fetchData, ...dependencies]);

    return { data, loading, error, refetch, fetchData };
};

// Hook for POST/PUT/DELETE operations
export const useApiMutation = (options = {}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const { onSuccess, onError, showToast = true } = options;

    const mutate = useCallback(async (url, data = null, method = 'POST') => {
        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem('token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            const response = await axios({
                method,
                url: `${import.meta.env.VITE_API_BASE_URL}${url}`,
                data,
                headers
            });

            if (showToast && response.data?.message) {
                toast.success(response.data.message);
            }

            if (onSuccess) {
                onSuccess(response.data);
            }

            return response.data;
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'An error occurred';
            setError(errorMessage);

            if (showToast) {
                toast.error(errorMessage);
            }

            if (onError) {
                onError(err);
            }

            throw err;
        } finally {
            setLoading(false);
        }
    }, [onSuccess, onError, showToast]);

    return { mutate, loading, error };
};

// Hook for paginated data
export const usePaginatedApi = (url, options = {}) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [filters, setFilters] = useState({});

    const { limit = 10, onSuccess, onError, showToast = true } = options;

    const fetchData = useCallback(async (page = currentPage, newFilters = filters) => {
        try {
            setLoading(true);
            setError(null);

            const params = {
                page,
                limit,
                ...newFilters
            };

            // Remove empty values
            Object.keys(params).forEach(key => {
                if (!params[key] && params[key] !== 0) {
                    delete params[key];
                }
            });

            const token = localStorage.getItem('token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            
            const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}${url}`, { 
                params,
                headers 
            });

            // Handle different response structures
            if (response.data.success) {
                // Standard API response with success flag
                const responseData = response.data.students || response.data.payments || response.data.results || response.data.data || [];
                setData(responseData);
                setTotalPages(response.data.pagination?.totalPages || 1);
                setTotal(response.data.pagination?.totalItems || response.data.total || responseData.length);
            } else {
                // Direct data response
                setData(response.data.data || response.data[Object.keys(response.data)[0]] || []);
                setTotalPages(response.data.totalPages || 1);
                setTotal(response.data.total || 0);
            }
            setCurrentPage(page);

            if (onSuccess) {
                onSuccess(response.data);
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'An error occurred';
            setError(errorMessage);

            if (showToast) {
                toast.error(errorMessage);
            }

            if (onError) {
                onError(err);
            }
        } finally {
            setLoading(false);
        }
    }, [url, currentPage, filters, limit, onSuccess, onError, showToast]);

    const updateFilters = useCallback((newFilters) => {
        setFilters(newFilters);
        setCurrentPage(1);
        fetchData(1, newFilters);
    }, [fetchData]);

    const goToPage = useCallback((page) => {
        if (page >= 1 && page <= totalPages) {
            fetchData(page);
        }
    }, [fetchData, totalPages]);

    const refresh = useCallback(() => {
        fetchData(currentPage, filters);
    }, [fetchData, currentPage, filters]);

    useEffect(() => {
        if (url) {
            fetchData();
        }
    }, [url]);

    return {
        data,
        loading,
        error,
        currentPage,
        totalPages,
        total,
        filters,
        updateFilters,
        goToPage,
        refresh,
        setCurrentPage
    };
};