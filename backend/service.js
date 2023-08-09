const db = require("./db")

const signup = (username, hashedPassword) => {  
    return db.query("INSERT INTO users (username, password) VALUES ($1, $2)", [username, hashedPassword])
        .then(() => {
            return { message: `User created successfully: `,
                    username: username,
                    hashedPassword: hashedPassword }; // Hier das return Statement
        })
        .catch((err) => {
            throw err;
        });
}

const getUser = (username) => {
    return db.query("SELECT * FROM users WHERE username = $1", [username])
      .then((result) => {
        if (result.rows.length > 0) {
          return result.rows[0]; // Gibt das erste Ergebnis zurück, wenn es gefunden wird
        } else {
            return null; // Fehler, wenn kein Benutzer gefunden wird
        }
      })
      .catch((err) => {
        console.error('Error getting user:', err);
        throw err; // Weiterleiten des Fehlers, um ihn außerhalb dieser Funktion zu behandeln
      });
  }

const saveRefreshToken = (userId, refreshToken) => {
    return db.query("UPDATE users SET refreshtoken = $1 WHERE id = $2", [refreshToken, userId])
    .then(() => {
        return {message: "refresh token sucessfuly stored"}
    })
    .catch((err) => {
        throw err
    })
}
  
const getUserFromRefreshToken = (refreshToken) => {
    return db.query("SELECT * FROM users WHERE refreshtoken = $1", [refreshToken])
      .then((result) => {
        if (result.rows.length > 0) {
          return result.rows[0]; // Return the first result if found
        } else {
            return null; // Error if no user is found
        }
      })
      .catch((err) => {
        console.error('Error getting user from refresh token:', err);
        throw err; // Forward the error to be handled outside this function
      });
  };
  


module.exports = {
    signup,
    getUser,
    saveRefreshToken,
    getUserFromRefreshToken,
}

