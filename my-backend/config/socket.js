/**
 * Socket.io singleton manager - breaks circular dependency
 * Controllers import from here instead of server.js
 */
let io = null;

/**
 * Initialize the socket.io instance (called from server.js)
 */
export const setIO = (socketInstance) => {
  io = socketInstance;
  console.log('✅ Socket.io instance initialized');
};

/**
 * Get the socket.io instance
 * @returns {Server|null}
 */
export const getIO = () => {
  return io;
};

/**
 * Check if socket.io is initialized
 * @returns {boolean}
 */
export const isIOInitialized = () => io !== null;

/**
 * Safely emit an event to all connected clients
 * @param {string} event - Event name
 * @param {any} data - Event data
 */
export const safeEmit = (event, data) => {
  if (io) {
    try {
      io.emit(event, data);
    } catch (error) {
      console.error(`❌ Socket emit error for event "${event}":`, error.message);
    }
  } else {
    console.warn(`⚠️ Socket.io not initialized, skipping emit for event: ${event}`);
  }
};

/**
 * Safely emit an event to a specific room
 * @param {string} room - Room ID
 * @param {string} event - Event name
 * @param {any} data - Event data
 */
export const safeToEmit = (room, event, data) => {
  if (io) {
    try {
      io.to(room).emit(event, data);
    } catch (error) {
      console.error(`❌ Socket emit error for room "${room}", event "${event}":`, error.message);
    }
  } else {
    console.warn(`⚠️ Socket.io not initialized, skipping emit to room: ${room}`);
  }
};
