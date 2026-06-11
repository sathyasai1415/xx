import { addDoc, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';

export async function logAudit(action: string, entity: string, oldValue: any, newValue: any, userId: string, userName: string, role: string) {
  try {
    await addDoc(collection(db, 'audit_logs'), {
      action,
      entity,
      oldValue,
      newValue,
      userId,
      userName,
      role,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}
