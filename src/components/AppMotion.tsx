import React from 'react';
import { AnimatePresence, motion } from 'motion/react';

const ease = [0.22, 1, 0.36, 1] as const;

/** A single, restrained transition used whenever the CRM changes screens. */
export const AppPageTransition: React.FC<{ viewKey: string; children: React.ReactNode }> = ({ viewKey, children }) => (
  <AnimatePresence mode="wait" initial={false}>
    <motion.div
      key={viewKey}
      initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -6, filter: 'blur(3px)' }}
      transition={{ duration: 0.32, ease }}
    >
      {children}
    </motion.div>
  </AnimatePresence>
);

/** Use on dashboard groups that should reveal in an elegant cascade. */
export const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

export const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease } },
};