import React from 'react';
import { motion } from 'motion/react';
import { Crown, Sparkles, Star } from 'lucide-react';

interface VipBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  pulse?: boolean;
}

export const VipBadge: React.FC<VipBadgeProps> = ({
  size = 'md',
  showText = true,
  className = '',
  pulse = true,
}) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3.5 py-1.5 text-sm gap-2',
  };

  const crownSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`inline-flex items-center font-extrabold rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20 border border-yellow-300/80 relative overflow-hidden select-none ${sizeClasses[size]} ${className}`}
    >
      {/* Shimmer Light Effect Overlay */}
      <motion.div
        animate={{
          x: ['-100%', '200%'],
        }}
        transition={{
          repeat: Infinity,
          duration: 2.5,
          ease: 'linear',
          repeatDelay: 1,
        }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 pointer-events-none"
      />

      {/* Animated Crown Icon */}
      <motion.div
        animate={
          pulse
            ? {
                rotate: [0, -8, 8, -4, 4, 0],
                scale: [1, 1.15, 1],
              }
            : {}
        }
        transition={{
          duration: 3,
          repeat: Infinity,
          repeatDelay: 2,
        }}
        className="relative z-10 flex items-center justify-center text-slate-950"
      >
        <Crown className={`${crownSizes[size]} fill-amber-950 stroke-amber-950`} />
      </motion.div>

      {/* Text Label */}
      {showText && (
        <span className="relative z-10 font-black tracking-wider text-slate-950 font-mono">
          VIP
        </span>
      )}

      {/* Floating Sparkle Icon */}
      <motion.div
        animate={{
          opacity: [0.4, 1, 0.4],
          scale: [0.8, 1.2, 0.8],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="relative z-10 text-slate-900"
      >
        <Sparkles className="w-2.5 h-2.5" />
      </motion.div>
    </motion.div>
  );
};

export const VipBanner: React.FC<{ clientName: string; onToggleVip?: () => void }> = ({
  clientName,
  onToggleVip,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950 via-amber-950 to-slate-950 p-4 sm:p-5 border border-amber-500/40 shadow-xl text-amber-100 mb-6"
    >
      {/* Animated Glowing Ambient Light */}
      <motion.div
        animate={{
          opacity: [0.3, 0.7, 0.3],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute -right-10 -top-10 w-48 h-48 bg-amber-500/20 blur-3xl rounded-full pointer-events-none"
      />
      
      <motion.div
        animate={{
          opacity: [0.2, 0.6, 0.2],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1,
        }}
        className="absolute -left-10 -bottom-10 w-48 h-48 bg-yellow-500/20 blur-3xl rounded-full pointer-events-none"
      />

      {/* Shimmer Line */}
      <motion.div
        animate={{
          x: ['-100%', '200%'],
        }}
        transition={{
          repeat: Infinity,
          duration: 4,
          ease: 'linear',
        }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/10 to-transparent pointer-events-none"
      />

      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Glowing Animated Crown Box */}
          <motion.div
            animate={{
              boxShadow: [
                '0 0 15px rgba(245, 158, 11, 0.4)',
                '0 0 30px rgba(245, 158, 11, 0.8)',
                '0 0 15px rgba(245, 158, 11, 0.4)',
              ],
            }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 flex items-center justify-center shrink-0 border border-yellow-200"
          >
            <Crown className="w-7 h-7 fill-slate-950 stroke-slate-950" />
          </motion.div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-widest uppercase bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-md border border-amber-500/30">
                حساب متميز VIP
              </span>
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                className="text-amber-400"
              >
                <Star className="w-3.5 h-3.5 fill-amber-400" />
              </motion.span>
            </div>
            <h3 className="text-base font-extrabold text-white mt-0.5">
              العميل {clientName} مصنف كحساب كبار الشخصيات (VIP)
            </h3>
            <p className="text-xs text-amber-200/80">
              يحظى بـ أولوية تنفيذ المهام والتفعيل اليومي ودعم فني مباشر على مدار الساعة
            </p>
          </div>
        </div>

        {onToggleVip && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggleVip}
            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 transition-colors shrink-0"
          >
            إلغاء شارة VIP
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};
