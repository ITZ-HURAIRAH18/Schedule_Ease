/**
 * Meeting Socket Handler
 * Manages WebRTC signaling and room coordination for video meetings
 */
export const initMeetingSocket = (io) => {
  const meetingNamespace = io.of("/meeting");

  console.log("📍 Meeting namespace (/meeting) initialized");

  meetingNamespace.on("connection", (socket) => {
    console.log(`👤 New participant connected to meeting namespace: ${socket.id}`);

    // Join a specific meeting room
    socket.on("join_meeting_room", (roomId) => {
      const room = meetingNamespace.adapter.rooms.get(roomId);
      const numClients = room ? room.size : 0;

      console.log(`🏠 Room ${roomId} has ${numClients} participants`);

      if (numClients === 0) {
        socket.join(roomId);
        // First person joins as initiator
        socket.emit("meeting_role", { initiator: true });
        console.log(`⭐ User ${socket.id} joined room ${roomId} as initiator`);
      } else if (numClients === 1) {
        socket.join(roomId);
        // Second person joins as non-initiator
        socket.emit("meeting_role", { initiator: false });
        console.log(`👥 User ${socket.id} joined room ${roomId} as participant`);
      } else {
        // Only 2 people allowed for peer-to-peer simplicity
        socket.emit("room_full");
        console.warn(`🛑 Room ${roomId} is full, user ${socket.id} rejected`);
      }
    });

    // Relay WebRTC signals between participants
    socket.on("signal", (data) => {
      const { roomId, signal } = data;
      // Broadcast signal to everyone else in the room
      socket.to(roomId).emit("signal", {
        signal,
        sender: socket.id
      });
    });

    // Handle participant leaving or losing connection
    socket.on("disconnecting", () => {
      for (const room of socket.rooms) {
        if (room !== socket.id) {
          socket.to(room).emit("participant_left", socket.id);
          console.log(`👋 User ${socket.id} leaving room ${room}`);
        }
      }
    });

    socket.on("disconnect", () => {
      console.log(`👤 Participant disconnected: ${socket.id}`);
    });
  });
};
