import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { CreditCard, CheckCircle2, AlertCircle, Check, Sparkles, ArrowRight, Shield } from 'lucide-react';
import { useLocation } from 'react-router-dom';

interface SubscriptionStatus {
  tier: string;
  usage_count: number;
  max_free_uses: number;
}

const Billing = () => {
  const { token } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState('');
  
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const success = searchParams.get('success');
  const canceled = searchParams.get('canceled');

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await api.get('/stripe/subscription-status');
        setStatus(response.data);
      } catch (err) {
        setError('Failed to load subscription status.');
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, [token]);

  const handleUpgrade = async () => {
    setCheckoutLoading(true);
    setError('');
    try {
      const response = await api.post('/stripe/create-checkout-session');
      window.location.href = response.data.checkout_url;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to initialize checkout.');
      setCheckoutLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel your Pro plan?")) return;
    setLoading(true);
    try {
      await api.post('/stripe/cancel-subscription');
      const response = await api.get('/stripe/subscription-status');
      setStatus(response.data);
      alert("Your subscription has been cancelled.");
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to cancel subscription.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-sm text-neutral-500">Loading billing information...</div>;
  }

  const isPro = status?.tier === 'pro';
  const usagePercent = Math.min(((status?.usage_count || 0) / (status?.max_free_uses || 1)) * 100, 100);

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-black mb-1">Billing & Plan</h1>
        <p className="text-sm text-neutral-500">Manage your subscription and usage.</p>
      </div>

      {success && (
        <div className="mb-5 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm flex items-center gap-2.5">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Payment successful! You are now on the Pro plan.
        </div>
      )}

      {canceled && (
        <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm flex items-center gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Checkout was canceled. Your plan has not been changed.
        </div>
      )}

      {error && (
        <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Current Plan Banner */}
      <div className={`rounded-2xl p-8 mb-8 ${isPro ? 'bg-[#111] text-white' : 'bg-white border border-neutral-200/60'}`}>
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${isPro ? 'bg-white/10' : 'bg-neutral-100'}`}>
              {isPro ? <Sparkles className="h-5 w-5 text-white" /> : <CreditCard className="h-5 w-5 text-neutral-600" />}
            </div>
            <div>
              <h2 className={`text-lg font-bold ${isPro ? 'text-white' : 'text-black'}`}>
                {isPro ? 'Pro Plan' : 'Free Plan'}
              </h2>
              <p className={`text-xs ${isPro ? 'text-neutral-400' : 'text-neutral-500'}`}>
                {isPro ? 'Unlimited access to all features' : 'Basic access with usage limits'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className={`text-3xl font-extrabold ${isPro ? 'text-white' : 'text-black'}`}>
              {isPro ? '$9.99' : '$0'}
            </span>
            <span className={`text-sm ${isPro ? 'text-neutral-500' : 'text-neutral-400'}`}>/mo</span>
          </div>
        </div>

        {!isPro && (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-neutral-500">Resume Analyses</span>
                <span className="font-semibold text-black">{status?.usage_count} of {status?.max_free_uses} used</span>
              </div>
              <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-black rounded-full transition-all"
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
            </div>

            {(status?.usage_count || 0) >= (status?.max_free_uses || 3) && (
              <p className="text-xs text-red-500 font-medium flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" />
                Free limit reached. Upgrade to continue analyzing.
              </p>
            )}

            <button
              onClick={handleUpgrade}
              disabled={checkoutLoading}
              className="w-full flex items-center justify-center gap-2.5 bg-black text-white py-3 rounded-xl text-sm font-semibold hover:bg-neutral-800 transition-all disabled:opacity-60 group"
            >
              {checkoutLoading ? 'Loading...' : 'Upgrade to Pro'}
              {!checkoutLoading && <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />}
            </button>
          </div>
        )}

        {isPro && (
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={handleCancel}
              className="text-xs font-medium text-neutral-500 hover:text-red-400 transition-colors underline underline-offset-2"
            >
              Cancel subscription
            </button>
          </div>
        )}
      </div>

      {/* Plan Comparison */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* Free */}
        <div className={`bg-white rounded-2xl border p-7 flex flex-col ${!isPro ? 'border-black ring-1 ring-black' : 'border-neutral-200/60'}`}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-black">Starter</h3>
            {!isPro && <span className="text-[10px] font-bold uppercase tracking-wider bg-neutral-100 text-neutral-600 px-2.5 py-0.5 rounded-full">Current</span>}
          </div>
          <div className="text-3xl font-extrabold text-black mb-6">
            $0<span className="text-sm font-medium text-neutral-400">/mo</span>
          </div>
          <ul className="space-y-3 flex-1">
            {['3 resume analyses', 'ATS Match Scoring', 'Strengths & Weaknesses'].map((f, i) => (
              <li key={i} className="flex items-center gap-2.5 text-sm text-neutral-600">
                <Check className="h-4 w-4 text-neutral-400 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Pro */}
        <div className={`rounded-2xl border p-7 flex flex-col ${isPro ? 'bg-[#111] text-white border-neutral-800 ring-1 ring-white/20' : 'bg-white border-neutral-200/60'}`}>
          <div className="flex items-center justify-between mb-5">
            <h3 className={`text-base font-bold ${isPro ? 'text-white' : 'text-black'}`}>Pro</h3>
            {isPro && <span className="text-[10px] font-bold uppercase tracking-wider bg-white text-black px-2.5 py-0.5 rounded-full">Current</span>}
          </div>
          <div className={`text-3xl font-extrabold mb-6 ${isPro ? 'text-white' : 'text-black'}`}>
            $9.99<span className={`text-sm font-medium ${isPro ? 'text-neutral-500' : 'text-neutral-400'}`}>/mo</span>
          </div>
          <ul className="space-y-3 flex-1">
            {['Unlimited analyses', 'Interactive AI Resume Chat', 'Live PDF Generation', 'Advanced LLaMA 3.3 70B'].map((f, i) => (
              <li key={i} className={`flex items-center gap-2.5 text-sm ${isPro ? 'text-neutral-300' : 'text-neutral-600'}`}>
                <Check className={`h-4 w-4 shrink-0 ${isPro ? 'text-neutral-500' : 'text-neutral-400'}`} />
                {f}
              </li>
            ))}
          </ul>
          {!isPro && (
            <button
              onClick={handleUpgrade}
              disabled={checkoutLoading}
              className="mt-6 w-full py-3 bg-black text-white text-sm font-semibold rounded-xl hover:bg-neutral-800 transition-all disabled:opacity-60"
            >
              {checkoutLoading ? 'Loading...' : 'Upgrade Now'}
            </button>
          )}
        </div>
      </div>

      {/* Trust */}
      <div className="mt-8 flex items-center justify-center gap-2 text-xs text-neutral-400">
        <Shield className="h-3.5 w-3.5" />
        Secured by Stripe. Cancel anytime.
      </div>
    </div>
  );
};

export default Billing;
