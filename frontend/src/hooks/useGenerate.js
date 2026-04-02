// frontend/src/hooks/useGenerate.js
import { useState, useCallback } from 'react';
import { contentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const useGenerate = () => {
  const { updateCredits } = useAuth();
  const [output, setOutput]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const generate = useCallback(async ({ contentType, listing }) => {
    if (!listing?.address?.trim()) {
      setError('Please enter a listing address.');
      return;
    }

    setLoading(true);
    setOutput('');
    setError('');

    try {
      const { data } = await contentAPI.generate(contentType, listing);
      setOutput(data.data.output);

      // Reflect updated credits if returned
      if (data.data.creditsRemaining !== undefined) {
        updateCredits(data.data.creditsRemaining);
      }
    } catch (err) {
      const status  = err.response?.status;
      const message = err.response?.data?.message;
      const code    = err.response?.data?.code;

      if (status === 402) {
        setError(code === 'NO_CREDITS'
          ? 'You have used all your free credits. Upgrade to continue.'
          : message || 'Monthly generation limit reached. Please upgrade your plan.'
        );
      } else if (status === 401) {
        setError('Session expired. Please log in again.');
      } else if (status === 429) {
        setError('Too many requests. Please wait a moment and try again.');
      } else {
        setError(message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [updateCredits]);

  const reset = useCallback(() => {
    setOutput('');
    setError('');
  }, []);

  return { output, loading, error, generate, reset };
};
