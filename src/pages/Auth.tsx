import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { Languages, ArrowRight, User, Mail, Lock, Loader2, AlertCircle, MailOpen } from 'lucide-react';
import clsx from 'clsx';

export const Auth: React.FC = () => {
  const { login, register, loginWithGoogle } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  
  type AlertState = {
    type: 'error' | 'info';
    title: string;
    message: string;
    emailCTA?: string;
  };
  
  const [alert, setAlert] = useState<AlertState | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const formatAuthError = (err: any, context: 'login' | 'register' | 'google'): AlertState => {
    if (!err) {
      return {
        type: 'error',
        title: 'Không thể tiếp tục',
        message: 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.'
      };
    }

    let rawMessage = err.message || err.error_description || err.error?.message;
    const status = err.status ?? err.error?.status ?? err.code;
    const normalizedMessage = rawMessage?.toLowerCase() || '';

    if (context === 'login') {
      if (status === 400 || normalizedMessage.includes('invalid login credentials')) {
        return {
          type: 'error',
          title: 'Không thể đăng nhập',
          message: 'Email hoặc mật khẩu chưa chính xác. Kiểm tra lại và thử lần nữa.'
        };
      }
      if (status === 429) {
        return {
          type: 'error',
          title: 'Tạm thời bị khóa',
          message: 'Bạn đã thử đăng nhập quá nhiều lần. Vui lòng đợi vài phút rồi thử lại.'
        };
      }
    }

    if (context === 'register') {
      if (rawMessage === 'FULL_NAME_REQUIRED') {
        return {
          type: 'error',
          title: 'Thiếu họ tên',
          message: 'Vui lòng nhập đầy đủ họ và tên trước khi đăng ký.'
        };
      }
      if (rawMessage === 'EMAIL_ALREADY_REGISTERED_CONFIRMED') {
        return {
          type: 'error',
          title: 'Email đã tồn tại',
          message: 'Email này đã được đăng ký và xác thực. Hãy chuyển sang đăng nhập để tiếp tục.'
        };
      }
      if (rawMessage === 'EMAIL_PENDING_CONFIRMATION') {
        return {
          type: 'info',
          title: 'Xác nhận email để hoàn tất',
          message: 'Một email xác thực đã được gửi tới hộp thư của bạn. Mở email và nhấn “Confirm your mail” để kích hoạt tài khoản. Nhớ kiểm tra cả thư mục Spam/Promotions.',
          emailCTA: 'Mở hộp thư'
        };
      }
      if (rawMessage === 'EMAIL_ALREADY_REGISTERED') {
        return {
          type: 'error',
          title: 'Email đã tồn tại',
          message: 'Email này đã có tài khoản. Đăng nhập bằng email này hoặc dùng email khác.'
        };
      }
      if (normalizedMessage.includes('user already registered')) {
        return {
          type: 'error',
          title: 'Email đã tồn tại',
          message: 'Email này đã được đăng ký. Đăng nhập bằng email này hoặc dùng email khác.'
        };
      }
      if (normalizedMessage.includes('password should be at least')) {
        return {
          type: 'error',
          title: 'Mật khẩu quá yếu',
          message: 'Mật khẩu quá ngắn. Vui lòng dùng ít nhất 6 ký tự và kết hợp chữ/số.'
        };
      }
    }

    if (context === 'google' && status === 'provider_error') {
      return {
        type: 'error',
        title: 'Google chưa phản hồi',
        message: 'Không thể đăng nhập bằng Google lúc này. Thử lại sau hoặc kiểm tra pop-up bị chặn.'
      };
    }

    if (normalizedMessage.includes('email not confirmed') || normalizedMessage.includes('email confirmation required')) {
      return {
        type: 'info',
        title: 'Cần xác thực email',
        message: 'Tài khoản chưa xác thực email. Kiểm tra hộp thư hoặc tạm tắt email confirmation trong Supabase khi dev.',
        emailCTA: 'Mở hộp thư'
      };
    }

    return {
      type: 'error',
      title: 'Không thể tiếp tục',
      message: rawMessage || 'Có lỗi xảy ra. Vui lòng thử lại.'
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (!name.trim()) throw new Error('FULL_NAME_REQUIRED');
        await register(name.trim(), email, password);
      }
    } catch (err: any) {
      setAlert(formatAuthError(err, isLogin ? 'login' : 'register'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setAlert(null);
    setLoading(true);
    try {
        await loginWithGoogle();
    } catch (err: any) {
        setAlert(formatAuthError(err, 'google'));
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-6xl bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[780px] animate-fade-in">
        
        {/* Left Side: Brand & Visual */}
        <div className="md:w-[48%] bg-gradient-to-br from-brand-600 to-accent-700 p-14 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 bg-purple-500 opacity-20 rounded-full blur-2xl"></div>

          <div className="relative z-10">
             <div className="flex items-center gap-3 mb-6">
                <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">
                   <Languages className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight">GoiMaster</h1>
             </div>
             
             <div className="space-y-4">
                <h2 className="text-4xl font-bold leading-tight">
                  {isLogin ? "Welcome Back!" : "Join the Journey"}
                </h2>
                <p className="text-brand-100 text-lg opacity-90">
                  {isLogin 
                    ? "Ready to master more Kanji? Your flashcards are waiting." 
                    : "Start building your Japanese vocabulary today with our smart flashcard system."}
                </p>
             </div>
          </div>

          <div className="text-sm opacity-60 relative z-10">
             © 2024 GoiMaster. All rights reserved.
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="md:w-[52%] p-10 md:p-14 flex flex-col justify-center bg-white relative">
          <div className="max-w-md mx-auto w-full">
            <h3 className="text-2xl font-bold text-slate-800 mb-1">{isLogin ? "Sign In" : "Create Account"}</h3>
            <p className="text-slate-400 mb-6 text-sm">
              {isLogin ? "Choose your preferred login method" : "Fill in the form below to get started"}
            </p>

            {alert && (
              <div className="mb-6 w-full">
                <div
                  className={clsx(
                    'p-5 rounded-2xl shadow-sm flex gap-3 border transition-colors',
                    alert.type === 'error'
                      ? 'bg-red-50 border-red-100 text-red-700'
                      : 'bg-emerald-50 border-emerald-100 text-emerald-700'
                  )}
                >
                  <AlertCircle
                    className={clsx(
                      'w-6 h-6 mt-0.5 flex-shrink-0',
                      alert.type === 'error' ? 'text-red-500' : 'text-emerald-500'
                    )}
                  />
                  <div>
                    <p
                      className={clsx(
                        'font-semibold text-base mb-1',
                        alert.type === 'error' ? 'text-red-700' : 'text-emerald-700'
                      )}
                    >
                      {alert.title}
                    </p>
                    <p
                      className={clsx(
                        'text-sm whitespace-pre-line leading-relaxed',
                        alert.type === 'error' ? 'text-red-600' : 'text-emerald-600'
                      )}
                    >
                      {alert.message}
                    </p>
                    {alert.emailCTA && (
                      <button
                        type="button"
                        onClick={() => window.open('https://mail.google.com', '_blank')}
                        className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-900"
                      >
                        <MailOpen className="w-4 h-4" />
                        {alert.emailCTA}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Google Button */}
            <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium py-3 px-4 rounded-xl transition-all mb-6 relative group"
            >
                 <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Sign in with Google
            </button>

            <div className="relative flex py-2 items-center mb-6">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-semibold uppercase tracking-wider">Or continue with</span>
                <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3.5 text-slate-400 w-5 h-5" />
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                      placeholder="John Doe"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 text-slate-400 w-5 h-5" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                    placeholder="name@example.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 text-slate-400 w-5 h-5" />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3.5 bg-brand-600 text-white font-bold rounded-xl shadow-lg shadow-brand-200 hover:bg-brand-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 mt-4"
              >
                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : (
                  <>
                    {isLogin ? "Sign In" : "Register"} 
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-slate-500 text-sm">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <button 
                  onClick={() => { setIsLogin(!isLogin); setAlert(null); }}
                  className="ml-2 font-bold text-brand-600 hover:text-brand-800 transition-colors"
                >
                  {isLogin ? "Sign Up" : "Log In"}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};