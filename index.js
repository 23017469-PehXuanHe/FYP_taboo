const express = require('express');
const https = require('https');
const { type } = require('os');
const socketIO = require('socket.io');
const { json } = require('stream/consumers');
const mysql = require('mysql2');
const fs = require("fs");
const app = express();

const { Groq } = require('groq-sdk')
const bcrypt = require("bcrypt");//bcrypt for hashing
const session = require("express-session");
const { error } = require('console');

const groq = new Groq({ apiKey: 'gsk_OuZowxRAmX6WVNCdq7rBWGdyb3FYPXhfi6Ibiba7nooBjj7QovMgKC' }); //Xuan he's key
const groq2 = new Groq({ apiKey: 'gsk_BbXZZGiNzaeseJ8qGWXDWGdyb3FYxAvAHATTKwhCFE9q2JuYBugwYgE' }); //Xavier's key
const groq3 = new Groq({ apiKey: 'gsk_TPfMf5AjHTO8CHa2PpdCWGdyb3FY727OuKAaTrYnOlx58jaSUnpi3cV' }); //Rudy's key

const options = {
  key: fs.readFileSync("server.key"),
  cert: fs.readFileSync("server.crt"),
};

const server = https.createServer(options, app);
const io = socketIO(server);

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'truedbtaboo'
});

app.use(session({
  secret: "your-secret", // use a strong random string in production
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // stay false if using https localhost self-signed cert
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname)); // to serve admin.html



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

app.get("/register", (req, res) => {
  res.sendFile(__dirname + "/register.html");
});

app.post("/api/register", (req, res) => {
  const { username, password, role } = req.body;
  if (role === "admin") {
    db.query("SELECT * FROM admins WHERE username = ?", [username], (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).send("❌ Registration failed");
      }

      if (rows.length > 0) {
        return res.status(400).send("Username already taken");
      }

      // Hash password (still async but uses callback)
      bcrypt.hash(password, 10, (err, hashed) => {
        if (err) {
          console.error(err);
          return res.status(500).send("❌ Registration failed");
        }

        // Insert new user
        db.query(
          "INSERT INTO admins (username, password_hash) VALUES (?, ?)",
          [username, hashed],
          (err) => {
            if (err) {
              console.error(err);
              return res.status(500).send("❌ Registration failed");
            }
            res.send("✅ Registered successfully");
          }
        );
      });
    });
  } else if (role === "guest") {
    db.query("SELECT * FROM users WHERE username = ?", [username], (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).send("❌ Registration failed");
      }

      if (rows.length > 0) {
        return res.status(400).send("Username already taken");
      }

      // Hash password (still async but uses callback)
      bcrypt.hash(password, 10, (err, hashed) => {
        if (err) {
          console.error(err);
          return res.status(500).send("❌ Registration failed");
        }

        // Insert new user
        db.query(
          "INSERT INTO users (username, password_hash) VALUES (?, ?)",
          [username, hashed],
          (err) => {
            if (err) {
              console.error(err);
              return res.status(500).send("❌ Registration failed");
            }
            res.send("✅ Registered successfully");
          }
        );
      });
    });
  }
  // First query: check if username exists

});


app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  // Check admins first
  db.query("SELECT * FROM admins WHERE username = ?", [username], (err, adminRows) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Login error");
    }
    if (adminRows.length > 0) {
      // Compare password for admin
      bcrypt.compare(password, adminRows[0].password_hash, (err, valid) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Login error");
        }
        if (!valid) return res.status(400).send("Invalid password");

        // Set session
        req.session.user = {
          id: adminRows[0].id,
          username: adminRows[0].username,
          role: "admin"
        };
        console.log("User is in admin");
        return res.json({ user: req.session.user });
      });
    } else {
      // If not in admins, check users
      db.query("SELECT * FROM users WHERE username = ?", [username], (err, userRows) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Login error");
        }

        if (userRows.length > 0) {
          // Compare password for user
          bcrypt.compare(password, userRows[0].password_hash, (err, valid) => {
            if (err) {
              console.error(err);
              return res.status(500).send("Login error");
            }
            if (!valid) return res.status(400).send("Invalid password");

            // Set session
            req.session.user = {
              id: userRows[0].id,
              username: userRows[0].username,
              role: "guest"
            };
            console.log("User is in user");
            return res.json({ user: req.session.user });
          });
        } else {
          // User not found in either table
          return res.status(400).send("User not found");
        }
      });
    }
  });
});

app.post('/api/feedback', (req, res) => {
  const { feedback } = req.body;

  if (!feedback || feedback.trim() === "") {
    return res.status(400).send("Feedback cannot be empty.");
  }

  // Example: Save to a database (replace with actual DB logic)
  db.query("INSERT INTO feedback (content) VALUES (?)", [feedback], (err, result) => {
    if (err) {
      console.error("DB error:", err);
      return res.status(500).send("Error saving feedback.");
    }
    res.status(200).send("Feedback saved.");
  });
});

app.get("/gencards", (req, res) => {
  res.sendFile(__dirname + "/gencards.html")
})

app.post("/gencards", (req, res) => {
  const { topic, model } = req.body;
  console.log("Recieved:", topic, "model:", model)
  if (model === "llama-3.1-8b-instant") { //Xuan He's model
    async function generate_response() {
      const chatCompletion = await groq.chat.completions.create({
        "messages": [
          {
            "role": "user",
            "content": `You will generate word cards for the game taboo.Generate 10 target words for the topic ${topic}. For each target word, generate 5 taboo words. A target word must be a single word. Taboo words must also be single words closely related to the target. No blanks, quotes, phrases, or commas. Format as CSV rows:<target>,<taboo1>,<taboo2>,<taboo3>,<taboo4>,<taboo5>`
          }
        ],
        "model": "llama-3.1-8b-instant",
        "temperature": 1,
        "max_completion_tokens": 1024,
        "top_p": 1,
        "stream": true,
        "stop": null
      });

      let fullResponse = "";
      for await (const chunk of chatCompletion) {
        const content = chunk.choices[0]?.delta?.content || '';
        process.stdout.write(content);
        fullResponse += content;
      }

      res.json({ reply: fullResponse })
      console.log(fullResponse)
    }


    //const outputText = completion.choices[0].message.content;
    //fs.writeFileSync('cards.csv', fullResponse, 'utf-8');

    generate_response()

    //const testfullresponse = fs.readFileSync("\cards.csv","utf-8")

  } else if (model === "meta-llama/llama-4-scout-17b-16e-instruct") { //Xavier's model
    async function generate_response() {
      const chatCompletion = await groq2.chat.completions.create({
        "messages": [
          {
            "role": "user",
            "content": `You will generate word cards for the game taboo.Generate 10 target words for the topic ${topic}. For each target word, generate 5 taboo words. A target word must be a single word. Taboo words must also be single words closely related to the target. No blanks, quotes, phrases, or commas. Format as CSV rows:<target>,<taboo1>,<taboo2>,<taboo3>,<taboo4>,<taboo5>`
          }
        ],
        "model": "meta-llama/llama-4-scout-17b-16e-instruct",
        "temperature": 1,
        "max_completion_tokens": 1024,
        "top_p": 1,
        "stream": true,
        "stop": null
      });

      let fullResponse = "";
      for await (const chunk of chatCompletion) {
        const content = chunk.choices[0]?.delta?.content || '';
        process.stdout.write(content);
        fullResponse += content;
      }

      res.json({ reply: fullResponse })
      console.log(fullResponse)
    }

    generate_response()
    //const testfullresponse = fs.readFileSync("\cards.csv","utf-8")
    //res.json({reply: testfullresponse})
    //res.json({reply: fullresponse})
  } else if (model === "gemma2-9b-it") { //Rudy's model
    async function generate_response() {
      const chatCompletion = await groq3.chat.completions.create({
        "messages": [
          {
            "role": "user",
            "content": `You will generate word cards for the game taboo.Generate 10 target words for the topic ${topic}. For each target word, generate 5 taboo words. A target word must be a single word. Taboo words must also be single words closely related to the target. No blanks, quotes, phrases, or commas. Format as CSV rows:<target>,<taboo1>,<taboo2>,<taboo3>,<taboo4>,<taboo5>`
          }
        ],
        "model": "gemma2-9b-it",
        "temperature": 1,
        "max_completion_tokens": 1024,
        "top_p": 1,
        "stream": true,
        "stop": null
      });

      let fullResponse = "";
      for await (const chunk of chatCompletion) {
        const content = chunk.choices[0]?.delta?.content || '';
        process.stdout.write(content);
        fullResponse += content;
      }

      res.json({ reply: fullResponse })
      console.log(fullResponse)
    }

    generate_response()
    //const testfullresponse = fs.readFileSync("\cards.csv", "utf-8")

    //res.json({ reply: testfullresponse })
    //res.json({reply: fullresponse})
  }

})

app.post("/savecards", async (req, res) => {
  try {
    const { cards } = req.body;
    if (!cards || !Array.isArray(cards) || cards.length === 0) {
      return res.status(400).json({ error: "No cards received or invalid format." });
    }

    const insertSQL = `
      INSERT INTO cards (keyword, forbidden1, forbidden2, forbidden3, forbidden4, forbidden5)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    for (const row of cards) {
      const values = [
        row[0] || "",
        row[1] || "",
        row[2] || "",
        row[3] || "",
        row[4] || "",
        row[5] || ""
      ];
      await db.execute(insertSQL, values);
    }

    res.json({ status: "ok", inserted: cards.length });
  } catch (err) {
    console.error("❌ Error inserting cards:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/stats",(req, res) => {
  const {username} = req.body

  if (!username) {
    return res.status(400).json({error: "Username needed"})
  }

  db.query("SELECT wins,games_played,losses FROM users WHERE username = ?",[username], (err, results) => {
    if (err) {
      console.error("Database encountered an error:", err)
      return res.status(500).json({error: "Use not found"})
    }

    if (results.length === 0) {
      
      return res.status(404).json({error: "User not found"})
    }

    const stats = {
      wins: results[0].wins || 0,
      games_played: results[0].games_played || 0,
      losses: results[0].losses || 0
    }

    res.json(stats);
  })

})

app.get("/Unsupported_Browser", (req, res) => {
  res.sendFile(__dirname + "/Unsupported_Browser.html")
})

app.get("/Defeat", (req, res) => {
  app.use(express.static('Defeat'))
  res.sendFile(__dirname + "/Defeat/Defeat.html")
})

app.get("/Victory", (req, res) => {
  app.use(express.static('Victory'))
  res.sendFile(__dirname + "/Victory/Victory.html")
})

app.get("/taboo3", (req, res) => {
  res.sendFile(__dirname + "/taboo3.html");
});


app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname)); // to serve admin.html

// Show admin UI
app.get("/admin", (req, res) => {
  res.sendFile(__dirname + "/admin.html");
});

// Get all cards
app.get("/api/cards", (req, res) => {
  db.query("SELECT * FROM cards", (err, result) => {
    if (err) return res.status(500).send("DB error");
    res.json(result);
  });
});

// Add a new card
app.post("/api/cards", (req, res) => {
  const { keyword, forbidden1, forbidden2, forbidden3, forbidden4, forbidden5 } = req.body;
  const query = `INSERT INTO cards (keyword, forbidden1, forbidden2, forbidden3, forbidden4, forbidden5)
                 VALUES (?, ?, ?, ?, ?, ?)`;
  db.query(query, [keyword, forbidden1, forbidden2, forbidden3, forbidden4, forbidden5], (err) => {
    if (err) return res.status(500).send("Insert failed");
    res.send("Card added");
  });
});

// Delete a card
app.delete("/api/cards/:id", (req, res) => {
  db.query("DELETE FROM cards WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).send("Delete failed");
    res.send("Card deleted");
  });
});


db.connect(err => {
  if (err) throw err;
  console.log('Connected to MySQL database.');
});

// Cards
let cards = [];

function loadCardsFromDB(callback) {
  db.query('SELECT * FROM cards', (err, results) => {
    if (err) throw err;
    cards = results.map(row => ({
      keyword: row.keyword,
      forbidden: [row.forbidden1, row.forbidden2, row.forbidden3, row.forbidden4, row.forbidden5]
    }));
    console.log("✅ Cards loaded from DB:", cards);
    if (callback) callback();
  });
}


// Team and role
let Team_A = [];
let Team_B = [];
let Card_Holder = [];
let guesser = [];
let players_list = [];


let Team_Name = []

var Team_Scores = {
  Team_A_Points: 0,
  Team_B_Points: 0
};

let timer = null
let Current_Card = null;

let currentRound = 1
let maxRounds = 5;
let currentTeamTurn = "Team_A"



function Card_RNG() {
  //loadCardsFromDB()
  const rng = Math.floor(Math.random() * (cards.length - 0) + 0)
  console.log(cards)
  const card = cards[rng]
  console.log("From Card_RNG :", card)
  Current_Card = card
  //console.log(Current_Card)
  return Current_Card;
}

function draw_random() {
  Card_RNG()
  const chosen_one = Current_Card
  console.log("chosen 1", chosen_one)
  Card_RNG()
  const chosen_two = Current_Card
  console.log("chosen 2", chosen_two)
  Card_RNG()
  const chosen_three = Current_Card
  console.log("chosen 3", chosen_three)
}

loadCardsFromDB(() => {
  //draw_random() //uncomment to check the random values
})

let assignedTeam;
const player_username_list = {};
//function called endRound was here. deleted since it was useless. if needed check previous versions
io.on("connection", (socket) => {
  //players_list.push(socket.id)
  //console.log("Players_list:", players_list)

  //let Round_In_Progress = null;

  assignTeam()
  assignrole()
  console.log("New user connected:", socket.id);

  socket.on("Say_My_Name", (Your_GodDamn_Right) => {
    player_username_list[socket.id] = Your_GodDamn_Right
    console.log("usernameplayerlist", player_username_list)
    player_check()
  })



  function player_check() {
    const P_list_len = Object.keys(player_username_list).length
    console.log(player_username_list)
    if (P_list_len >= 4) {
      io.emit("enough_players", P_list_len)
      console.log("enough players was triggered")
      oneoffteamturn()
    } else if (P_list_len < 4) {
      const test = socket.id
      const P_name = player_username_list[socket.id]
      console.log(P_name)
      const username_and_list_len = [P_name, P_list_len]
      console.log(username_and_list_len)
      io.emit("Not_Enough_Players", username_and_list_len)
      console.log("Not enough players was triggered")
    }
  }


  function stoptimer() {
    io.emit("Round_End", currentRound);
    clearInterval(timer);
    teamturn()
    console.log("Round Ended")
  };

  function assignTeam() {
    redisplayscore(Team_Scores)
    if (Team_A.length <= Team_B.length) {
      Team_A.push(socket.id);
      socket.join("Team_A");
      const assignedTeam = "Team_A";
      socket.emit("Team", (assignedTeam))
      Team_A = Team_A
      const A1 = Team_A[0];

    } else {
      Team_B.push(socket.id);
      socket.join("Team_B");
      const assignedTeam = "Team_B";
      socket.emit("Team", (assignedTeam))
      Team_B = Team_B
      const B1 = Team_B[0];
    }


  };

  function assignrole() {
    const card_holder_len = Card_Holder.length
    console.log("assign Role funct triggered")

    if (card_holder_len < 2) {
      const Team_A_Copy = Team_A.slice()
      const Team_B_Copy = Team_B.slice()
      if (Team_A.find((element) => element === socket.id) !== undefined && Card_Holder.find((element) => element === socket.id) === undefined) {
        Card_Holder.push(Team_A_Copy[0])
        const role = "card_holder"
        socket.emit("role_assigned", role);
        console.log(socket.id, "Has been assigned to cardholder", Card_Holder)
      }

      if (Team_B.find((element) => element === socket.id) !== undefined && Card_Holder.find((element) => element === socket.id) === undefined) {
        Card_Holder.push(Team_B_Copy[0])
        const role = "card_holder"
        socket.emit("role_assigned", role);
        console.log(socket.id, "Has been assigned to cardholder", Card_Holder)
      };
    } else {
      console.log("Guesser role was asigned")
      guesser.push(socket.id);
      const role = "guesser"
      socket.emit("role_assigned", role);
      console.log(socket.id, "Has been assigned to guesser", guesser)
    }

  }

  function teamturn() {
    if (currentRound % 2 == 1) {
      io.emit("TeamA")
    } else {
      io.emit("TeamB")
    }
  }

  function oneoffteamturn() {
    if (currentRound % 2 == 1) {
      io.emit("TeamAoneoff")
    } else {
      io.emit("TeamBoneoff")
    }
  }

  function redisplayscore(Team_Scores) { //this code is mainly here so that if a new player joins while in the middle of round or something they still get scores
    var scores = Team_Scores
    console.log("This is the current score after the test", scores, "Triggerd by:", socket.id)
    io.to(socket.id).emit("Update_Points", scores)
  }

  function IsThereATeamName(Team_Name) {
    let Team_Name_length = Team_Name.length
    console.log("Team Names are:", Team_Name)
    if (Team_Name_length > 0) {
      io.emit("DONTDISPLAYTHENAMECHOOSING", Team_Name)
      io.emit("One_off_display", Team_Name)
      isEven(currentRound)
      
    }
    io.emit("Display_Custom_Name", (Team_Name))
    //oneoffteamturn()
  }

  function oneoffteamcheck(currentRound) {
    io.to(socket.id).emit("UpdateCurrentTeamPlaying", currentRound)
  }

  function isEven(currentRound) {
    if (currentRound % 2 == 1) {
      io.emit("Team_A_Turn", currentRound)
      console.log("Current Round: ", currentRound)
      //Used to return the current round. left in since could be useful
      //return currentRound;
    } else {
      io.emit("Team_B_Turn", currentRound)
      console.log("Current Round: ", currentRound)
      //Used to return the current round. left in since could be useful
      //return currentRound;
    }

  };

  function Word_Checker(capitalizedWord) {

    const Keyword = Current_Card.keyword.toLowerCase()
    const Keyword_list = Array.from(Keyword)
    console.log("Keyword_list:", Keyword_list)
    let i = Keyword_list[0].toLowerCase()
    Keyword_list.splice(0, 1, i)
    const cleaned_key_word = Keyword.replace(/\s+/g, '')
    const stripped_key_word = cleaned_key_word.replace(/["']/g, "")
    console.log("Stripped key word:", stripped_key_word)
    const capitalizedKeyWord = stripped_key_word//Keyword_list.join('')

    console.log("CapitalizedKeyword Variable is:", capitalizedKeyWord)
    var forbidden_words = []
    var forbidden_words = Current_Card.forbidden.slice()
    console.log("FW_List :", forbidden_words)

    console.log(capitalizedWord === capitalizedKeyWord)

    Current_Card.forbidden.forEach((check) => {
      console.log("Checkng for each forbidden word")
      const cleaned_f_word = (forbidden_words.shift()).replace(/\s+/g, '')
      const stripped_f_word = cleaned_f_word.replace(/["']/g, "")
      console.log("STRIPPED F WORD:", stripped_f_word)
      //var forbidden_words = Current_Card.forbidden
      //console.log("This is a loop message for the forbidden word")
      const current_card_fw_string = JSON.stringify(stripped_f_word).toLowerCase()
      //console.log("The stringified fw",current_card_fw_string)
      if (current_card_fw_string === JSON.stringify(capitalizedWord)) {
        if (Card_Holder.find((element) => element === socket.id) !== undefined) {
          console.log("Checkng for each forbidden word")
          console.log(capitalizedWord, "Is a forbidden word");
          socket.emit("Forbidden_Word_Used");
          stoptimer();
          currentRound++;
          isEven(currentRound);
          Round_In_Progress = false;
          Current_Card = null;
        }

      }
    })

    if (capitalizedWord === capitalizedKeyWord) {
      console.log("Checking if the capitalized word is a keyword")
      if (Card_Holder.find((element) => element === socket.id) !== undefined) {
        console.log("Test if this statement is true", Card_Holder.find((element) => element === socket.id) !== undefined)
        socket.emit("Said_Key_Word");
        console.log(socket.id, "Said the key word. Word said was:", capitalizedWord)
        //two lines of code were here that were used to assign teams and points before the new system. deleted.
        currentRound++;
        stoptimer();
        isEven(currentRound);
        Current_Card = null;

      } else if (Card_Holder.find((element) => element === socket.id) === undefined) { //checks if the current socket id is in the card holder list. if not it will return undefined
        socket.emit("Correct_Answer");
        //two lines of code were here that were used to assign teams and points before the new system. deleted.
        currentRound++;
        stoptimer();
        isEven(currentRound);
        Round_In_Progress = false;
        Current_Card = null;
      }


      console.log("User is cardholder", Card_Holder.find((element) => element === socket.id))
    }

    //var forbidden_words = Current_Card.forbidden

    io.to("Team_A").to("Team_B").emit("card_drawn", Current_Card)
  }

  //^^ team assignment based on number of players
  //assignTeam()

  //checks to see if there is already a team name. if so, it'll make it so new players cant enter names
  IsThereATeamName(Team_Name)

  //isEven(currentRound)

  console.log(`${socket.id} has joined ${assignedTeam}`);
  console.log("These sockets are in the Card_Holder Role:", Card_Holder)
  console.log("These sockets are in the Guesser Role:", guesser)
  //lines of code here to assign clients to teams. depreciated and deleted.

  const Team_Player_Count = {
    Team_A_Count: Team_A.length,
    Team_B_Count: Team_B.length,
    Card_Holder_Count: Card_Holder.length,
    guesser_count: guesser.length
  };

  socket.on("Team_Chosen_Name", Team_Chosen_Name => {
    //line of code was here to push name. deleted and redundant.
    io.emit("Team_Names", (Team_Chosen_Name))
    Team_Name = Team_Chosen_Name
    console.log(Team_Name)
    isEven(currentRound)
  })

  //depreciated code that was used to decide team name. replaced. check previous versions.  

  socket.on("draw_card", () => {

    Card_RNG()
    //debug code to check what the drawn card is.
    //console.log("Card_RNG:   ",Card_RNG())
    console.log("Constant_Card:   ", Current_Card)
    Current_Card = Current_Card
    io.to("Team_A").to("Team_B").emit("card_drawn", Current_Card);

    currentTime = 60
    timer = setInterval(() => {
      currentTime--;
      io.emit("Timer", currentTime);
      if (currentTime <= 0) {
        clearInterval(timer);
        currentRound++;
        isEven(currentRound)
        //console.log("Round Ended")
        stoptimer()
      };

    }, 1000)

    console.log("Card Drawn")
  });

  io.to("Team_A").to("Team_B").emit("card_drawn", Current_Card)

  socket.on("transcribed_message", (text) => {
    const msg = text[1]
    socket.broadcast.emit("chat_transcribed_message", text); //sends to all other clients to be displayed 2
    console.log(msg)
    // Debug code to see if the msg has been recieved and to check the card
    //socket.emit("chat_message", msg); // Send to all except sender
    //console.log("Current Card Keyword ==>", Current_Card.forbidden)
    //console.log("TEST CHAT MESSAGE")
    //console.log(Current_Card.forbidden)
    const stripped_msg = msg.replace(/[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\-.\/:;<=>?@\[\]^_`{|}~]/, "")
    const stripped_msg_rgx = stripped_msg.replace(/\s{2,}/g, " ")
    const chat_msg = stripped_msg_rgx.toLowerCase().split(" ")
    console.log(stripped_msg_rgx)
    console.log(chat_msg)
    chat_msg.forEach(function (element) {
      while (chat_msg.length > 0) {
        let i = chat_msg[0].toLowerCase()
        //let firstLetter = i.charAt(0)
        //let firstLetterCap = firstLetter.toUpperCase()
        //let remainingLetters = i.slice(1)
        //const capitalizedWord = firstLetterCap + remainingLetters
        i = chat_msg.shift();
        const capitalizedWord = i
        //const capitalizedWord = chat_msg
        try {
          console.log("Capitalized Word for transcribe: ", capitalizedWord)
          Word_Checker(capitalizedWord)
        } catch {
          console.log("No Card Drawn Yet(From transcribed msg)")
        }

      };

    });

  })

  socket.on("FBW_Used", (My_Team) => {
    const FBW_Used_Team = My_Team
    socket.broadcast.emit("FBW_Used_Reply", (FBW_Used_Team))
  });

  socket.on("Correct_Guess_Made", () => {
    socket.broadcast.emit("Render_Correct_Guess")
    console.log("Message sent")
  });

  socket.on("USR_SKW", (Sender_Team) => {
    socket.broadcast.emit("USR_SKW_REPLY", Sender_Team)
  });

  // Handle chat messages
  socket.on("chat_message", (msg) => {
    console.log(`Message from ${msg[0]},${socket.id}:`, msg[1]);
    socket.broadcast.emit("chat_message", msg); // Send to all except sender
    //code below is to test the output of the current card(forbidden word) and that the above event has been triggered
    //console.log("Current Card Keyword ==>", Current_Card.forbidden)
    //console.log("TEST CHAT MESSAGE")
    //console.log(Current_Card.forbidden)
    const chat_message_text = msg[1]
    const stripped_msg = chat_message_text.replace(/[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\-.\/:;<=>?@\[\]^_`{|}~]/, "")
    const stripped_msg_rgx = stripped_msg.replace(/\s{2,}/g, " ")
    const chat_msg = stripped_msg_rgx.toLowerCase().split(" ")
    console.log(stripped_msg)
    console.log(stripped_msg_rgx)
    //console.log(chat_msg)
    //const chat_msg = msg.toLowerCase().split(" ")
    console.log(chat_msg)
    chat_msg.forEach(function (element) {
      while (chat_msg.length > 0) {
        let i = chat_msg[0].toLowerCase()
        //let firstLetter = i.charAt(0)
        //let firstLetterCap = firstLetter//.toUpperCase()
        //let remainingLetters = i.slice(1)
        //const capitalizedWord = firstLetterCap + remainingLetters
        //const capitalizedWord
        const capitalizedWord = i
        console.log(capitalizedWord)
        i = chat_msg.shift();
        try {
          Word_Checker(capitalizedWord)
        } catch {
          console.log("No card drawn yet(From chat msg)")
        }
      };

    });
  });



  socket.on("Points_Updated", (scores) => {
    Team_Scores = Object.assign(scores)
    console.log("Curent Scores for this round", Team_Scores)
    console.log("Scores from the score variable", scores)
    io.emit("Update_Points", scores)

    Object.keys(player_username_list).forEach(key => {
      const username = player_username_list[key]
      db.query ("SELECT * FROM users WHERE username = ? ",[username], (err, userRows) => {
        if (err) {
          return console.error(`Error checking users for ${username}:`, err)
        } if (username) {
            // Step 1: Check if username exists in users table
            const checkUserSql = `SELECT 1 FROM users WHERE username = ? LIMIT 1`;
            db.query(checkUserSql, [username], (err, userRows) => {
              if (err) {
                console.error(`Error checking users table for '${username}':`, err);
                return;
              }

              if (userRows.length > 0) {
                // Found in users table – update wins
                const updateUserSql = `UPDATE users SET games_played = games_played + 1 WHERE username = ?`;
                db.query(updateUserSql, [username], (err, result) => {
                  if (err) {
                    console.error(`Error updating wins for ${username} in users table:`, err);
                  } else {
                    console.log(`Updated games_played for user ${username} (users table)`);
                  }
                });
                
              } else {
                // Step 2: Check admins table
                const checkAdminSql = `SELECT 1 FROM admins WHERE username = ? LIMIT 1`;
                db.query(checkAdminSql, [username], (err, adminRows) => {
                  if (err) {
                    console.error(`Error checking admins table for '${username}':`, err);
                    return;
                  }

                  if (adminRows.length > 0) {
                    // Found in admins table – games_played
                    const updateAdminSql = `UPDATE admins SET games_played = games_played + 1 WHERE username = ?`;
                    db.query(updateAdminSql, [username], (err, result) => {
                      if (err) {
                        console.error(`Error updating wins for ${username} in admins table:`, err);
                      } else {
                        console.log(`Updated wins for user ${username} (admins table)`);
                      }
                    });
                  } else {
                    console.warn(`Username '${username}' not found in users or admins table.`);
                  }
                });
              }
            });
          } else {
            console.warn(`No username found for socket ID: ${socket.Id}`);
          }
      })

    });

    if (Team_Scores.Team_A_Points >= 3 || Team_Scores.Team_B_Points >= 3) {
      io.emit("Someone_Won")
      if (Team_Scores.Team_A_Points >= 3) {
        Team_A.forEach(element => {
          const username = player_username_list[element]
          if (username) {
            // Step 1: Check if username exists in users table
            const checkUserSql = `SELECT 1 FROM users WHERE username = ? LIMIT 1`;
            db.query(checkUserSql, [username], (err, userRows) => {
              if (err) {
                console.error(`Error checking users table for '${username}':`, err);
                return;
              }

              if (userRows.length > 0) {
                // Found in users table – update wins
                const updateUserSql = `UPDATE users SET wins = wins + 1 WHERE username = ?`;
                db.query(updateUserSql, [username], (err, result) => {
                  if (err) {
                    console.error(`Error updating wins for ${username} in users table:`, err);
                  } else {
                    console.log(`Updated wins for user ${username} (users table)`);
                  }
                });
                
              } else {
                // Step 2: Check admin table
                const checkAdminSql = `SELECT 1 FROM admins WHERE username = ? LIMIT 1`;
                db.query(checkAdminSql, [username], (err, adminRows) => {
                  if (err) {
                    console.error(`Error checking admins table for '${username}':`, err);
                    return;
                  }

                  if (adminRows.length > 0) {
                    // Found in admin table – update wins
                    const updateAdminSql = `UPDATE admins SET wins = wins + 1 WHERE username = ?`;
                    db.query(updateAdminSql, [username], (err, result) => {
                      if (err) {
                        console.error(`Error updating wins for ${username} in admins table:`, err);
                      } else {
                        console.log(`Updated wins for user ${username} (admins table)`);
                      }
                    });
                  } else {
                    console.warn(`Username '${username}' not found in users or admins table.`);
                  }
                });
              }
            });
          } else {
            console.warn(`No username found for socket ID: ${socket.Id}`);
          }
        });
        Team_B.forEach(element => {
          const username = player_username_list[element]
          if (username) {
            // Step 1: Check if username exists in users table
            const checkUserSql = `SELECT 1 FROM users WHERE username = ? LIMIT 1`;
            db.query(checkUserSql, [username], (err, userRows) => {
              if (err) {
                console.error(`Error checking users table for '${username}':`, err);
                return;
              }

              if (userRows.length > 0) {
                // Found in users table – update wins
                const updateUserSql = `UPDATE users SET losses = losses + 1 WHERE username = ?`;
                db.query(updateUserSql, [username], (err, result) => {
                  if (err) {
                    console.error(`Error updating losses for ${username} in users table:`, err);
                  } else {
                    console.log(`Updated losses for user ${username} (users table)`);
                  }
                });
                
              } else {
                // Step 2: Check admin table
                const checkAdminSql = `SELECT 1 FROM admins WHERE username = ? LIMIT 1`;
                db.query(checkAdminSql, [username], (err, adminRows) => {
                  if (err) {
                    console.error(`Error checking admins table for '${username}':`, err);
                    return;
                  }

                  if (adminRows.length > 0) {
                    // Found in admin table – update wins
                    const updateAdminSql = `UPDATE admins SET losses = losses + 1 WHERE username = ?`;
                    db.query(updateAdminSql, [username], (err, result) => {
                      if (err) {
                        console.error(`Error updating losses for ${username} in admins table:`, err);
                      } else {
                        console.log(`Updated losses for user ${username} (admins table)`);
                      }
                    });
                  } else {
                    console.warn(`Username '${username}' not found in users or admins table.`);
                  }
                });
              }
            });
          } else {
            console.warn(`No username found for socket ID: ${socket.Id}`);
          }
        })
      }

      if (Team_Scores.Team_B_Points >= 3) {
        Team_B.forEach(element => {
          const username = player_username_list[element]
          if (username) {
            // Step 1: Check if username exists in users table
            const checkUserSql = `SELECT 1 FROM users WHERE username = ? LIMIT 1`;
            db.query(checkUserSql, [username], (err, userRows) => {
              if (err) {
                console.error(`Error checking users table for '${username}':`, err);
                return;
              }

              if (userRows.length > 0) {
                // Found in users table – update wins
                const updateUserSql = `UPDATE users SET wins = wins + 1 WHERE username = ?`;
                db.query(updateUserSql, [username], (err, result) => {
                  if (err) {
                    console.error(`Error updating wins for ${username} in users table:`, err);
                  } else {
                    console.log(`Updated wins for user ${username} (users table)`);
                  }
                });
                
              } else {
                // Step 2: Check admin table
                const checkAdminSql = `SELECT 1 FROM admins WHERE username = ? LIMIT 1`;
                db.query(checkAdminSql, [username], (err, adminRows) => {
                  if (err) {
                    console.error(`Error checking admins table for '${username}':`, err);
                    return;
                  }

                  if (adminRows.length > 0) {
                    // Found in admin table – update wins
                    const updateAdminSql = `UPDATE admins SET wins = wins + 1 WHERE username = ?`;
                    db.query(updateAdminSql, [username], (err, result) => {
                      if (err) {
                        console.error(`Error updating wins for ${username} in admins table:`, err);
                      } else {
                        console.log(`Updated wins for user ${username} (admins table)`);
                      }
                    });
                  } else {
                    console.warn(`Username '${username}' not found in users or admins table.`);
                  }
                });
              }
            });
          } else {
            console.warn(`No username found for socket ID: ${socket.Id}`);
          }
        });
        Team_A.forEach(element => {
          const username = player_username_list[element]
          if (username) {
            // Step 1: Check if username exists in users table
            const checkUserSql = `SELECT 1 FROM users WHERE username = ? LIMIT 1`;
            db.query(checkUserSql, [username], (err, userRows) => {
              if (err) {
                console.error(`Error checking users table for '${username}':`, err);
                return;
              }

              if (userRows.length > 0) {
                // Found in users table – update wins
                const updateUserSql = `UPDATE users SET losses = losses + 1 WHERE username = ?`;
                db.query(updateUserSql, [username], (err, result) => {
                  if (err) {
                    console.error(`Error updating losses for ${username} in users table:`, err);
                  } else {
                    console.log(`Updated losses for user ${username} (users table)`);
                  }
                });
                
              } else {
                // Step 2: Check admin table
                const checkAdminSql = `SELECT 1 FROM admins WHERE username = ? LIMIT 1`;
                db.query(checkAdminSql, [username], (err, adminRows) => {
                  if (err) {
                    console.error(`Error checking admins table for '${username}':`, err);
                    return;
                  }

                  if (adminRows.length > 0) {
                    // Found in admin table – update wins
                    const updateAdminSql = `UPDATE admins SET losses = losses + 1 WHERE username = ?`;
                    db.query(updateAdminSql, [username], (err, result) => {
                      if (err) {
                        console.error(`Error updating losses for ${username} in admins table:`, err);
                      } else {
                        console.log(`Updated losses for user ${username} (admins table)`);
                      }
                    });
                  } else {
                    console.warn(`Username '${username}' not found in users or admins table.`);
                  }
                });
              }
            });
          } else {
            console.warn(`No username found for socket ID: ${socket.Id}`);
          }
        })
      }
    };
  });



  console.log("Curent Scores for this round", Team_Scores)


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
    delete player_username_list[socket.id]

    socket.leave("Team_A")
    socket.leave("Team_B")

    console.log("Updated guess list:", guesser)
    console.log("Updated holder list:", Card_Holder)
    console.log("Updated Team A list:", Team_A)
    console.log("Updated Team B list:", Team_B)
    console.log("Updated Player_username_list:", player_username_list)

    if (Object.keys(player_username_list).length === 0) {
      Team_A = [];
      Team_B = [];
      Card_Holder = [];
      guesser = [];
      players_list = [];


      Team_Name = []

      Team_Scores = {
        Team_A_Points: 0,
        Team_B_Points: 0
      };

      timer = null
      Current_Card = null;

      currentRound = 1
      maxRounds = 5;
      currentTeamTurn = "Team_A"
    }
    // Update player counts after disconnect
    const Team_Player_Count = {
      Team_A_Count: Team_A.length,
      Team_B_Count: Team_B.length,
      Card_Holder_Count: Card_Holder.length,
      guesser_count: guesser.length
    };

    io.emit("Capacity", Team_Player_Count);

  });
  console.log("These socketids are in team A:", Team_A)
  console.log("These socketids are in team B:", Team_B)


});

// Code below is supposed to trigger the local llm codes to generate new words might be used later on
//const { spawn } = require("child_process");

//code below is used to open up the server. just open http://localhost:3000 to access (Use on chrome for now. firefox, opera seems to break)
//server.listen(port);

//code below is used to open up the server. 
server.listen(port, hostname, () => {
  console.log(`Server is running at https://${hostname}:${port}/`);
});

