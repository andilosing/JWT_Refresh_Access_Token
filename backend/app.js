const express = require("express")
const app = express()
const PORT = 8080;
const cors = require("cors");
const bcrypt = require("bcrypt")
const service = require("./service")
const jwt = require("jsonwebtoken")
const cookieParser = require('cookie-parser');

// Konstanten für die Tokens
const ACCESS_TOKEN_SECRET = 'your-access-token-secret';
const REFRESH_TOKEN_SECRET = 'your-refresh-token-secret';
const ACCESS_TOKEN_EXPIRES_IN = '5s'; // 1 Stunde
const REFRESH_TOKEN_EXPIRES_IN = '10s'; // 7 Tage

const SALT_ROUNDS = 10


app.use(cors({
    origin: 'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true
}))

app.use(express.json())

app.use(express.urlencoded({extended: false}))

app.use(express.static("public"))

app.use(cookieParser());

const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers[`authorization`]
    const token = authHeader && authHeader.split(` `)[1]

    if(!token) {
        return res.status(401).send("Failed authorization")
    }

    jwt.verify(token, ACCESS_TOKEN_SECRET, (err, user) => {
        if(err){
            return res.status(403).send("Invalid access token")
        }

        req.user = user
        next()
    })  

}


app.get("/protected", authenticateJWT, (req, res) => {
    res.json({message: "This is a authenticatet path!", 
    user: req.user})
})

app.post("/token", (req, res) => {
    const refreshTokenFromCookie = req.cookies['refreshToken'];
  
    if (!refreshTokenFromCookie) {
      return res.status(401).send("Refresh Token Required");
    }
  
    jwt.verify(refreshTokenFromCookie, REFRESH_TOKEN_SECRET, (err, user) => {
      if (err) {
        return res.status(403).send("Expired Refresh Token");
      }
  
      // Hier kannst du den verifizierten Refresh-Token weiter überprüfen
      service.getUserFromRefreshToken(refreshTokenFromCookie)
        .then(dbUser => {
          if (!dbUser) {
            return res.status(403).send("Invalid Refresh Token");
          }
  
          const accessToken = jwt.sign({ userId: dbUser.id, username: dbUser.username }, ACCESS_TOKEN_SECRET, {
            expiresIn: ACCESS_TOKEN_EXPIRES_IN,
          });
  
          res.json({ accessToken });
        })
        .catch(err => res.status(500).send(err));
    });
  });
  


app.post("/signup", async (req, res, next) => {
    try{
        const {username, password} = req.body
       
        
        if(!username || !password) {
            return res.status(401).send({message: "Username or Password is empty!"})
        }

        const hashedPassword = bcrypt.hashSync(password, SALT_ROUNDS)

        const returnMessage = await service.signup(username, hashedPassword)
        res.json(returnMessage)
    } catch (err) {
        next(err)
    }
})

app.post("/login", async (req, res, next) => {
    try{

        const {username, password} = req.body
        const user = await service.getUser(username)

        if(!user || !bcrypt.compareSync(password, user.password)){
            return res.status(401).send("Username or password invalid!")
        }

         // Erstelle den Access Token
         const accessToken = jwt.sign({ userId: user.id, username: user.username }, ACCESS_TOKEN_SECRET, {
            expiresIn: ACCESS_TOKEN_EXPIRES_IN,
        });

        // Erstelle den Refresh Token
        const refreshToken = jwt.sign({ userId: user.id, username: user.username }, REFRESH_TOKEN_SECRET, {
            expiresIn: REFRESH_TOKEN_EXPIRES_IN,
        });

        // Speichere den Refresh Token in einem Cookie
        res.cookie('refreshToken', refreshToken, { httpOnly: true, maxAge: 10000}); // 7 Tage

        // Refresh token in der Datenbank speichern
        await service.saveRefreshToken(user.id, refreshToken);

        // Sende den Access Token als JSON-Antwort
        res.json({ accessToken, user: { username: user.username }, message: `Welcome ${user.username}` });



        

    } catch (err) {
        next(err)
    }
})



const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send({ message: 'Internal Server Error', error: err.message });
  }

  app.use(errorHandler);
  





app.listen(PORT, () => console.log(`Server is listening on port ${PORT}.`))