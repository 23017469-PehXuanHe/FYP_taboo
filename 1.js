const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const hostname = 'localhost';
const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/Client.html"); // Serve the HTML file
});
const wordBank = [
  { topic: "Pizza", taboo: ["Cheese", "Crust", "Slice", "Oven", "Topping"] },
  { topic: "Beach", taboo: ["Sand", "Water", "Waves", "Sun", "Swim"] },
  { topic: "Computer", taboo: ["Mouse", "Keyboard", "Screen", "Internet", "Software"] },
];

const gameState = {
  players: {}, // socket.id -> { name, team }
  teams: { A: [], B: [] },
  scores: { A: 0, B: 0 },
  currentTurn: { team: "A", clueGiver: null, wordSet: null }
};

function getRandomWordSet() {
  return wordBank[Math.floor(Math.random() * wordBank.length)];
}
io.on("connection", (socket) => {
  console.log("New User has connected" , socket.id);
  const team = gameState.teams.A.length <= gameState.teams.B.length ? "A" : "B";
  const playerName = `Player ${Object.keys(gameState.players).length + 1}`;
  gameState.players[socket.id] = { team, name: playerName };
  gameState.teams[team].push(socket.id);
  socket.emit("assigned_team", team);
  console.log(`Player ${socket.id} assigned to Team ${team}`);
  console.log("Team A:", gameState.teams.A);
  console.log("Team B:", gameState.teams.B);

  socket.on("chat_message", (message) => {
    const player = gameState.players[socket.id];
    const name = player?.name || `Player ${socket.id.slice(0, 4)}`;
    const team = player?.team || "A";
  
    const data = {
      name,
      message,
      team,
      senderId: socket.id
    };
    console.log(`[${team}] ${name}: ${message}`);
    io.emit("chat_message", data);
  });

  socket.on("Btn_Clicked" ,(pressed) =>{
    const svr_response = pressed
    console.log(svr_response);
    if (svr_response == true){
      socket.emit("Change_Color", svr_response);
      console.log("response sent")
    }

    else {
      console.log("AAAA")
    }
  });

  socket.on("start_game", () => {
    const team = gameState.currentTurn.team;
    const clueGiver = gameState.teams[team][0];
    const wordSet = getRandomWordSet();

    gameState.currentTurn.clueGiver = clueGiver;
    gameState.currentTurn.wordSet = wordSet;

    io.to(clueGiver).emit("your_turn", wordSet);
    io.emit("new_turn", { team, clueGiver });

    console.log(`Turn started for Team ${team}. Clue-giver: ${clueGiver}`);
  });
});






server.listen(port, hostname => {
  console.log(`Server is up on port ${port}`);
});

