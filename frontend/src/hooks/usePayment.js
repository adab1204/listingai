// frontend/src/hooks/usePayment.js
import { useState, useCallback } from 'react';
import { paymentAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export const usePayment = () => {
  const { user, updateCredits } = useAuth();
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState(false);

  const initiatePayment = useCallback(async (plan) => {
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) throw new Error('Failed to load Razorpay. Please check your connection.');

      // Create order on backend
      const { data: orderData } = await paymentAPI.createOrder(plan);
      const { orderId, amount, currency, keyId } = orderData.data;

      return new Promise((resolve, reject) => {
        const options = {
          key:      keyId,
          amount,
          currency,
          name:     'ListingAI',
          description: `${plan.replace('_', ' ')} Plan — Monthly`,
          order_id: orderId,
          prefill: {
            name:  user?.name  || '',
            email: user?.email || '',
          },
          theme: { color: '#C9963A' },
          modal: {
            ondismiss: () => {
              setLoading(false);
              reject(new Error('Payment cancelled.'));
            },
          },
          handler: async (response) => {
            try {
              // Verify on backend
              await paymentAPI.verifyPayment({
                razorpayOrderId:   response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });

              // Refresh subscription data
              const { data: subData } = await userAPI.getSubscription();
              if (subData.data?.creditsTotal) {
                updateCredits(subData.data.creditsTotal);
              }

              setSuccess(true);
              setLoading(false);
              resolve({ success: true, plan });
            } catch (verifyErr) {
              const msg = verifyErr.response?.data?.message || 'Payment verification failed.';
              setError(msg);
              setLoading(false);
              reject(verifyErr);
            }
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (response) => {
          setError(`Payment failed: ${response.error.description}`);
          setLoading(false);
          reject(new Error(response.error.description));
        });
        rzp.open();
      });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Payment could not be initiated.';
      setError(msg);
      setLoading(false);
      throw err;
    }
  }, [user, updateCredits]);

  return { initiatePayment, loading, error, success };
};
