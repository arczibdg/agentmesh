export interface BusMessage {
  id: string;
  from: string;
  to: string | '*';
  type: 'request' | 'response' | 'broadcast';
  event?: string;
  payload: unknown;
  timestamp: number;
}
