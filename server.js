import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import next from 'next';
import { GameEngine } from './server/gameEngine.js';
import { PHASES } from './server/constants.js';

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

nextApp.prepare().then(() => {
  const app = express();
  app.use(cors());

  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*", 
      methods: ["GET", "POST"]
    }
  });

// Map of roomId -> GameEngine instance
const activeGames = new Map();

// Map of socket.id -> { roomId, playerId } for easy lookup on disconnect
const socketToPlayerMap = new Map();

function broadcastGameState(roomId) {
  const game = activeGames.get(roomId);
  if (!game) return;

  // Emit personalized state to each player
  game.players.forEach(player => {
    io.to(player.id).emit('game_state_update', game.getSanitizedState(player.id));
  });
}

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('join_room', ({ roomId, playerName }, callback) => {
    // Basic validation
    if (!roomId || !playerName) {
      return callback({ success: false, error: 'Invalid room or name' });
    }
    
    roomId = roomId.toUpperCase();

    // Create room if it doesn't exist
    if (!activeGames.has(roomId)) {
      activeGames.set(roomId, new GameEngine(roomId));
    }
    
    const game = activeGames.get(roomId);
    
    // Check if game is already in progress and player is not reconnecting
    if (game.phase !== PHASES.LOBBY && !game.players.some(p => p.name === playerName)) {
       return callback({ success: false, error: 'Game already in progress' });
    }
    
    // Check max players
    if (game.phase === PHASES.LOBBY && game.players.length >= 10) {
      return callback({ success: false, error: 'Room is full' });
    }

    const isHost = game.players.length === 0;
    
    // Check if reconnecting
    const existingPlayer = game.players.find(p => p.name === playerName);
    if (existingPlayer) {
      // Reconnect logic
      socketToPlayerMap.delete(existingPlayer.id); // Remove old socket mapping
      existingPlayer.id = socket.id;               // Update to new socket id
    } else {
      game.addPlayer(socket.id, playerName, isHost);
    }
    
    socket.join(roomId);
    socketToPlayerMap.set(socket.id, { roomId, playerId: socket.id });
    
    broadcastGameState(roomId);
    callback({ success: true, playerId: socket.id });
  });

  socket.on('start_game', () => {
    const info = socketToPlayerMap.get(socket.id);
    if (!info) return;
    
    const game = activeGames.get(info.roomId);
    if (!game) return;
    
    const player = game.players.find(p => p.id === socket.id);
    if (!player || !player.isHost) return;
    
    if (game.startGame()) {
      broadcastGameState(info.roomId);
    }
  });
  
  // Players pressing "Hold to Reveal", when all ready, move to next phase
  socket.on('player_ready', () => {
    const info = socketToPlayerMap.get(socket.id);
    if (!info) return;
    
    const game = activeGames.get(info.roomId);
    if (!game || game.phase !== PHASES.ROLE_REVEAL) return;
    
    game.setPlayerReady(socket.id, true);
    broadcastGameState(info.roomId);
    
    if (game.allPlayersReady()) {
      game.startNomination();
      broadcastGameState(info.roomId);
    }
  });
  
  socket.on('nominate_chancellor', (chancellorId) => {
    const info = socketToPlayerMap.get(socket.id);
    if (!info) return;
    
    const game = activeGames.get(info.roomId);
    if (!game || game.currentPresident !== socket.id) return;
    
    if (game.nominateChancellor(chancellorId)) {
      broadcastGameState(info.roomId);
    }
  });
  
  socket.on('submit_vote', (approve) => {
    const info = socketToPlayerMap.get(socket.id);
    if (!info) return;
    
    const game = activeGames.get(info.roomId);
    if (!game) return;
    
    if (game.submitVote(socket.id, approve)) {
      broadcastGameState(info.roomId);
    }
  });
  
  socket.on('president_discard', (cardIndex) => {
    const info = socketToPlayerMap.get(socket.id);
    if (!info) return;
    
    const game = activeGames.get(info.roomId);
    if (!game || game.currentPresident !== socket.id) return;
    
    if (game.presidentDiscard(cardIndex)) {
      broadcastGameState(info.roomId);
    }
  });
  
  socket.on('chancellor_enact', (cardIndex) => {
    const info = socketToPlayerMap.get(socket.id);
    if (!info) return;
    
    const game = activeGames.get(info.roomId);
    if (!game || game.currentChancellor !== socket.id) return;
    
    game.chancellorEnact(cardIndex);
    broadcastGameState(info.roomId);
  });

  socket.on('disconnect', () => {
     console.log(`Socket disconnected: ${socket.id}`);
     // If in lobby, remove player. Otherwise keep them for reconnection.
     const info = socketToPlayerMap.get(socket.id);
     if (info) {
       const game = activeGames.get(info.roomId);
       if (game && game.phase === PHASES.LOBBY) {
         game.removePlayer(socket.id);
         broadcastGameState(info.roomId);
       }
       socketToPlayerMap.delete(socket.id);
       
       if (game && game.players.length === 0) {
         activeGames.delete(info.roomId); // Cleanup empty rooms
       }
     }
  });
});

  // Next.js catch-all route handler
  app.all('*', (req, res) => {
    return handle(req, res);
  });

  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, () => {
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});
