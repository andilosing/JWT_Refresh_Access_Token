const { Client } = require('pg');

const db = new Client({
    host: 'localhost',
    port: 5432,
    user: 'andi',
    password: 'andreas2', // Ersetze dies durch das tatsächliche Passwort
    database: 'JWT', // Ersetze dies durch den tatsächlichen Datenbanknamen
  });
  
  db.connect()
    .then(() => {
      console.log('Connected to PostgreSQL');
    })
    .catch((err) => {
      console.error('Error connecting to PostgreSQL', err);
    });


    db.query(`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username TEXT NOT NULL,
            password TEXT NOT NULL,
            refreshtoken TEXT
        );
    `)
    .then(() => {
      console.log('Table created successfully');
    })
    .catch((err) => {
      console.error('Error creating table:', err);
    });


    

    



module.exports = db
