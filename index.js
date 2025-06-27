const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

//const hostname = '10.175.4.149'; 
//const hostname = '192.168.1.1'; 
const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/Taboo.html");
});

app.get("/taboo2", (req, res) => {
  res.sendFile(__dirname + "/taboo2.html");
});

app.get("/taboo3", (req, res) => {
  res.sendFile(__dirname + "/taboo3.html");
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



let Team_Name = []

var Team_Scores = {
  Team_A_Points: 0,
  Team_B_Points: 0
};

let timer = null
let Current_Card = null;

let currentRound = 1;
let maxRounds = 5;
let currentTeamTurn = "Team_A"



//let currentTime = 5;

function Card_RNG() {
  const rng=Math.floor(Math.random() * cards.length)
  const card = cards[rng]
  console.log("From Card_RNG :", card)
  Current_Card = card
  return Current_Card;
}

//function endRound() {
  //Current_Card = null;
  //currentRound++;

    //if (currentRound > maxRounds) {
      //io.emit("Game_Over");
      //console.log("Game has ended.");
      //return;
    //}

    //currentTeamTurn = currentTeamTurn === "Team_A" ? "Team_B" : "Team_A";
    //io.emit("Next_Round", {
      //round: currentRound,
      //team: currentTeamTurn
    //});
//}





io.on("connection", (socket) => {
  
  let assignedTeam;
 
  console.log("New user connected:", socket.id);

  function stoptimer() {
      io.emit("Round_End");
      clearInterval(timer);
      console.log("Round Ended")
  };

  function assignTeam() {
      redisplayscore(Team_Scores)
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
      } else {
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
  };

  function redisplayscore(Team_Scores){ //this code is mainly here so that if a new player joins while in the middle of round or something they still get scores
    var scores = Team_Scores
    console.log("This is the current score after the test",scores,"Triggerd by:",socket.id)
    io.to(socket.id).emit("Update_Points",scores)
  }  

  function IsThereATeamName(Team_Name) {
    let Team_Name_length = Team_Name.length
    console.log("Team Names are:", Team_Name)
    if (Team_Name_length >0) {
      io.emit("DONTDISPLAYTHENAMECHOOSING",Team_Name)
      isEven(currentRound)

    }
  }

  function isEven(currentRound){
    if (currentRound%2 == 1){
      io.emit("Team_A_Turn" , currentRound)
      console.log("Current Round: ",currentRound)
      //return currentRound;
    } else {
      io.emit("Team_B_Turn" , currentRound)
      console.log("Current Round: ",currentRound)
      //return currentRound;
    }
    
  };

  function Word_Checker(capitalizedWord) {
    if (guesser.includes(socket.id)){
        if (Current_Card.forbidden == capitalizedWord) { //make it so that it capitalizes the msg first
          console.log(capitalizedWord, "Is a forbidden word")
          socket.emit("Forbidden_Word_Used")
          stoptimer();
          currentRound++;
          isEven(currentRound)
          Current_Card = null
          
        }else if (Current_Card.keyword == capitalizedWord) {
          socket.emit("Correct_Answer");
          //const playerTeam = Team_A.includes(socket.id) ? "Team_A" : "Team_B";
          //scores[playerTeam] += 1;
          currentRound++;
          stoptimer()
          isEven(currentRound)
          Current_Card = null
          //socket.emit("Score_Update", scores)
        }
    } else if (Card_Holder.includes(socket.id)){
        if (Current_Card.forbidden == capitalizedWord) { //make it so that it capitalizes the msg first
          console.log(capitalizedWord, "Is a forbidden word")
          socket.emit("Forbidden_Word_Used")
          stoptimer();
          currentRound++;
          isEven(currentRound)
          Current_Card = null
        }else if (Current_Card.keyword == capitalizedWord) {
          socket.emit("Said_Key_Word");
          console.log(socket.id,"Said the key word. Word said was:",capitalizedWord)
          //const playerTeam = Team_A.includes(socket.id) ? "Team_A" : "Team_B";
          //scores[playerTeam] += 1;
          currentRound++;
          stoptimer()
          isEven(currentRound)
          Current_Card = null
          //socket.emit("Score_Update", scores)
        }

    }
    io.to("Team_A").to("Team_B").emit("card_drawn",Current_Card)
  }
  
  


  assignTeam(Team_Scores)
  //^^ team assignment based on number of players
  

  
  //checks to see if there is already a team name. if so, it'll make it so new players cant enter names
  IsThereATeamName(Team_Name)

  isEven(currentRound)

  console.log(`${socket.id} has joined ${assignedTeam}`);
  console.log("These sockets are in the Card_Holder Roll:",Card_Holder)
  console.log("These sockets are in the Card_Holder Roll:",guesser)
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

  socket.on("Team_Chosen_Name", Team_Chosen_Name =>{
    //Team_Name.push(Team_A)
    
    io.emit("Team_Names",(Team_Chosen_Name))
    Team_Name = Team_Chosen_Name
    console.log(Team_Name)
    isEven(currentRound)
  })

  //socket.on("NameDecided",namedecided => {
    
  //})
  //socket.on("Team_B_Name", (Team_B) =>{
    //Team_Name.push(Team_B)
    //socket.emit("Team_Names",(Team_Name))
  //})

  //if (Team_Name.length == 2) {
    //socket.emit("Team_Names",(Team_Name))
  //}


  
  

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
        currentRound++;
        isEven(currentRound)
        console.log("Round Ended")
      };

    },1000)

    

    console.log("Card Drawn")
  });

  io.to("Team_A").to("Team_B").emit("card_drawn",Current_Card)

  socket.on("transcribed_message", (text) => {
    const msg = text
    socket.broadcast.emit("chat_transcribed_message", msg); //sends to all other clients to be displayed 2
    console.log(msg)
    //replace these with a function later
    //socket.emit("chat_message", msg); // Send to all except sender
    //console.log("Current Card Keyword ==>", Current_Card.forbidden)
    //console.log("TEST CHAT MESSAGE")
    //console.log(Current_Card.forbidden)
    //**remember to insert a try statement */
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
        try{
          console.log("Capitalized Word for transcribe: ",capitalizedWord)
          Word_Checker(capitalizedWord)
        }catch{
          console.log("No Card Drawn Yet")
        }
        
      };

    });

  })


  // Handle chat messages
  socket.on("chat_message", (msg) => {
    console.log(`Message from ${socket.id}:`, msg);
    socket.broadcast.emit("chat_message", msg); // Send to all except sender
    //console.log("Current Card Keyword ==>", Current_Card.forbidden)
    //console.log("TEST CHAT MESSAGE")
    //console.log(Current_Card.forbidden)
    const chat_msg = msg.toLowerCase().split(" ")
    console.log(chat_msg)
    chat_msg.forEach(function (element) {
      while (chat_msg.length > 0) {
        let i =chat_msg[0].toLowerCase()
        let firstLetter = i.charAt(0)
        let firstLetterCap = firstLetter.toUpperCase()
        let remainingLetters = i.slice(1)
        const capitalizedWord = firstLetterCap + remainingLetters
        console.log(capitalizedWord)
        i = chat_msg.shift();
        try {
          Word_Checker(capitalizedWord)
        } catch  {
          console.log("No card drawn yet")
        }
      };

    });

    socket.on("Points_Updated",(scores) => {
      Team_Scores = Object.assign(scores)
      console.log("Curent Scores for this round",Team_Scores)
      console.log("Scores from the score variable", scores)
      io.emit("Update_Points",scores)
    })

    

    console.log("Curent Scores for this round",Team_Scores)
  });

  //Does not work for now dont use this (Was supposed to be for mic implementation but it did not work will replace soon)
  //depriciated code
  //socket.on('transcriber', () =>{
    //socket.join("transcriber")
    //console.log("Transcriber id:", socket.id)
  //});

  //socket.on("Mic_Pressed", () =>{
    //io.to("transcriber").emit('mic_pressed')
  //});

  //socket.on("Transcribed_Text", (text) => {
    //io.emit("Transcribed_message" , text)
  //});
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
  console.log("These socketids are in team A:",Team_A)
  console.log("These socketids are in team B:",Team_B)
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
//Fixed ^^^
//**Seperate the Teams into 2 groups based on the stuff that was discussed**//
//Done ^^^