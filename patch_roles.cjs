const fs = require('fs');
let content = fs.readFileSync('src/components/UsersView.tsx', 'utf8');

const roleColor = `user.role === 'admin' 
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' 
                            : user.role === 'manager'
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400'
                            : user.role === 'pending'
                            ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400'
                            : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400'`;

content = content.replace(
  /user\.role === 'admin'\s*\?\s*'bg-amber-100 text-amber-700 dark:bg-amber-500\/10 dark:text-amber-400'\s*:\s*user\.role === 'pending'\s*\?\s*'bg-orange-100 text-orange-700 dark:bg-orange-500\/10 dark:text-orange-400'\s*:\s*'bg-indigo-100 text-indigo-700 dark:bg-indigo-500\/10 dark:text-indigo-400'/s,
  roleColor
);

const roleIcons = `{user.role === 'admin' && <Shield className="w-3 h-3" />}
                          {user.role === 'manager' && <Briefcase className="w-3 h-3" />}
                          {user.role === 'pending' && <Clock className="w-3 h-3" />}
                          {user.role === 'member' && <UserIcon className="w-3 h-3" />}
                          {user.role === 'admin' ? 'مدير نظام' : user.role === 'manager' ? 'مدير' : user.role === 'pending' ? 'قيد الانتظار' : 'مستخدم'}`;

content = content.replace(
  /\{user\.role === 'admin' && <Shield className="w-3 h-3" \/>\}\s*\{user\.role === 'pending' && <Clock className="w-3 h-3" \/>\}\s*\{user\.role === 'member' && <UserIcon className="w-3 h-3" \/>\}\s*\{user\.role === 'admin' \? 'مدير نظام' : user\.role === 'pending' \? 'قيد الانتظار' : 'مستخدم'\}/s,
  roleIcons
);

fs.writeFileSync('src/components/UsersView.tsx', content);
