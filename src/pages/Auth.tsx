import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, LogIn, Loader2, UserPlus, Heart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import EditorialCard from '../components/ui/EditorialCard';
import PremiumButton from '../components/ui/PremiumButton';
import { useNavigate } from 'react-router-dom';

const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (error) throw error;
        // Navigation will be handled automatically by ProtectedRoute/AuthContext firing
        navigate('/');
      } else {
        const { error, data } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName,
            }
          }
        });
        if (error) throw error;
        setSuccessMsg('Account created successfully! Welcome.');
        setTimeout(() => {
          if (data.session) navigate('/');
        }, 1500)
      }
    } catch (error: any) {
      setErrorMsg(error.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-surface">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <EditorialCard elevated className="p-8 border-none md:p-12 shadow-2xl relative overflow-hidden bg-white">
          <div className="absolute top-0 right-0 p-8 text-primary/10 pointer-events-none">
            <Heart size={100} strokeWidth={1} />
          </div>

          <div className="text-center mb-8 relative z-10">
            <img src="/logo.png" alt="Our Time" className="h-12 mx-auto mb-6 drop-shadow-sm" />
            <h1 className="text-2xl font-bold text-on-surface">
              {isLogin ? 'Welcome back' : 'Create an account'}
            </h1>
            <p className="text-sm font-medium text-on-surface/50 mt-2">
              {isLogin ? 'Enter your details to access your shared memories.' : 'Begin tracking your journey together.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            {!isLogin && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface/70 mb-2">
                  Full Name
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <UserPlus size={18} className="text-on-surface/30 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type="text"
                    name="fullName"
                    required={!isLogin}
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full pl-11 pr-4 py-3 bg-surface border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface/70 mb-2">
                Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail size={18} className="text-on-surface/30 group-focus-within:text-primary transition-colors" />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-11 pr-4 py-3 bg-surface border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface/70 mb-2">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={18} className="text-on-surface/30 group-focus-within:text-primary transition-colors" />
                </div>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-11 pr-4 py-3 bg-surface border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <AnimatePresence>
              {errorMsg && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-xs font-bold text-red-500 bg-red-500/10 p-3 rounded-lg text-center">
                  {errorMsg}
                </motion.div>
              )}
              {successMsg && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-xs font-bold text-green-600 bg-green-500/10 p-3 rounded-lg text-center">
                  {successMsg}
                </motion.div>
              )}
            </AnimatePresence>

            <PremiumButton type="submit" disabled={loading} variant="primary" className="w-full py-3.5 mt-6">
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <span className="flex items-center gap-2">
                  {isLogin ? 'Sign In' : 'Create Account'} <LogIn size={18} />
                </span>
              )}
            </PremiumButton>

            <div className="mt-6 text-center pt-6 border-t border-outline-variant/20">
              <button
                type="button"
                onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); setSuccessMsg(''); }}
                className="text-sm font-bold text-on-surface/60 hover:text-primary transition-colors"
              >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
          </form>
        </EditorialCard>
      </motion.div>
    </div>
  );
};

export default Auth;
