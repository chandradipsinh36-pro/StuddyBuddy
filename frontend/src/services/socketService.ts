import { io, Socket } from 'socket.io-client';
import type { GroupMessage } from '../types';
import { normalizeMessage } from '../types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  private socket: Socket | null = null;
  private currentGroupId: number | null = null;

  connect(): Socket {
    const token = localStorage.getItem('sb_token');
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: true,
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      if (this.currentGroupId) {
        this.socket?.emit('group:join', this.currentGroupId);
      }
    });

    this.socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      if (this.currentGroupId) {
        this.socket.emit('group:leave', this.currentGroupId);
        this.currentGroupId = null;
      }
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinGroup(groupId: number) {
    this.currentGroupId = groupId;
    if (!this.socket || !this.socket.connected) {
      this.connect();
    }
    this.socket?.emit('group:join', groupId);
  }

  leaveGroup(groupId: number) {
    if (this.currentGroupId === groupId) {
      this.currentGroupId = null;
    }
    this.socket?.emit('group:leave', groupId);
  }

  sendMessage(groupId: number, content: string) {
    if (!this.socket || !this.socket.connected) this.connect();
    this.socket?.emit('message:send', { groupId, content });
  }

  deleteMessage(groupId: number, messageId: number) {
    this.socket?.emit('message:delete', { groupId, messageId });
  }

  sendTypingStart(groupId: number) {
    this.socket?.emit('typing:start', groupId);
  }

  sendTypingStop(groupId: number) {
    this.socket?.emit('typing:stop', groupId);
  }

  onNewMessage(handler: (message: GroupMessage) => void): () => void {
    const s = this.socket || this.connect();
    const wrapped = (raw: any) => handler(normalizeMessage(raw));
    s.on('message:new', wrapped);
    return () => s.off('message:new', wrapped);
  }

  onMessageDeleted(handler: (data: { groupId: number; messageId: number }) => void): () => void {
    const s = this.socket || this.connect();
    s.on('message:deleted', handler);
    return () => s.off('message:deleted', handler);
  }

  onOnlineMembers(handler: (data: { groupId: number; count: number }) => void): () => void {
    const s = this.socket || this.connect();
    s.on('group:online-members', handler);
    return () => s.off('group:online-members', handler);
  }

  onTypingStart(handler: (data: { groupId: number; userId: number; userName?: string }) => void): () => void {
    const s = this.socket || this.connect();
    s.on('typing:start', handler);
    return () => s.off('typing:start', handler);
  }

  onTypingStop(handler: (data: { groupId: number; userId: number }) => void): () => void {
    const s = this.socket || this.connect();
    s.on('typing:stop', handler);
    return () => s.off('typing:stop', handler);
  }

  onError(handler: (err: { message: string }) => void): () => void {
    const s = this.socket || this.connect();
    s.on('error', handler);
    return () => s.off('error', handler);
  }
}

export const socketService = new SocketService();
