import React, { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

export const Login: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      const userCredential = await signInWithPopup(auth, provider);
      
      // Save to firestore if it's a new user
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        let role = 'pending';
        if (userCredential.user.email === 'ahmedgoda.manager@gmail.com') {
           role = 'admin'; 
        }

        await setDoc(userDocRef, {
          email: userCredential.user.email,
          name: userCredential.user.displayName || 'مستخدم جديد',
          role,
          createdAt: new Date().toISOString()
        });
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'حدث خطأ أثناء الاتصال بحساب Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      dir="rtl"
      className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 select-none bg-[#f8fafc]"
    >
      {/* Subtle modern clean background grid & soft ambient tint */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Soft radial ambient gradient in the brand's primary navy/indigo hue */}
        <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-indigo-100/50 via-slate-100/30 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-[20%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-t from-blue-50/60 to-transparent rounded-full blur-2xl" />
        
        {/* Clean geometric dot grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage: `radial-gradient(#cbd5e1 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        />
      </div>

      {/* Main Clean Card Container */}
      <div className="relative z-10 w-full max-w-[440px]">
        <div className="relative rounded-2xl bg-white border border-slate-200/90 shadow-[0_10px_35px_-8px_rgba(15,23,42,0.08),0_2px_10px_-2px_rgba(15,23,42,0.04)] p-8 sm:p-10 text-center">
          
          {/* Subtle Top Accent bar with primary brand navy/indigo color */}
          <div className="mx-auto w-16 h-1 rounded-full bg-[#1e293b] mb-6" />

          {/* Clean White Logo Display Area - pure original colors without dark filters */}
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="p-3 rounded-2xl bg-white flex items-center justify-center">
              <img
                src="/logo-light.png"
                alt="دفة - DEFFA CRM"
                className="h-28 sm:h-32 w-auto object-contain transition-transform duration-200 hover:scale-[1.02]"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.dataset.triedFallback !== '1') {
                    target.dataset.triedFallback = '1';
                    target.src = 'https://i.ibb.co/Kpk6wtn2/logo-light.jpg';
                  }
                }}
              />
            </div>

            {/* Arabic Subtitle: منصة إدارة ومتابعة حسابات العملاء (CRM) in Primary Navy/Dark Blue */}
            <p className="mt-4 text-[14px] sm:text-[15px] font-semibold text-[#1e293b] leading-relaxed">
              منصة إدارة ومتابعة حسابات العملاء <span className="text-indigo-600 font-bold tracking-wider">(CRM)</span>
            </p>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-6">
            <div className="flex-grow h-px bg-slate-200" />
            <span className="px-3 text-xs text-slate-400 font-medium bg-white">تسجيل الدخول الآمن</span>
            <div className="flex-grow h-px bg-slate-200" />
          </div>

          {/* Error Message if any */}
          {error && (
            <div className="mb-5 p-3 bg-rose-50 text-rose-700 text-xs sm:text-sm font-medium rounded-xl border border-rose-200 text-right leading-relaxed">
              {error}
            </div>
          )}

          {/* Standard Clean Google Sign-In Button (White background, light gray border, colorful Google logo) */}
          <div className="mt-2">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-5 rounded-xl bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-300 hover:border-slate-400 font-semibold text-sm sm:text-base shadow-sm hover:shadow transition-all duration-150 disabled:opacity-60 disabled:pointer-events-none"
            >
              {/* Official Colored Google Icon */}
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>

              <span>
                {loading ? 'جاري التحقق والدخول...' : 'تسجيل الدخول باستخدام Google'}
              </span>
            </button>
          </div>

        </div>

        {/* Clean Bottom Copyright */}
        <p className="mt-5 text-center text-xs text-slate-400 font-medium">
          جميع الحقوق محفوظة 2026 - Godziix
        </p>
      </div>
    </div>
  );
};
