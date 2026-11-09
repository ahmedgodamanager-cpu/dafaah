import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { collection, query, getDocs, doc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Users, Mail, User as UserIcon, Shield, Loader2, ChevronRight, Briefcase, Clock, Check, Trash2, UserX, ShieldAlert } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../utils/firebaseUtils';
import { Client } from '../types';
import { ClientCard } from './ClientCard';
import { useAuth } from '../context/AuthContext';

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface UsersViewProps {
  clients: Client[];
  onSelectClient: (clientId: string) => void;
}

export function UsersView({ clients, onSelectClient }: UsersViewProps) {
  const { profile } = useAuth();
  const isManagerOrAdmin = profile?.role === 'admin' || profile?.role === 'account_manager_head' || profile?.role === 'manager';

  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);
  
  // Transfer state
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [clientToTransferId, setClientToTransferId] = useState<string | null>(null);
  const [transferTargetUserId, setTransferTargetUserId] = useState<string>('');
  const [isTransferring, setIsTransferring] = useState(false);
  
  // Delete state
  const [userToDelete, setUserToDelete] = useState<SystemUser | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const q = query(collection(db, 'users'));
      const querySnapshot = await getDocs(q);
      const fetchedUsers: SystemUser[] = [];
      for (const userDoc of querySnapshot.docs) {
        const data = userDoc.data();
        let role = data.role || 'user';
        // Normalize 'manager' (مدير أكونت) to 'account_manager_head' (مدير قسم الأكونت مانجمنت) in-memory
        if (role === 'manager' || role === 'account_manager') {
          role = 'account_manager_head';
        }
        fetchedUsers.push({
          id: userDoc.id,
          name: data.name || 'مستخدم',
          email: data.email || '',
          role,
          createdAt: data.createdAt || new Date().toISOString()
        });
      }
      setUsers(fetchedUsers);
    } catch (err) {
      console.error(err);
      try {
        handleFirestoreError(err, OperationType.GET, 'users');
      } catch (formattedError: any) {
        setError(formattedError.message || 'حدث خطأ أثناء جلب المستخدمين');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const isSusp = newRole === 'pending' || newRole === 'suspended' || newRole === 'disabled' || newRole === 'stopped' || newRole === 'توقف' || newRole === 'إيقاف';
      const userRef = doc(db, 'users', userId);
      const updates = {
        role: newRole,
        status: isSusp ? 'suspended' : 'active',
        isSuspended: isSusp,
        isActive: !isSusp,
        updatedAt: new Date().toISOString()
      };
      await updateDoc(userRef, updates);
      setUsers(users.map(u => u.id === userId ? { ...u, ...updates, role: newRole } : u));
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء تحديث الصلاحية');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    // Legacy function, replaced by inline confirm in modal
  };

  const handleTransferClient = async () => {
    if (!clientToTransferId || !transferTargetUserId) return;
    setIsTransferring(true);
    try {
      const targetUser = users.find(u => u.id === transferTargetUserId);
      const targetUserName = targetUser?.name || targetUser?.email || 'موظف';
      const clientRef = doc(db, 'clients', clientToTransferId);
      await updateDoc(clientRef, {
        createdBy: transferTargetUserId,
        ownerName: targetUserName,
        assignedTo: targetUserName,
        assignedToName: targetUserName,
        accountManager: targetUserName
      });
      
      const clientName = clients.find(c => c.id === clientToTransferId)?.clientName || 'عميل';
      const notifId = 'notif-' + Date.now().toString();
      const notifRef = doc(db, 'notifications', notifId);
      await setDoc(notifRef, {
        userId: transferTargetUserId,
        title: 'تم نقل عميل جديد إليك',
        message: `تم نقل العميل "${clientName}" إلى عهدتك.`,
        isRead: false,
        createdAt: new Date().toISOString(),
        type: 'transfer',
        linkToClientId: clientToTransferId
      });

      setTransferModalOpen(false);
      setClientToTransferId(null);
      setTransferTargetUserId('');
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء نقل العميل');
    } finally {
      setIsTransferring(false);
    }
  };

  // Synchronize client owner fields in Firestore if they don't match the selectedUser
  useEffect(() => {
    if (!selectedUser) return;
    const clientsToSync = clients.filter(c => 
      c.createdBy === selectedUser.id && 
      (c.ownerName !== selectedUser.name || c.assignedTo !== selectedUser.name)
    );
    if (clientsToSync.length > 0) {
      clientsToSync.forEach(async (c) => {
        try {
          const clientRef = doc(db, 'clients', c.id);
          await updateDoc(clientRef, {
            ownerName: selectedUser.name,
            assignedTo: selectedUser.name,
            assignedToName: selectedUser.name,
            accountManager: selectedUser.name
          });
        } catch (e) {
          console.error("Error syncing client owner in UsersView", e);
        }
      });
    }
  }, [selectedUser, clients]);

  if (selectedUser) {
    const userClients = clients.filter(c => c.createdBy === selectedUser.id);
    const usersMap = users.reduce<Record<string, string>>((acc, u) => {
      acc[u.id] = u.name;
      return acc;
    }, { [selectedUser.id]: selectedUser.name });
    
    return (
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center gap-4 mb-6">
          <button 
            type="button"
            onClick={() => setSelectedUser(null)} 
            className="p-2 bg-[#18181B] hover:bg-[#202024] border border-[#27272A] rounded-xl transition-colors shrink-0 cursor-pointer"
            aria-label="العودة للمستخدمين"
          >
            <ChevronRight className="w-5 h-5 text-[#A1A1AA]" />
          </button>
          <div>
            <h2 className="text-xl font-black text-[#FAFAFA] flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-indigo-400" />
              <span>عملاء {selectedUser.name}</span>
            </h2>
            <p className="text-xs text-[#A1A1AA] mt-1 flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#71717A]" />
              <span className="dir-ltr text-right font-mono">{selectedUser.email}</span>
            </p>
          </div>
          <div className="mr-auto">
            <span className="bg-[#18181B] text-[#FAFAFA] border border-[#27272A] px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono flex items-center gap-1.5">
              <span>{userClients.length}</span>
              <span className="font-normal text-[#A1A1AA]">عميل</span>
            </span>
          </div>
        </div>

        {userClients.length === 0 ? (
          <div className="bg-[#18181B] p-12 rounded-2xl border border-[#27272A] shadow-xs flex flex-col items-center justify-center text-center">
             <div className="w-16 h-16 bg-[#09090B] border border-[#27272A] rounded-2xl flex items-center justify-center mb-4">
                <Briefcase className="w-8 h-8 text-[#71717A]" />
             </div>
            <h3 className="text-base font-bold text-[#FAFAFA] mb-2">لا يوجد عملاء</h3>
            <p className="text-[#A1A1AA] text-xs font-medium max-w-md">لم يقم هذا المستخدم بإضافة أي عملاء حتى الآن.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userClients.map((client) => {
              const clientForUser = {
                ...client,
                ownerName: selectedUser.name,
                assignedTo: selectedUser.name,
                assignedToName: selectedUser.name
              };
              return (
                <ClientCard
                  key={client.id}
                  client={clientForUser}
                  usersMap={usersMap}
                  onSelect={() => onSelectClient(client.id)}
                  onEdit={() => {}} // User view shouldn't trigger edit directly, or it could
                  onTransfer={(id) => {
                    setClientToTransferId(id);
                    setTransferTargetUserId('');
                    setTransferModalOpen(true);
                  }}
                />
              );
            })}
          </div>
        )}

        {/* Transfer Modal */}
        {transferModalOpen && clientToTransferId && createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" dir="rtl">
            <div className="bg-[#18181B] w-full max-w-md rounded-2xl shadow-xl border border-[#27272A] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
              <div className="p-4 border-b border-[#27272A] bg-[#09090B] flex items-center justify-between">
                <h3 className="font-bold text-base text-[#FAFAFA] flex items-center gap-2">
                  <span>نقل العميل:</span>
                  <span className="text-indigo-400">
                    {clients.find(c => c.id === clientToTransferId)?.clientName || ''}
                  </span>
                </h3>
              </div>
               
              <div className="p-5 space-y-4">
                <p className="text-xs text-[#A1A1AA] leading-relaxed">
                  اختر المستخدم الذي ترغب بنقل العميل إليه. بعد النقل، سيختفي العميل من قائمة المستخدم الحالي وسيظهر لدى المستخدم الجديد.
                </p>
                 
                <div>
                  <label className="block text-xs font-bold text-[#FAFAFA] mb-1.5">المستخدم الجديد</label>
                  <select
                    value={transferTargetUserId || ''}
                    onChange={(e) => setTransferTargetUserId(e.target.value)}
                    className="w-full bg-[#09090B] text-[#FAFAFA] border border-[#27272A] rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">اختر المستخدم...</option>
                    {users.filter(u => u.id !== selectedUser.id).map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                    ))}
                  </select>
                </div>
              </div>
               
              <div className="p-4 border-t border-[#27272A] bg-[#09090B] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTransferModalOpen(false)}
                  disabled={isTransferring}
                  className="px-4 py-2 text-xs font-bold text-[#A1A1AA] hover:text-[#FAFAFA] bg-transparent hover:bg-[#27272A] border border-[#27272A] rounded-xl transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleTransferClient}
                  disabled={!transferTargetUserId || isTransferring}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  {isTransferring ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      جاري النقل...
                    </>
                  ) : (
                    'تأكيد النقل'
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-[#FAFAFA] flex items-center gap-2">
          <Users className="w-6 h-6 text-indigo-400" />
          <span>المستخدمين</span>
        </h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-[#18181B] border border-[#27272A] px-3.5 py-1.5 rounded-xl text-xs">
            <span className="text-[#A1A1AA]">إجمالي المستخدمين:</span>
            <span className="font-mono font-bold text-[#FAFAFA]">{users.length}</span>
          </div>
        </div>
      </div>

      <div className="bg-[#18181B] rounded-2xl border border-[#27272A] shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#A1A1AA]">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-400" />
            <p className="text-xs font-medium">جاري تحميل المستخدمين...</p>
          </div>
        ) : error ? (
          <div className="m-5 bg-[#F43F5E]/10 text-[#F43F5E] p-4 rounded-xl text-xs font-medium border border-[#F43F5E]/25 text-center">
            {error}
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-20 text-[#A1A1AA]">
            <Users className="w-12 h-12 mx-auto text-[#3F3F46] mb-4" />
            <p className="font-bold text-sm text-[#FAFAFA]">لا يوجد مستخدمين مسجلين</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead className="text-sm font-medium text-[#A1A1AA] bg-[#09090B] border-b border-[#27272A]">
                <tr>
                  <th scope="col" className="px-6 py-4 font-medium">المستخدم</th>
                  <th scope="col" className="px-6 py-4 font-medium">البريد الإلكتروني</th>
                  <th scope="col" className="px-6 py-4 font-medium">الدور</th>
                  <th scope="col" className="px-6 py-4 font-medium">عدد العملاء</th>
                  <th scope="col" className="px-6 py-4 font-medium">تاريخ الانضمام</th>
                  <th scope="col" className="px-6 py-4 font-medium text-left">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272A]">
                {users.map((user) => {
                  const userClientsCount = clients.filter(c => c.createdBy === user.id).length;
                  return (
                    <tr 
                      key={user.id} 
                      onClick={() => setSelectedUser(user)}
                      className="bg-[#18181B] hover:bg-[#202024] cursor-pointer transition-colors duration-150 group"
                    >
                      {/* Name & Avatar */}
                      <td className="px-6 py-4 text-sm font-bold text-[#FAFAFA]">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-500/15 text-indigo-400 flex items-center justify-center font-bold shrink-0 transition-transform group-hover:scale-105 border border-indigo-500/20">
                            <UserIcon className="w-4 h-4" />
                          </div>
                          <span className="group-hover:text-indigo-300 transition-colors">
                            {user.name}
                          </span>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-6 py-4 text-xs sm:text-sm text-[#A1A1AA]">
                        <div className="flex items-center gap-2 font-mono">
                          <Mail className="w-3.5 h-3.5 text-[#71717A] shrink-0" />
                          <span className="dir-ltr text-right">{user.email}</span>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                          user.role === 'admin' 
                            ? 'bg-[#F43F5E]/15 text-[#F43F5E] border border-[#F43F5E]/30' 
                            : user.role === 'account_manager_head'
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : user.role === 'pending' || user.role === 'suspended'
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            : 'bg-[#6366F1]/15 text-[#6366F1] border border-[#6366F1]/30'
                        }`}>
                          {user.role === 'admin' && <Shield className="w-3 h-3" />}
                          {user.role === 'account_manager_head' && <Briefcase className="w-3 h-3" />}
                          {(user.role === 'pending' || user.role === 'suspended') && <UserX className="w-3 h-3 text-rose-400" />}
                          {user.role === 'member' && <UserIcon className="w-3 h-3" />}
                          {user.role === 'admin' ? 'مدير نظام' : user.role === 'account_manager_head' ? 'مدير قسم الأكونت مانجمنت' : (user.role === 'pending' || user.role === 'suspended') ? 'موقوف (معطل)' : 'مستخدم'}
                        </span>
                      </td>

                      {/* Client Count */}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-[#09090B] text-[#FAFAFA] border border-[#27272A]">
                          <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{userClientsCount}</span>
                        </span>
                      </td>

                      {/* Created At */}
                      <td className="px-6 py-4 text-xs sm:text-sm text-[#A1A1AA] dir-ltr text-right font-mono">
                        {new Date(user.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-left" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          {(user.role === 'pending' || user.role === 'suspended') && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateRole(user.id, 'member');
                              }}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer"
                              title="إعادة تفعيل الحساب فوراً"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>تفعيل</span>
                            </button>
                          )}
                          <select
                            value={user.role || "member"}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleUpdateRole(user.id, e.target.value);
                            }}
                            className={`bg-[#09090B] border text-xs font-medium rounded-xl py-1.5 px-2.5 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer transition-colors ${
                              user.role === 'pending' || user.role === 'suspended'
                                ? 'border-rose-500/40 text-rose-300'
                                : 'border-[#27272A] hover:border-[#3F3F46] text-[#FAFAFA]'
                            }`}
                          >
                            <option value="member">مستخدم (موظف)</option>
                            <option value="account_manager_head">مدير قسم الأكونت مانجمنت</option>
                            <option value="admin">مدير نظام</option>
                            <option value="pending">إيقاف الحساب (معطل)</option>
                          </select>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setUserToDelete(user);
                            }}
                            className="p-1.5 text-[#71717A] hover:text-[#F43F5E] bg-transparent hover:bg-[#F43F5E]/10 border border-transparent hover:border-[#F43F5E]/30 rounded-xl transition-all cursor-pointer"
                            title="حذف المستخدم"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete User Modal */}
      {userToDelete && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4" dir="rtl">
          <div className="bg-[#18181B] w-full max-w-sm rounded-2xl shadow-2xl border border-[#27272A] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-[#F43F5E]/15 text-[#F43F5E] border border-[#F43F5E]/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-[#FAFAFA] mb-2">تأكيد الحذف</h3>
              <p className="text-xs text-[#A1A1AA] leading-relaxed mb-6">
                هل أنت متأكد من حذف المستخدم <strong className="text-[#F43F5E]">{userToDelete.name}</strong> نهائياً؟ لا يمكن التراجع عن هذا الإجراء.
              </p>
              <div className="flex items-center gap-3 w-full">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const userRef = doc(db, 'users', userToDelete.id);
                      await deleteDoc(userRef);
                      setUsers(users.filter(u => u.id !== userToDelete.id));
                      if (selectedUser?.id === userToDelete.id) {
                        setSelectedUser(null);
                      }
                      setUserToDelete(null);
                    } catch (err) {
                      console.error(err);
                      setUserToDelete(null);
                    }
                  }}
                  className="flex-1 px-4 py-2.5 bg-[#F43F5E] text-white rounded-xl text-xs font-bold hover:bg-[#E11D48] transition-colors shadow-xs cursor-pointer"
                >
                  نعم، احذف
                </button>
                <button
                  type="button"
                  onClick={() => setUserToDelete(null)}
                  className="flex-1 px-4 py-2.5 bg-[#27272A] text-[#FAFAFA] hover:bg-[#3F3F46] rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
