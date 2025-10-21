import { Server } from 'socket.io';

interface ApiStatusEvent {
  endpointId: string;
  endpointName: string;
  oldStatus: 'healthy' | 'warning' | 'error';
  newStatus: 'healthy' | 'warning' | 'error';
  timestamp: string;
  responseTime: number;
  message: string;
}

export const setupSocket = (io: Server) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Handle API status change notifications
    socket.on('api-status-change', (event: ApiStatusEvent) => {
      // Broadcast to all clients
      io.emit('api-status-changed', {
        ...event,
        timestamp: new Date().toISOString(),
      });
    });

    // Handle manual health check requests
    socket.on('check-endpoint', async (endpointId: string) => {
      try {
        const response = await fetch(`http://localhost:3000/api/endpoints`);
        const endpoints = await response.json();
        const endpoint = endpoints.find((e: any) => e.id === endpointId);
        
        if (endpoint) {
          socket.emit('endpoint-check-result', {
            endpointId,
            status: endpoint.status,
            responseTime: endpoint.responseTime,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (error) {
        socket.emit('endpoint-check-result', {
          endpointId,
          status: 'error',
          responseTime: 0,
          error: 'Failed to check endpoint',
          timestamp: new Date().toISOString(),
        });
      }
    });
    
    // Handle messages
    socket.on('message', (msg: { text: string; senderId: string }) => {
      // Echo: broadcast message only the client who send the message
      socket.emit('message', {
        text: `Echo: ${msg.text}`,
        senderId: 'system',
        timestamp: new Date().toISOString(),
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });

    // Send welcome message
    socket.emit('message', {
      text: 'Welcome to API Monitoring WebSocket Server!',
      senderId: 'system',
      timestamp: new Date().toISOString(),
    });
  });
};