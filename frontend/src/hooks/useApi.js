import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

export function useApi(apiFn, { onSuccess, onError, successMessage } = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFn(...args);
      const result = response.data;
      setData(result);
      if (successMessage) toast.success(successMessage);
      if (onSuccess) onSuccess(result);
      return result;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Something went wrong';
      setError(message);
      toast.error(message);
      if (onError) onError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFn, onSuccess, onError, successMessage]);

  return { execute, loading, error, data };
}
