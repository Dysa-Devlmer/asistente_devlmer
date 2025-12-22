/**
 * WebSocket Service
 * Manages real-time bidirectional communication with Socket.io
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import http from 'http';

export interface WebSocketEvent {
  event: string;
  data: any;
}

export class WebSocketService {
  private io: SocketIOServer;
  private connectedClients: Map<string, Socket>;

  constructor(httpServer: http.Server) {
    this.connectedClients = new Map();

    // Initialize Socket.io server
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupHandlers();
    console.log('[WebSocketService] WebSocket server initialized');
  }

  /**
   * Setup Socket.io event handlers
   */
  private setupHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`[WebSocketService] Client connected: ${socket.id}`);
      this.connectedClients.set(socket.id, socket);

      // Handle kitchen subscription
      socket.on('kitchen:subscribe', (data: { station?: number }) => {
        if (data.station) {
          socket.join(`kitchen:station:${data.station}`);
          console.log(`[WebSocketService] Client ${socket.id} subscribed to station ${data.station}`);
        } else {
          socket.join('kitchen:all');
          console.log(`[WebSocketService] Client ${socket.id} subscribed to all kitchen updates`);
        }
      });

      // Handle kitchen unsubscription
      socket.on('kitchen:unsubscribe', () => {
        socket.leave('kitchen:all');
        [1, 2, 3, 4].forEach((station) => {
          socket.leave(`kitchen:station:${station}`);
        });
        console.log(`[WebSocketService] Client ${socket.id} unsubscribed from kitchen updates`);
      });

      // Handle POS subscription
      socket.on('pos:subscribe', (data: { mesa?: string }) => {
        if (data.mesa) {
          socket.join(`pos:mesa:${data.mesa}`);
          console.log(`[WebSocketService] Client ${socket.id} subscribed to mesa ${data.mesa}`);
        } else {
          socket.join('pos:all');
          console.log(`[WebSocketService] Client ${socket.id} subscribed to all POS updates`);
        }
      });

      // Handle POS unsubscription
      socket.on('pos:unsubscribe', () => {
        socket.leave('pos:all');
        // Leave all mesa-specific rooms
        socket.rooms.forEach((room) => {
          if (room.startsWith('pos:mesa:')) {
            socket.leave(room);
          }
        });
        console.log(`[WebSocketService] Client ${socket.id} unsubscribed from POS updates`);
      });

      // Handle ping/pong for connection keep-alive
      socket.on('ping', () => {
        socket.emit('pong');
      });

      // Handle disconnect
      socket.on('disconnect', (reason) => {
        console.log(`[WebSocketService] Client disconnected: ${socket.id}, reason: ${reason}`);
        this.connectedClients.delete(socket.id);
      });
    });
  }

  /**
   * Emit event to kitchen subscribers
   * @param event - Event name
   * @param data - Event data
   * @param station - Optional: target specific station
   */
  emitKitchenEvent(event: string, data: any, station?: number): void {
    const room = station ? `kitchen:station:${station}` : 'kitchen:all';
    this.io.to(room).emit(event, data);
    console.log(`[WebSocketService] Emitted ${event} to ${room}:`, data);
  }

  /**
   * Emit event to POS subscribers
   * @param event - Event name
   * @param data - Event data
   * @param mesa - Optional: target specific mesa
   */
  emitPOSEvent(event: string, data: any, mesa?: string): void {
    const room = mesa ? `pos:mesa:${mesa}` : 'pos:all';
    this.io.to(room).emit(event, data);
    console.log(`[WebSocketService] Emitted ${event} to ${room}:`, data);
  }

  /**
   * Emit event to all connected clients
   * @param event - Event name
   * @param data - Event data
   */
  emitToAll(event: string, data: any): void {
    this.io.emit(event, data);
    console.log(`[WebSocketService] Emitted ${event} to all clients:`, data);
  }

  /**
   * Get number of connected clients
   * @returns Number of connected clients
   */
  getConnectedCount(): number {
    return this.connectedClients.size;
  }

  /**
   * Get number of clients in a specific room
   * @param room - Room name
   * @returns Number of clients in room
   */
  async getRoomSize(room: string): Promise<number> {
    const sockets = await this.io.in(room).fetchSockets();
    return sockets.length;
  }

  /**
   * Get Socket.io server instance
   * @returns Socket.io server
   */
  getIO(): SocketIOServer {
    return this.io;
  }

  /**
   * Close WebSocket server
   */
  close(): void {
    this.io.close();
    console.log('[WebSocketService] WebSocket server closed');
  }
}
