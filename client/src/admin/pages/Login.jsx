import { useState } from 'react';
import { api } from '../utils/api.js';
import { Icon, I } from '../utils/icons.jsx';

export const LoginScreen = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('adminToken', res.data.token);
      onLogin(res.data.token);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex" style={{ fontFamily: "'Instrument Serif', 'Georgia', serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif&family=DM+Sans:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />

      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#1A1102] overflow-hidden flex-col justify-between p-14">
        {/* Background texture */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 25% 50%, #FFAA14 0%, transparent 50%), radial-gradient(circle at 75% 20%, #f59e0b 0%, transparent 40%)" }} />

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-9 h-9 rounded-xl bg-amber-400 flex items-center justify-center">
              <span className="text-black font-black text-base">W</span>
            </div>
            <span className="text-white font-bold text-lg tracking-tight" style={{ fontFamily: "'DM Sans', sans-serif" }}>Wiibi Energy</span>
          </div>

          <h1 className="text-white text-5xl leading-[1.15] mb-6">
            Power the<br />
            <em className="text-amber-400">future</em><br />
            of Nigeria.
          </h1>
          <p className="text-white/50 text-base leading-relaxed max-w-sm" style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 400 }}>
            Manage your solar energy platform — update content, products, and more from one clean interface.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-4">
          {[
            { value: '2,400+', label: 'Installations' },
            { value: '98%',    label: 'Satisfaction'  },
            { value: '₦0',     label: 'Downtime cost' },
          ].map(s => (
            <div key={s.label} className="flex-1 bg-white/5 rounded-2xl p-4 border border-white/10">
              <p className="text-amber-400 font-black text-2xl leading-none mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>{s.value}</p>
              <p className="text-white/40 text-xs font-medium" style={{ fontFamily: "'DM Sans', sans-serif" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-8 h-8 rounded-xl bg-amber-400 flex items-center justify-center">
              <span className="text-black font-black text-sm">W</span>
            </div>
            <span className="text-stone-900 font-black text-base">Wiibi Energy</span>
          </div>

          <h2 className="text-stone-900 text-3xl font-black tracking-tight mb-1">Welcome back</h2>
          <p className="text-stone-500 text-sm mb-8">Sign in to your admin dashboard</p>

          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl mb-6 text-sm">
              <Icon d={I.alert} size={15} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-stone-700 text-[12px] font-bold uppercase tracking-wider block mb-2">Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full bg-white border border-stone-200 rounded-2xl px-4 py-3.5 text-stone-900 text-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-300 transition-all shadow-sm"
                placeholder="admin@wiibienergy.com"
              />
            </div>

            <div>
              <label className="text-stone-700 text-[12px] font-bold uppercase tracking-wider block mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                  className="w-full bg-white border border-stone-200 rounded-2xl px-4 py-3.5 pr-12 text-stone-900 text-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-300 transition-all shadow-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition-colors"
                >
                  <Icon d={showPw ? I.eyeOff : I.eye} size={16} />
                </button>
              </div>
            </div>

            <div className="pt-1">
              <button
                type="submit" disabled={loading}
                className="w-full bg-stone-900 hover:bg-stone-800 text-white py-4 rounded-2xl font-black text-sm transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in…</>
                  : 'Sign in →'
                }
              </button>
            </div>
          </form>

          <p className="text-center text-stone-400 text-xs mt-8">
            Wiibi Energy Content Studio · Admin only
          </p>
        </div>
      </div>
    </div>
  );
};
