import { 
  PHASES, 
  ROLES, 
  ROLE_COUNTS, 
  CARD_TYPES, 
  FACTIONS, 
  FASCIST_TO_WIN, 
  LIBERAL_TO_WIN, 
  MAX_ELECTION_TRACKER 
} from '@secret-hitler/shared';

// Utility for shuffling arrays
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export class GameEngine {
  constructor(roomId) {
    this.roomId = roomId;
    this.players = []; // Array of { id, name, role, faction, isHost, isAlive, isReady }
    this.phase = PHASES.LOBBY;
    
    // Board State
    this.liberalPolicies = 0;
    this.fascistPolicies = 0;
    this.electionTracker = 0;
    
    // Players (Indices based on this.players array)
    this.presidentIndex = 0; // The continuous Sun-Caller sequence
    this.currentPresident = null; // ID of current acting Sun-Caller
    this.currentChancellor = null; // ID of accepted Moon-Weaver
    this.nominatedChancellor = null; // ID of nominated Moon-Weaver
    
    // Previous government (cannot be nominated again immediately in >5p games)
    this.previousPresident = null;
    this.previousChancellor = null;

    // Deck
    this.drawPile = [];
    this.discardPile = [];
    
    // Legislative Session Cards
    this.drawnCards = [];
    
    // Votes
    this.votes = {}; // playerId -> true/false
    
    // Win State
    this.winner = null; // FACTIONS.LIBERAL or FACTIONS.FASCIST
    this.winReason = null;
    
    // Logs
    this.logs = [];
  }

  addPlayer(id, name, isHost = false) {
    if (this.players.find(p => p.id === id)) return false;
    this.players.push({
      id,
      name,
      role: null,
      faction: null,
      isHost,
      isAlive: true,
      isReady: false
    });
    return true;
  }

  removePlayer(id) {
    this.players = this.players.filter(p => p.id !== id);
    // If host leaves, assign host to someone else
    if (this.players.length > 0 && !this.players.some(p => p.isHost)) {
      this.players[0].isHost = true;
    }
  }

  setPlayerReady(id, ready) {
    const p = this.players.find(p => p.id === id);
    if (p) p.isReady = ready;
  }

  allPlayersReady() {
    return this.players.every(p => p.isReady);
  }

  startGame() {
    const count = this.players.length;
    if (count < 5 || count > 10) return false;

    // 1. Assign Roles
    const counts = ROLE_COUNTS[count];
    let roles = [
      ...Array(counts[ROLES.LIBERAL]).fill({ role: ROLES.LIBERAL, faction: FACTIONS.LIBERAL }),
      ...Array(counts[ROLES.FASCIST]).fill({ role: ROLES.FASCIST, faction: FACTIONS.FASCIST }),
      { role: ROLES.HITLER, faction: FACTIONS.FASCIST }
    ];
    roles = shuffle(roles);
    
    // Shuffle players around table before assigning
    this.players = shuffle(this.players);
    this.players.forEach((p, i) => {
      p.role = roles[i].role;
      p.faction = roles[i].faction;
      p.isAlive = true;
      p.isReady = false;
    });

    // 2. Initialize Deck
    // 6 Liberal, 11 Fascist
    this.drawPile = shuffle([
      ...Array(6).fill(CARD_TYPES.LIBERAL),
      ...Array(11).fill(CARD_TYPES.FASCIST)
    ]);
    this.discardPile = [];
    
    this.radianceEdicts = 0;
    this.eclipseEdicts = 0;
    this.electionTracker = 0;
    this.winner = null;
    this.winReason = null;
    
    this.phase = PHASES.ROLE_REVEAL;
    this.logSystem('The game has begun.');
    return true;
  }

  startNomination() {
    this.phase = PHASES.NOMINATION;
    this.nominatedChancellor = null;
    this.votes = {};
    
    // Find next living president
    if (this.currentPresident == null) {
      this.presidentIndex = Math.floor(Math.random() * this.players.length);
    } else {
      this.presidentIndex = (this.presidentIndex + 1) % this.players.length;
      while (!this.players[this.presidentIndex].isAlive) {
        this.presidentIndex = (this.presidentIndex + 1) % this.players.length;
      }
    }
    
    this.currentPresident = this.players[this.presidentIndex].id;
    this.logSystem(`${this.getPlayerName(this.currentPresident)} is the new Presidential candidate.`);
  }

  nominateChancellor(chancellorId) {
    if (this.phase !== PHASES.NOMINATION) return false;
    this.nominatedChancellor = chancellorId;
    this.phase = PHASES.VOTING;
    this.logSystem(`${this.getPlayerName(this.currentPresident)} nominated ${this.getPlayerName(chancellorId)} as Chancellor.`);
    return true;
  }

  submitVote(playerId, approve) {
    if (this.phase !== PHASES.VOTING) return false;
    const player = this.players.find(p => p.id === playerId);
    if (!player || !player.isAlive) return false;
    
    this.votes[playerId] = approve;
    
    const livingCount = this.players.filter(p => p.isAlive).length;
    if (Object.keys(this.votes).length === livingCount) {
      this.tallyVotes();
    }
    return true;
  }

  tallyVotes() {
    let yes = 0;
    let no = 0;
    for (let id in this.votes) {
      if (this.votes[id]) yes++; else no++;
    }
    
    if (yes > no) { // Majority required
      // ELECTION PASSES
      this.currentChancellor = this.nominatedChancellor;
      this.electionTracker = 0;
      this.logSystem(`Election passed. ${this.getPlayerName(this.currentChancellor)} is Chancellor.`);
      
      // Check Hitler win condition (If 3+ fascist policies, and hitler is chancellor -> Fascists win)
      const isChancellorHitler = this.players.find(p => p.id === this.currentChancellor).role === ROLES.HITLER;
      if (this.fascistPolicies >= 3 && isChancellorHitler) {
        return this.triggerWin(FACTIONS.FASCIST, 'Hitler was elected Chancellor after 3 Fascist policies.');
      }
      
      this.startLegislativeSession();
    } else {
      // ELECTION FAILS
      this.logSystem(`Election failed.`);
      this.electionTracker++;
      if (this.electionTracker >= MAX_ELECTION_TRACKER) {
        this.enactTopCardChaos();
      } else {
        this.startNomination();
      }
    }
  }

  startLegislativeSession() {
    this.phase = PHASES.LEGISLATIVE_PRESIDENT;
    if (this.drawPile.length < 3) this.reshuffleDeck();
    this.drawnCards = [this.drawPile.pop(), this.drawPile.pop(), this.drawPile.pop()];
  }

  presidentDiscard(cardIndex) {
    if (this.phase !== PHASES.LEGISLATIVE_PRESIDENT) return false;
    const discarded = this.drawnCards.splice(cardIndex, 1)[0];
    this.discardPile.push(discarded);
    this.phase = PHASES.LEGISLATIVE_CHANCELLOR;
    return true;
  }

  chancellorEnact(cardIndex) {
    if (this.phase !== PHASES.LEGISLATIVE_CHANCELLOR) return false;
    const enacted = this.drawnCards.splice(cardIndex, 1)[0];
    const discarded = this.drawnCards[0];
    this.discardPile.push(discarded);
    this.drawnCards = [];
    
    this.logSystem(`${this.getPlayerName(this.currentChancellor)} enacted a ${enacted === CARD_TYPES.FASCIST ? 'Fascist' : 'Liberal'} policy.`);
    this.enactPolicy(enacted);
  }

  enactTopCardChaos() {
    this.electionTracker = 0;
    this.currentPresident = null;
    this.currentChancellor = null;
    this.previousPresident = null; // Chaos resets term limits
    this.previousChancellor = null;
    
    if (this.drawPile.length < 1) this.reshuffleDeck();
    const enacted = this.drawPile.pop();
    this.logSystem(`Chaos reigns. A ${enacted === CARD_TYPES.FASCIST ? 'Fascist' : 'Liberal'} policy was enacted automatically.`);
    
    this.enactPolicy(enacted, true);
  }

  enactPolicy(cardType, isChaos = false) {
    if (cardType === CARD_TYPES.LIBERAL) {
      this.liberalPolicies++;
      if (this.liberalPolicies >= LIBERAL_TO_WIN) {
        return this.triggerWin(FACTIONS.LIBERAL, 'Liberals passed 5 Liberal policies.');
      }
    } else {
      this.fascistPolicies++;
      if (this.fascistPolicies >= FASCIST_TO_WIN) {
        return this.triggerWin(FACTIONS.FASCIST, 'Fascists passed 6 Fascist policies.');
      }
      // Check executive powers here
      // Simplified: Just go back to nomination for now
    }
    
    if (!isChaos) {
      this.previousPresident = this.currentPresident;
      this.previousChancellor = this.currentChancellor;
    }
    
    this.startNomination();
  }

  triggerWin(faction, reason) {
    this.winner = faction;
    this.winReason = reason;
    this.phase = PHASES.GAME_OVER;
  }

  reshuffleDeck() {
    this.drawPile = shuffle([...this.drawPile, ...this.discardPile]);
    this.discardPile = [];
  }

  getPlayerName(id) {
    return this.players.find(p => p.id === id)?.name || 'Unknown';
  }

  logSystem(msg) {
    this.logs.push(`[System] ${msg}`);
  }

  // Get sanitized state for a specific player (hide private info)
  getSanitizedState(targetPlayerId) {
    const targetPlayer = this.players.find(p => p.id === targetPlayerId);
    
    // Determine what roles targetPlayer can see
    const isFascist = targetPlayer?.role === ROLES.FASCIST;
    const isHitler = targetPlayer?.role === ROLES.HITLER;
    const playerCount = this.players.length;
    // Hitler only knows their Fascists if 5-6 players total. 7+ they don't know anyone.
    const hitlerKnowsFascists = playerCount <= 6; 

    return {
      roomId: this.roomId,
      phase: this.phase,
      winner: this.winner,
      winReason: this.winReason,
      liberalPolicies: this.liberalPolicies,
      fascistPolicies: this.fascistPolicies,
      electionTracker: this.electionTracker,
      currentPresident: this.currentPresident,
      currentChancellor: this.currentChancellor,
      nominatedChancellor: this.nominatedChancellor,
      drawPileCount: this.drawPile.length,
      discardPileCount: this.discardPile.length,
      
      // Legislative Cards - Only visible to President or Chancellor when acting
      drawnCards: (this.phase === PHASES.LEGISLATIVE_PRESIDENT && this.currentPresident === targetPlayerId) ||
                  (this.phase === PHASES.LEGISLATIVE_CHANCELLOR && this.currentChancellor === targetPlayerId)
                  ? this.drawnCards : [],
                  
      // Player list sanitized
      players: this.players.map(p => {
        let visibleRole = null;
        let visibleFaction = null;

        if (this.phase === PHASES.GAME_OVER) {
          visibleRole = p.role;
          visibleFaction = p.faction;
        } else if (p.id === targetPlayerId) {
          visibleRole = p.role;
          visibleFaction = p.faction;
        } else if (isFascist) {
           visibleRole = p.role;
           visibleFaction = p.faction;
        } else if (isHitler && hitlerKnowsFascists && p.role === ROLES.FASCIST) {
           visibleRole = p.role;
           visibleFaction = p.faction;
        }

        return {
          id: p.id,
          name: p.name,
          isHost: p.isHost,
          isAlive: p.isAlive,
          isReady: p.isReady,
          hasVoted: this.votes[p.id] !== undefined,
          role: visibleRole,
          faction: visibleFaction,
        };
      })
    };
  }
}
