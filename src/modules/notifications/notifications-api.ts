import { apiRequest, extractArray } from '../../shared/api-client';

export interface NotificationRecord {
  id: string;
  title: string;
  message: string;
  sourceModule: string;
  createdAt: string;
  orderId?: string;
}

function normalizeNotification(raw: any): NotificationRecord {
  return {
    id: raw?.id || String(Math.random()),
    title: raw?.title || 'Aviso del sistema',
    message: raw?.message || raw?.description || '',
    sourceModule: raw?.sourceModule || raw?.module || 'SISTEMA',
    createdAt: raw?.createdAt || new Date().toISOString(),
    orderId: raw?.orderId,
  };
}

export async function fetchMyNotifications(): Promise<NotificationRecord[]> {
  const payload = await apiRequest<any>('/notifications');
  const list = extractArray<any>(payload);
  return list.map(normalizeNotification);
}
