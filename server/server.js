const express = require('express'); // Express is a web framework for Node.js, used to create server-side APIs, routes, and handle HTTP requests and responses efficiently.
const Imap = require('imap-simple'); // IMAP Simple is used to interact with email servers using the IMAP protocol. It simplifies handling email operations, such as fetching or managing emails.
const dotenv = require('dotenv'); // dotenv loads environment variables from a `.env` file into `process.env`. It helps in managing sensitive data like API keys and configurations securely.
const mysql = require("mysql2"); // mysql2 is a library for connecting to MySQL databases. It supports both callback-based and promise-based queries for database operations.
const { OAuth2Client } = require('google-auth-library'); // The Google Auth Library is used for OAuth 2.0 authentication. The `OAuth2Client` class facilitates handling OAuth flows, like verifying Google tokens.
const path = require('path'); // path is a core Node.js module for working with file and directory paths. It helps in resolving and manipulating paths reliably across different operating systems.


dotenv.config();

const app = express();
const port = process.env.PORT || 500;

const CLIENT_ID = '344042342272-hs4g58qjib2392t70pi7g448kvj435al.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'http://localhost:500/callback';

const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const sequelize = require('./db');
const User = require('./userModel');
const Email = require('./emailModel');

sequelize
    .sync({ alter: true, }) // Use `force: true` to reset the database during development
    .then(() => console.log('Database synced.'))
    .catch((err) => console.error('Error syncing database:', err));

// MySQL connection
const db = mysql.createConnection({
  host: "localhost",
  user: "gmail_user",
  password: "your_password",
  database: "gmail_imap",
});

db.connect((err) => {
  if (err) console.error("DB connection error:", err);
  else console.log("Connected to MySQL!");
});

app.post('/save-user', (req, res) => {
  const { email, name } = req.body;
  db.query('INSERT INTO users (email, name) VALUES x ,y)', [email, name], (err) => {
      if (err) res.status(500).json({ error: err.message });
      res.status(200).json({ message: 'User saved!' });
  });
});

app.get('/auth/google', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.readonly'],
  });
  res.redirect(authUrl);
});

app.get('/callback', async (req, res) => {
  const { code } = req.query;

  try {
    // Exchange the code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Retrieve the user's profile information from Google
    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: 'v2',
    });

    const userInfo = await oauth2.userinfo.get();
    const { email, name } = userInfo.data;

    console.log('User Info:', userInfo.data);
    console.log('Access Tokens:', tokens);

    // Save the user info and tokens into the database
    const query = `
      INSERT INTO users (email, name, access_token, refresh_token) 
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
      access_token = VALUES(access_token),
      refresh_token = VALUES(refresh_token);
    `;

    db.query(
      query,
      [email, name, tokens.access_token, tokens.refresh_token],
      (err, results) => {
        if (err) {
          console.error('Error saving user to DB:', err);
          return res.status(500).send('Database error');
        }

        console.log('User saved/updated successfully:', results);
        res.send('Authentication successful! You can now fetch emails.');
      }
    );
  } catch (error) {
    console.error('Error during callback:', error);
    res.status(400).send('Error retrieving access token');
  }
});

// Helper function to refresh access token
const refreshAccessToken = async () => {
  oauth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });
  const { credentials } = await oauth2Client.refreshAccessToken();
  process.env.ACCESS_TOKEN = credentials.access_token;
  return credentials.access_token;
};

// Function to connect to Gmail IMAP and fetch emails
const getEmails = async () => {
  // let accessToken = process.env.ACCESS_TOKEN;

  // Refresh token if needed
  // if (!accessToken) {
    accessToken = await refreshAccessToken();
  // }

  const imapConfig = {
    imap: {
      user: 'unionjaffna@gmail.com', 
      password: '754968675',

      // xoauth2: Buffer.from(
      //   `user=unionjaffna@gmail.com\x01auth=Bearer ${accessToken}\x01\x01`
      // ).toString('base64'),
      authTimeout: 3000,  
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
    },
  };

  return new Promise((resolve, reject) => {
    Imap.connect(imapConfig)
      .then((connection) => {
        return connection.openBox('INBOX').then(() => {
          const searchCriteria = ['ALL']; // Fetch all emails
          const fetchOptions = {
            bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)'],
            struct: true,
          };

          return connection.search(searchCriteria, fetchOptions);
        });
      })
      .then((messages) => {
        const emailData = messages.map((msg) => {
          const headers = msg.parts.find((part) => part.which === 'HEADER.FIELDS (FROM TO SUBJECT DATE)');
          return {
            from: headers.body.from[0],
            to: headers.body.to ? headers.body.to[0] : 'N/A',
            subject: headers.body.subject[0],
            date: headers.body.date[0],
          };
        });

        resolve(emailData);
      })
      .catch((err) => {
        console.error('IMAP Connection Error:', err);
        reject(err);
      });
  });
};

// API route to get emails
app.get('/api/emails', async (req, res) => {
  try {
    const emails = await getEmails();
    res.json(emails);
  } catch (error) {
    console.error('Error fetching emails:', error);
    res.status(500).json({ message: error });
  }
});

app.listen(port, () => console.log(`Server is running on port ${port}`));