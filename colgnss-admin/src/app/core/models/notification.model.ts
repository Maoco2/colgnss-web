export interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  icon?: string;
  link?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}
