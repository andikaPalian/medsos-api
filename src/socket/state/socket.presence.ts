// In-memory state
const onlineUsers = new Map<string, Set<string>>();

// Multi-device/multi-browser-support - return true if user was the first connection
export const markUserOnline = (userId: string, socketId: string): boolean => {
  const wasOffline = !onlineUsers.has(userId);
  if (wasOffline) onlineUsers.set(userId, new Set());

  onlineUsers.get(userId)!.add(socketId);
  return wasOffline;
};

// Multi-device/multi-browser-support - return true if user was the last connection (offline)
export const markUserOffline = (userId: string, socketId: string): boolean => {
  const socket = onlineUsers.get(userId);
  if (!socket) return false;

  socket.delete(socketId);
  const isNowOffline = socket.size === 0;
  if (isNowOffline) onlineUsers.delete(userId);

  return isNowOffline;
};

export const isUserOnline = (userId: string): boolean => onlineUsers.has(userId);
