import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';

export default function Wallet() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState({ balance: 0, transactions: [] });
  const [walletLoading, setWalletLoading] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState("");

  // Check if user is logged in
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== 'customer') {
        navigate('/');
        return;
      }
      setUser(parsedUser);
    } catch (err) {
      console.error('Error parsing user data:', err);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const loadWallet = async () => {
    try {
      setWalletLoading(true);
      const res = await axiosInstance.get("/api/wallet");
      setWallet({
        balance: res.data.walletBalance || 0,
        transactions: res.data.transactions || [],
      });
    } catch (err) {
      console.error("Failed to load wallet", err);
    } finally {
      setWalletLoading(false);
    }
  };

  const handleRecharge = async (e) => {
    e.preventDefault();
    const amount = Number(rechargeAmount);
    if (!amount || amount <= 0) return;

    try {
      await axiosInstance.post("/api/wallet/recharge", { amount, method: "card" });
      setRechargeAmount("");
      await loadWallet();
      alert("Wallet recharged successfully");
    } catch (err) {
      console.error("Recharge failed", err);
      alert("Failed to recharge wallet");
    }
  };

  useEffect(() => {
    if (user) {
      loadWallet();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-violet-50/30 to-stone-100 flex items-center justify-center pt-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-violet-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-stone-600 text-lg">Loading wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-violet-50/30 to-stone-100 pt-24">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-stone-800">Wallet</h1>
            <p className="text-stone-500 mt-1">Manage your balance and transactions</p>
          </div>
          <button
            onClick={() => navigate('/dashboard/customer')}
            className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-violet-300 hover:bg-violet-50"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-r from-violet-600 to-teal-600 rounded-2xl p-6 mb-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-violet-100 text-sm font-medium mb-1">Available Balance</p>
              <p className="text-4xl font-bold">{wallet.balance.toFixed(0)} <span className="text-xl font-normal text-violet-100">BDT</span></p>
            </div>
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-3xl">💳</span>
            </div>
          </div>
        </div>

        {/* Quick Recharge */}
        <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-stone-800 mb-4">Add Funds</h2>
          <form onSubmit={handleRecharge} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                type="number"
                min="1"
                value={rechargeAmount}
                onChange={(e) => setRechargeAmount(e.target.value)}
                className="w-full border border-stone-300 rounded-lg px-4 py-3 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none transition"
                placeholder="Enter amount (BDT)"
              />
            </div>
            <button
              type="submit"
              className="bg-violet-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-violet-700 transition shadow-sm"
            >
              Add to Wallet
            </button>
          </form>
          
          {/* Quick amount buttons */}
          <div className="flex gap-2 mt-4">
            {[100, 500, 1000, 2000].map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => setRechargeAmount(String(amount))}
                className="px-4 py-2 rounded-lg border border-stone-200 bg-stone-50 text-stone-700 text-sm font-medium hover:border-violet-300 hover:bg-violet-50 transition"
              >
                +{amount}
              </button>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-stone-800 mb-4">Transaction History</h3>
          {walletLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 mx-auto"></div>
            </div>
          ) : wallet.transactions.length === 0 ? (
            <div className="text-center py-8 text-stone-500">
              <span className="text-4xl mb-3 block">📭</span>
              No transactions yet
            </div>
          ) : (
            <div className="space-y-3">
              {wallet.transactions.map((t) => {
                const isCredit = t.type === "refund" || t.type === "wallet_recharge" || t.type === "referral_reward";
                return (
                  <div
                    key={t._id}
                    className="flex justify-between items-center p-4 rounded-xl bg-stone-50 border border-stone-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isCredit ? 'bg-violet-100' : 'bg-rose-100'}`}>
                        <span className="text-lg">{isCredit ? '↓' : '↑'}</span>
                      </div>
                      <div>
                        <p className="font-medium text-stone-800 capitalize">
                          {t.type.replace(/_/g, " ")}
                        </p>
                        <p className="text-sm text-stone-500">
                          {new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className={`font-bold ${isCredit ? "text-violet-600" : "text-rose-600"}`}>
                      {isCredit ? "+" : "-"}{t.amount} BDT
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
