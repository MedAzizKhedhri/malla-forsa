import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAppToast } from '../components/ToastProvider';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';

export default function Login() {
  const toast = useAppToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('malla_token');
    if (token) {
      navigate('/');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/admin/login', { email, password });
      localStorage.setItem('malla_token', res.data.token);
      toast.success('Connexion réussie ! Bienvenue.');
      navigate('/');
      // Refresh the page to re-initialize Layout and routes with token
      window.location.reload();
    } catch (err) {
      const msg = err.response?.data?.message || 'Email ou mot de passe incorrect.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Decorative backdrop gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />

      <div className="w-full max-w-md bg-white/5 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-300">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent tracking-tighter">
            Malla Forssa
          </h1>
          <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mt-1">
            Import Broker Portal
          </p>
          <h2 className="text-xl font-bold text-slate-200 mt-6">Accéder au Dashboard</h2>
          <p className="text-sm text-slate-400 mt-1">Connectez-vous pour gérer vos importations</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Adresse Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                required
                type="email"
                placeholder="broker@mallaforssa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/50 hover:bg-slate-950/80 focus:bg-slate-950 px-11 py-3 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium placeholder-slate-600"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                required
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/50 hover:bg-slate-950/80 focus:bg-slate-950 px-11 py-3 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium placeholder-slate-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl py-3 px-4 font-bold text-sm transition-all shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] disabled:opacity-75 flex items-center justify-center gap-2 mt-8 group cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Se connecter <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-800/60 pt-6">
          <p className="text-xs text-slate-500">
            Interface réservée à l'administrateur du courtage d'importation.
          </p>
        </div>
      </div>
    </div>
  );
}
