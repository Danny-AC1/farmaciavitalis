export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'ORDER_UPDATE' | 'PROMOTION' | 'STOCK_ALERT' | 'SYSTEM' | 'CHAT' | 'NEW_PRODUCT' | 'PRODUCT';
  read: boolean;
  createdAt: string;
  link?: string;
  count?: number;
  idsToMarkRead?: string[];
}
