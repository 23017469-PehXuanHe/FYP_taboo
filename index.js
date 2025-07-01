const express = require('express');
const http = require('http');
const { type } = require('os');
const socketIO = require('socket.io');
const { json } = require('stream/consumers');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

//Uncomment the code below if you want to allow other devices to enter the site. Replace the ip address with your own devices name.
const hostname = '10.175.2.91'; 
// ^^^ above is my devices ip when connected to RP's wifi. replace the 10.175.4.149
//const hostname = '192.168.1.1'; 
// ^^^ above is my devices ip when connected to My own wifi. replace the 192.168.1.1
const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/Taboo.html");
});


  app.get("/taboo2", (req, res) => {
    res.sendFile(__dirname + "/taboo2.html");
  })

  app.get("/Unsupported_Browser",(req,res) => {
    res.sendFile(__dirname + "/Unsupported_Browser.html")
  })




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


//sets currentTime
//let currentTime = 5;

function Card_RNG() {
  const rng=Math.floor(Math.random() * cards.length)
  const card = cards[rng]
  console.log("From Card_RNG :", card)
  Current_Card = card
  return Current_Card;
}



//function called endRound was here. deleted since it was useless. if needed check previous versions

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
      Team_A=Team_A
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
      Team_B=Team_B
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
      //Used to return the current round. left in since could be useful
      //return currentRound;
    } else {
      io.emit("Team_B_Turn" , currentRound)
      console.log("Current Round: ",currentRound)
      //Used to return the current round. left in since could be useful
      //return currentRound;
    }
    
  };

  function Word_Checker(capitalizedWord) {
    const Keyword = Current_Card.keyword
    var forbidden_words = []
    var forbidden_words = Current_Card.forbidden.slice()
    Current_Card.forbidden.forEach((check) => {
      //var forbidden_words = Current_Card.forbidden
      //console.log("This is a loop message for the forbidden word")
      const current_card_fw_string =JSON.stringify(forbidden_words.shift())
      //console.log("The stringified fw",current_card_fw_string)
      if(current_card_fw_string === JSON.stringify(capitalizedWord)) {
        console.log(capitalizedWord, "Is a forbidden word");
          socket.emit("Forbidden_Word_Used");
          stoptimer();
          currentRound++;
          isEven(currentRound);
          Current_Card = null;
      }
    })

    //var forbidden_words = Current_Card.forbidden

    if (capitalizedWord === Keyword) {
      var card_holder_list =  Card_Holder.slice()
      const current_guesser_id_checked = JSON.stringify(guesser.shift())
      Card_Holder.some((check_id_role) => {
        const current_card_holder_id_checked = JSON.stringify(card_holder_list.shift())
        console.log("Test if this statement is true",current_card_holder_id_checked === JSON.stringify(socket.id))

        if (current_card_holder_id_checked === JSON.stringify(socket.id)) {
          //console.log("Test if this statement is true",current_card_holder_id_checked === socket.id)
          socket.emit("Said_Key_Word");
          console.log(socket.id,"Said the key word. Word said was:",capitalizedWord)
          //two lines of code were here that were used to assign teams and points before the new system. deleted.
          currentRound++;
          stoptimer();
          isEven(currentRound);
          Current_Card = null;
          return true
        } 

        return false;
      })

      if (current_guesser_id_checked === JSON.stringify(socket.id)) {
          socket.emit("Correct_Answer");
          //two lines of code were here that were used to assign teams and points before the new system. deleted.
          currentRound++;
          stoptimer();
          isEven(currentRound);
          Current_Card = null;
          //Code was here to emit score update event. deleted.
        }
    }
    
    //const forbidden = Current_Card.forbidden
    //const Keyword = Current_Card.keyword
    //console.log("The capitalized word is:",capitalizedWord)
    //console.log("Check if the user is in guesser list:",guesser.includes(socket.id))
    //console.log("Check if the user is in card holder list:",Card_Holder.includes(socket.id))
    //console.log("Current Card:",Current_Card)
    //console.log("Global check keyword:", Keyword.includes(capitalizedWord))
    //console.log("Global check Forbidden:", forbidden.includes(capitalizedWord))
    //console.log(guesser)
    //console.log(Card_Holder)
////////if//((Card_Holder.includes(socket.id))){
////////////console.log("The//person//who//just//chatted//is//a//guesser");
////////////console.log("True/False//value//for//forbidden//word//(Guesser)",forbidden//==//capitalizedWord)
////////////console.log("True/False//value//for//Key//word//Guesser)",Current_Card.keyword==capitalizedWord)
////////////////if//(Current_Card.forbidden.includes(capitalizedWord))//{////make//it//so//that//it//capitalizes//the//msg//first//DONE\\
////////////////////console.log(capitalizedWord,//"Is//a//forbidden//word");
////////////////////socket.emit("Forbidden_Word_Used");
////////////////////stoptimer();
////////////////////currentRound++;
////////////////////isEven(currentRound);
////////////////////Current_Card//=//null;
////////////////////
////////////////}else//if//(Current_Card.keyword.includes(capitalizedWord))//{
////////////////////
////////////////////socket.emit("Correct_Answer");
//////////////////////two//lines//of//code//were//here//that//were//used//to//assign//teams//and//points//before//the//new//system.//deleted.
////////////////////currentRound++;
////////////////////stoptimer();
////////////////////isEven(currentRound);
////////////////////Current_Card//=//null;
//////////////////////Code//was//here//to//emit//score//update//event.//deleted.
////////////////
////////////////}
////////////////
////////////////
////////}else//if//(Card_Holder.includes(socket.id)){
////////////console.log(Current_Card.forbidden.includes(capitalizedWord))
////////////console.log("The//person//who//just//chatted//is//a//card//holder")
////////////console.log("True/False//value//for//forbidden//word//(card_Holder)",Current_Card.forbidden//===//capitalizedWord)
////////////console.log("True/False//value//for//Key//word//(card_Holder)",Current_Card.keyword//===//capitalizedWord//)
////////////////if//(Current_Card.forbidden.includes(capitalizedWord))//{////make//it//so//that//it//capitalizes//the//msg//first////DONE//\\
////////////////////console.log(capitalizedWord,//"Is//a//forbidden//word")
////////////////////socket.emit("Forbidden_Word_Used")
////////////////////stoptimer();
////////////////////currentRound++;
////////////////////isEven(currentRound);
////////////////////Current_Card//=//null;
////////////////}else//if//(Current_Card.keyword.includes(capitalizedWord))//{
////////////////////socket.emit("Said_Key_Word");
////////////////////console.log(socket.id,"Said//the//key//word.//Word//said//was:",capitalizedWord)
//////////////////////two//lines//of//code//were//here//that//were//used//to//assign//teams//and//points//before//the//new//system.//deleted.
////////////////////currentRound++;
////////////////////stoptimer();
////////////////////isEven(currentRound);
////////////////////Current_Card//=//null;
//////////////////////code//was//here//that//was//used//to//trigger//a//previous//socket//emmiter.//check//versions//of//code.
////////////////}
////////////////
//////////////////

////////}
    
    
    io.to("Team_A").to("Team_B").emit("card_drawn",Current_Card)
  }
  
  


  assignTeam(Team_Scores)
  //^^ team assignment based on number of players
  

  
  //checks to see if there is already a team name. if so, it'll make it so new players cant enter names
  IsThereATeamName(Team_Name)

  isEven(currentRound)

  console.log(`${socket.id} has joined ${assignedTeam}`);
  console.log("These sockets are in the Card_Holder Roll:",Card_Holder)
  console.log("These sockets are in the Guesser Roll:",guesser)
  //lines of code here to assign clients to teams. depreciated and deleted.

  const Team_Player_Count = {
    Team_A_Count: Team_A.length,
    Team_B_Count: Team_B.length,
    Card_Holder_Count: Card_Holder.length,
    guesser_count: guesser.length
  };

  socket.on("Team_Chosen_Name", Team_Chosen_Name =>{
    //line of code was here to push name. deleted and redundant.
    
    io.emit("Team_Names",(Team_Chosen_Name))
    Team_Name = Team_Chosen_Name
    console.log(Team_Name)
    isEven(currentRound)
  })

  //depreciated code that was used to decide team name. replaced. check previous versions.  

  socket.on("draw_card" , () =>{

    Card_RNG()
    //debug code to check what the drawn card is.
    //console.log("Card_RNG:   ",Card_RNG())
    console.log("Constant_Card:   ", Current_Card)
    Current_Card=Current_Card
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
    // Debug code to see if the msg has been recieved and to check the card
    //socket.emit("chat_message", msg); // Send to all except sender
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
        i = chat_msg.shift();
        try{
          console.log("Capitalized Word for transcribe: ",capitalizedWord)
          Word_Checker(capitalizedWord)
        }catch{
          console.log("No Card Drawn Yet(From transcribed msg)")
        }
        
      };

    });

  })


  // Handle chat messages
  socket.on("chat_message", (msg) => {
    console.log(`Message from ${socket.id}:`, msg);
    socket.broadcast.emit("chat_message", msg); // Send to all except sender
    //code below is to test the output of the current card(forbidden word) and that the above event has been triggered
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
        //try {
          Word_Checker(capitalizedWord)
        //} catch  {
          //console.log("No card drawn yet(From chat msg)")
        //}
      };

    });
  });
 

    socket.on("Points_Updated",(scores) => {
      Team_Scores = Object.assign(scores)
      console.log("Curent Scores for this round",Team_Scores)
      console.log("Scores from the score variable", scores)
      io.emit("Update_Points",scores)
      if (Team_Scores.Team_A_Points >5 || Team_Scores.Team_B_Points >5) {
        app.get()
      }
    })

    

    console.log("Curent Scores for this round",Team_Scores)
  

  //Does not work for now dont use this (Was supposed to be for mic implementation but it did not work will replace soon)
  //depriciated code
  //^^^code removed on 30/06/2025 if you still want it check the previous versions
  
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
    }; //Might be useless

    io.emit("Capacity", Team_Player_Count);
    
  });
  console.log("These socketids are in team A:",Team_A)
  console.log("These socketids are in team B:",Team_B)
});

// Code below is supposed to trigger the local llm codes to generate new words might be used later on
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

//code below is used to open up the server. just open http://localhost:3000 to access (Use on chrome for now. firefox, opera seems to break)
//server.listen(port);

//code below is used to open up the server. You have to uncomment the hostname part of the code first then comment the code above then it should work. Also uncomment the code below (Use on chrome for now. firefox, opera seems to break)
server.listen(port, hostname, () => {
  console.log(`Server is running at http://${hostname}:${port}/`);
});

/////////////PROBLEMS BOARD//////////////
/////////////No current Problems//////////////
