import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Globe } from 'lucide-react';
import { closeAuthModal, login } from '../store/slices/uiSlice';
import { supabase } from '../services/supabase';

const AuthModal = () => {
  const dispatch = useDispatch();
  const isOpen = useSelector((state) => state.ui.isAuthModalOpen);

  const handleSocialLogin = async (provider) => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider.toLowerCase(),
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) {
        return;
      }

      // The auth state change will be handled by the auth listener
    } catch (error) {
      // Handle unexpected error with provider
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => dispatch(closeAuthModal())}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[100] bg-white rounded-t-3xl shadow-2xl max-h-[90vh] overflow-hidden"
          >
             <div className="flex border-b border-gray-300 justify-center py-3">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
            </div>

            <div className="flex flex-col md:flex-row min-h-[500px]">
              <div className="flex-1 p-8 md:p-12 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                    <div className="w-5 h-5 bg-white rounded-full" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900">Quolors</h1>
                </div>

                <div className="mb-8">
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    Welcome to Qolors
                  </h2>
                  <p className="text-gray-500 text-lg md:text-xl">
                    Create beautiful color palettes instantly
                  </p>
                </div>
                
                <div className="space-y-3">
                  <button 
                    onClick={() => handleSocialLogin('Google')}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-gray-200 rounded-2xl hover:bg-gray-50 transition-all font-semibold text-lg group"
                  >
                    <Search size={24} className="text-gray-900" />
                    <span>Continue with Google</span>
                  </button>

                  <button 
                    onClick={() => handleSocialLogin('Github')}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gray-900 text-white rounded-2xl hover:bg-gray-800 transition-all font-semibold text-lg group"
                  >
                    <Globe size={24} />
                    <span>Continue with GitHub</span>
                  </button>
                </div>

                <div className="mt-8 text-center">
                  <p className="text-sm text-gray-400">
                    By continuing, you agree to our{' '}
                    <a href="#" className="text-blue-600 hover:underline font-medium">Terms</a>
                    {' '}and{' '}
                    <a href="#" className="text-blue-600 hover:underline font-medium">Privacy Policy</a>
                  </p>
                </div>
              </div>

              <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 p-12 text-white flex-col justify-between relative overflow-hidden">
                <div className="z-10">
                  <h3 className="text-3xl font-bold leading-tight mb-4">
                    The super fast color palettes generator!
                  </h3>
                  <p className="text-white/90 text-lg mb-8">
                    Create the perfect palette or get inspired by thousands of beautiful color schemes.
                  </p>

                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                    
                    <div className="flex gap-3 mb-6">
                      <div className="w-16 h-16 bg-blue-500 rounded-xl shadow-lg" />
                      <div className="w-16 h-16 bg-purple-500 rounded-xl shadow-lg" />
                      <div className="w-16 h-16 bg-pink-500 rounded-xl shadow-lg" />
                      <div className="w-16 h-16 bg-indigo-500 rounded-xl shadow-lg" />
                    </div>

                    <div className="space-y-3 text-sm mb-6">
                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                        <span className="text-white/70">HEX</span>
                        <div className="w-16 h-4 bg-white/20 rounded animate-pulse" />
                      </div>
                      <div className="flex gap-0 justify-between items-center p-3 bg-white/5 rounded-lg">
                        <span className="text-white/70">RGB</span>
                        <div className='flex gap-2'>
                        <div className="w-8 h-4 bg-white/20 rounded animate-pulse" />
                        <div className="w-8 h-4 bg-white/20 rounded animate-pulse" />
                        <div className="w-8 h-4 bg-white/20 rounded animate-pulse" />
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                        <span className="text-white/70">HSL</span>
                        <div className='flex gap-2'>
                        <div className="w-8 h-4 bg-white/20 rounded animate-pulse" />
                        <div className="w-8 h-4 bg-white/20 rounded animate-pulse" />
                        <div className="w-8 h-4 bg-white/20 rounded animate-pulse" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/20 rounded-full blur-3xl opacity-50" />
                <div className="absolute top-1/2 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl opacity-30" />
                
                <div className="absolute bottom-12 left-12 right-12 flex gap-2">
                  <div className="flex-1 h-16 bg-white/90 rounded-lg" />
                  <div className="flex-1 h-16 bg-white/70 rounded-lg" />
                  <div className="flex-1 h-16 bg-white/50 rounded-lg" />
                  <div className="flex-1 h-16 bg-white/30 rounded-lg" />
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
