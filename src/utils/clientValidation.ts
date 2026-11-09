import { Client } from '../types';

export interface ClientValidationData {
  id?: string;
  code?: string;
  phone?: string;
  clientNumber?: string;
  groupName?: string;
  clientName?: string;
}

/**
 * دالة للتحقق من عدم تكرار العميل
 * تقوم بفحص:
 * 1. كود العميل (تجاهل الفراغات وحالة الأحرف)
 * 2. رقم الاتصال / الهاتف
 * 3. اسم الجروب (تجاهل الفراغات وحالة الأحرف)
 */
export const checkClientDuplication = (
  newClientData: ClientValidationData,
  existingClients: (Client | any)[]
): { isDuplicate: boolean; errorMessage: string | null } => {
  if (!existingClients || !Array.isArray(existingClients)) {
    return { isDuplicate: false, errorMessage: null };
  }

  for (const client of existingClients) {
    if (!client) continue;

    // استثناء نفس العميل عند وضع التعديل (Edit Mode)
    if (newClientData.id && client.id && newClientData.id === client.id) {
      continue;
    }

    // 1. التحقق من تطابق الكود (تجاهل الفراغات وحالة الأحرف)
    if (
      newClientData.code &&
      client.code &&
      newClientData.code.trim().toLowerCase() === client.code.trim().toLowerCase()
    ) {
      return {
        isDuplicate: true,
        errorMessage: `كود العميل (${newClientData.code.trim()}) مسجل بالفعل لعميل آخر.`,
      };
    }

    // 2. التحقق من تطابق رقم الاتصال
    const newPhone = (newClientData.phone || newClientData.clientNumber || '').trim();
    const existingPhone = (client.phone || client.clientNumber || '').trim();
    if (newPhone && existingPhone && newPhone === existingPhone) {
      return {
        isDuplicate: true,
        errorMessage: `رقم الاتصال (${newPhone}) مسجل بالفعل لعميل آخر.`,
      };
    }

    // 3. التحقق من تطابق اسم الجروب
    if (
      newClientData.groupName &&
      client.groupName &&
      newClientData.groupName.trim().toLowerCase() === client.groupName.trim().toLowerCase()
    ) {
      return {
        isDuplicate: true,
        errorMessage: `اسم الجروب (${newClientData.groupName.trim()}) مستخدم بالفعل لعميل آخر.`,
      };
    }
  }

  // إذا لم يتم العثور على أي تطابق
  return { isDuplicate: false, errorMessage: null };
};
