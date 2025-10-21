// server.ts - Next.js Standalone + Socket.IO
import { setupSocket } from '@/lib/socket';
import { createServer } from 'http';
import { Server } from 'socket.io';
import next from 'next';
import os from 'os';

// Environment config
const dev = process.env.NODE_ENV !== 'production';
const currentPort = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const hostname = process.env.HOST || '0.0.0.0'; // listen on all interfaces

// Custom server with Socket.IO integration
async function createCustomServer() {
  try {
    // Create Next.js app
    const nextApp = next({
      dev,
      dir: process.cwd(),
      conf: dev ? undefined : { distDir: './.next' },
    });

    await nextApp.prepare();
    const handle = nextApp.getRequestHandler();

    // Create HTTP server
    const server = createServer((req, res) => {
      // Skip socket.io requests from Next.js handler
      if (req.url?.startsWith('/api/socketio')) return;
      handle(req, res);
    });

    // Setup Socket.IO
    const io = new Server(server, {
      path: '/api/socketio',
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    setupSocket(io);

    // Error handling
    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${currentPort} is already in use.`);
        process.exit(1);
      } else {
        console.error('❌ Server error:', err);
      }
    });

    process.on('uncaughtException', (err) => {
      console.error('❌ Uncaught Exception:', err);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('⚠️ Unhandled Rejection at:', promise, 'reason:', reason);
    });

    // Start server
    server.listen(currentPort, hostname, () => {
      // Detect LAN IP for better logging
      const interfaces = os.networkInterfaces();
      const lanIp =
        Object.values(interfaces)
          .flat()
          .find((iface: any) => iface.family === 'IPv4' && !iface.internal)
          ?.address || '127.0.0.1';

      console.log('');
      console.log('🚀 Server running successfully!');
      console.log('----------------------------------');
      console.log(`> Local:     http://127.0.0.1:${currentPort}`);
      console.log(`> LAN:       http://${lanIp}:${currentPort}`);
      console.log(`> Socket.IO: ws://${lanIp}:${currentPort}/api/socketio`);
      console.log(`> Environment: ${dev ? 'Development' : 'Production'}`);
      console.log('----------------------------------');
    });

    // Graceful shutdown
    const shutdown = (signal: string) => {
      console.log(`\n${signal} received, shutting down gracefully...`);
      server.close(() => {
        console.log('🛑 Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    console.error('❌ Server startup error:', err);
    process.exit(1);
  }
}

// Start server
createCustomServer();
