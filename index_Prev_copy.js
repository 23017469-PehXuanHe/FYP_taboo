const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
 
const app = express();
const server = http.createServer(app);
const io = socketIO(server);
 
//const hostname = '10.175.4.149';
const port = process.env.PORT || 3000;
 
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/guess.html");
});
 
// Cards
const cards = [
  { keyword: "Sun", forbidden: ["Hot", "Bright", "Sky", "Day", "Star"] },
  { keyword: "Computer", forbidden: ["Keyboard", "Screen", "Mouse", "Laptop", "Tech"] },
  { keyword: "Pizza", forbidden: ["Cheese", "Crust", "Topping", "Slice", "Oven"] },
  { keyword: "Airplane", forbidden: ["Fly", "Pilot", "Wings", "Airport", "Sky"] },
];
 
// Team and role
let Team_A = [];
let Team_B = [];
let Card_Holder = [];
let guesser = [];
 
let timer = null
 
//let currentTime = 5;
 
function Card_RNG() {
  const rng=Math.floor(Math.random() * cards.length)
  const card = cards[rng]
  console.log("From Card_RNG :", card)
  Current_Card = card
  return Current_Card;
}
 
 
 
 
 
 
io.on("connection", (socket) => {
  Current_Card = null;
  console.log("New user connected:", socket.id);
 
  function stoptimer() {
      io.emit("Round_End");
      clearInterval(timer);
      console.log("Round Ended")
 
  }
 
  // team assignment based on number of players
  let assignedTeam;
 
  if (Team_A.length <= Team_B.length) {
    Team_A.push(socket.id);
    socket.join("Team_A");
    const assignedTeam = "Team_A";
    socket.emit("Team", (assignedTeam))
    const A1 = Team_A[0];
    if (Card_Holder.includes(A1) === false) {
      Card_Holder.push(A1)
      role = "card_holder"
      socket.emit("role_assigned" , role);
      console.log(Card_Holder)
    }else {
      guesser.push(socket.id);
      role = "guesser"  
      socket.emit("role_assigned" , role);
      console.log(guesser)
    }
  } else {
    Team_B.push(socket.id);
    socket.join("Team_B");
    const assignedTeam = "Team_B";
    socket.emit("Team", (assignedTeam))
    const B1 = Team_B[0];
    if (Card_Holder.includes(B1) === false) {
      Card_Holder.push(B1)
      role = "card_holder"
      socket.emit("role_assigned" , role);
      console.log(Card_Holder)
    } else {
      guesser.push(socket.id);
      role = "guesser"  
      socket.emit("role_assigned" , role);
      console.log(guesser)
    }
  }
 
  console.log(`${socket.id} has joined ${assignedTeam}`);
 
  // assigning roles based on first player of each team ## change this to be random after round feature is implemented
  //if (Team_A.length > 0) {
   
   
  //}
 
  //if (Team_B.length > 0) {
   
  //}
 
  // makes everyone else into guessers
  //if (Card_Holder.includes(socket.id) === false) {
    //guesser.push(socket.id);
    //role = "guesser"  
    //socket.emit("role_assigned" , role);
    //console.log(guesser)
  //}
 
 
  const Team_Player_Count = {
    Team_A_Count: Team_A.length,
    Team_B_Count: Team_B.length,
    Card_Holder_Count: Card_Holder.length,
    guesser_count: guesser.length
  };
 
  socket.on("draw_card" , () =>{
    Card_RNG()
    //console.log("Card_RNG:   ",Card_RNG())
    console.log("Constant_Card:   ", Current_Card)
    io.to("Team_A").to("Team_B").emit("card_drawn",Current_Card);
   
    currentTime = 60
    timer = setInterval(() =>{
      currentTime--;
      io.emit("Timer", currentTime);
      if(currentTime <=0) {
        clearInterval(timer);
        socket.emit("Round_End");
        console.log("Round Ended")
      };
 
    },1000)
 
   
 
    console.log("Card Drawn")
  });
 
  // Handle chat messages
  socket.on("chat_message", (msg) => {
    console.log(`Message from ${socket.id}:`, msg);
    socket.broadcast.emit("chat_message", msg); // Send to all except sender
    //console.log("Current Card Keyword ==>", Current_Card.forbidden)
    //console.log("TEST CHAT MESSAGE")
    console.log(Current_Card.forbidden)
    const chat_msg = msg.toLowerCase().split(" ")
    console.log(chat_msg)
    chat_msg.forEach(function (element) {
      while (chat_msg.length > 0) {
        let i =chat_msg[0].toLowerCase()
        let firstLetter = i.charAt(0)
        let firstLetterCap = firstLetter.toUpperCase()
        let remainingLetters = i.slice(1)
        const capitalizedWord = firstLetterCap + remainingLetters
        i = chat_msg.shift();
        if (Current_Card.forbidden.includes(i)) { //make it so that it capitalizes the msg first
          socket.emit("Forbidden_Word_Used")
          stoptimer()
          //console.log("Forbidden word Detected")
        } else if (Current_Card.keyword.includes(capitalizedWord)) {
          socket.emit("Correct_Answer");
          stoptimer();
        }
 
       
      };
 
    });
    
    if (Current_Card.forbidden.includes(msg)) { //make it so that it capitalizes the msg first
      socket.emit("Forbidden_Word_Used")
      stoptimer()
      //console.log("Forbidden word Detected")
    }else{
      //console.log("No forbidden words used")
    }
  });
 
  //Does not work for now dont use this (Was supposed to be for mic implementation but it did not work will replace soon)
  socket.on('transcriber', () =>{
    socket.join("transcriber")
    console.log("Transcriber id:", socket.id)
  });
 
  socket.on("Mic_Pressed", () =>{
    io.to("transcriber").emit('mic_pressed')
  });
 
  socket.on("Transcribed_Text", (text) => {
    io.emit("Transcribed_message" , text)
  });
  //end of do not use stuff
 
  // Handle disconnections
  socket.on("disconnect", () => {
    console.log(`${socket.id} disconnected`);
 
    // Remove player from all arrays
    Team_A = Team_A.filter(id => id !== socket.id);
    Team_B = Team_B.filter(id => id !== socket.id);
    Card_Holder = Card_Holder.filter(id => id !== socket.id);
    guesser = guesser.filter(id => id !== socket.id);
 
    // Update player counts after disconnect
    const Team_Player_Count = {
      Team_A_Count: Team_A.length,
      Team_B_Count: Team_B.length,
      Card_Holder_Count: Card_Holder.length,
      guesser_count: guesser.length
    };
    io.emit("Capacity", Team_Player_Count);
  });
});
 
//const { spawn } = require("child_process");
 
// Launch the Python transcriber
//const transcriberProcess = spawn("python", ["Transcriber_To_Json.py"], {
  //cwd: __dirname, // or wherever the script is
//});
 
//transcriberProcess.stdout.on("data", (data) => {
  //console.log(`[Transcriber]: ${data}`);
//});
 
//transcriberProcess.stderr.on("data", (data) => {
  //console.error(`[Transcriber ERROR]: ${data}`);
//});
 
//transcriberProcess.on("exit", (code) => {
  //console.log(`Transcriber exited with code ${code}`);
//});
 
 
server.listen(port);
 
 
//server.listen(port, hostname, () => {
  //console.log(`Server is running at http://${hostname}:${port}/`);
//});
 
/////////////PROBLEMS BOARD//////////////
//**The current timer is wonky cause if you click draw card multiple times it will cause the timer to loop. Just make sure the button is unable to be presesd once a round has started**//
//**Seperate the Teams into 2 groups based on the stuff that was discussed**//