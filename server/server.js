const express = require('express'); 
const Imap = require('imap-simple'); 
const dotenv = require('dotenv'); 
const mysql = require("mysql2"); 
const { OAuth2Client } = require('google-auth-library'); 
const path = require('path'); 
const { google } = require('googleapis');
// const emailRoutes = require('./emailRoutes'); // Import the email routes
const router = express.Router();
const cors = require('cors');


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
app.use(cors());

sequelize
  .sync({ alter: true,}) // Use `force: true` to reset the database during development
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
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    console.log('Access Tokens:', tokens);

    // try {
    //    // Step 4: Get user profile data
    //        const oauth2 = google.oauth2({
    //         version: 'v2',
    //         auth: oauth2Client,
    //       });

    //       // Fetch the user's profile info
    //       const userInfo = await oauth2.userinfo.v2.me.get();

    //       // Step 5: Display user data (or store it)
    //       console.log('User Info:', userInfo.data);
    //       return;
    // } catch (error) {
    //   console.log('error in ctch',error)
    // }

    // Store tokens securely in a database (not implemented here)
    process.env.ACCESS_TOKEN = tokens.access_token;
    process.env.REFRESH_TOKEN = tokens.refresh_token;

    // const query = `
    //   INSERT INTO users (email, name, access_token, refresh_token) 
    //   VALUES (?, ?, ?, ?)
    //   ON DUPLICATE KEY UPDATE 
    //   access_token = VALUES(access_token),
    //   refresh_token = VALUES(refresh_token);
    // `;

    // db.query(
    //   query,
    //   [email, name, tokens.access_token, tokens.refresh_token],
    //   (err, results) => {
    //     if (err) {
    //       console.error('Error saving user to DB:', err);
    //       return res.status(500).send('Database error');
    //     }

    //     console.log('User saved/updated successfully:', results);
    //     res.send('Authentication successful! You can now fetch emails.');
    //   }
    // );
    res.redirect('http://localhost:500/api/emails');

    // res.send('Authentication successful! You can now fetch emails.');
    
  } catch (error) {
    console.error('Error retrieving access token:', error);
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
  let accessToken = process.env.ACCESS_TOKEN;

  // Refresh token if needed
  if (!accessToken) {
    accessToken = await refreshAccessToken();
  }

  const imapConfig = {
    imap: {
      user: 'mosiknn@gmail.com',
      // password: 'Kannaplease123456789',
      password: 'nsto ynnj bqpx xnit',
      // xoauth2: Buffer.from(
      //   `user=mosiknn@gmail.com\x01auth=Bearer ${accessToken}\x01\x01`
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
          console.log('messgesss', msg);
          const headers = msg.parts?.body || {};
          // const headers = msg.parts.find((part) => part.which === 'HEADER.FIELDS (FROM TO SUBJECT DATE)');
          console.log('messgesss morrrrs',msg.attributes.uid);

          const attributes = msg.attributes;
      
          const emailData = {
            emailId: attributes['x-gm-msgid'], // Use x-gm-msgid as a unique email ID
            senderEmail: headers.from || 'Unknown Sender', // Extract sender email
            senderName: headers.from || 'Unknown Sender', // Optionally split sender email to extract the name
            subject: headers.subject || 'No Subject', // Extract subject
            timestamp: '2012-10-21T08:59:28.000Z', // Use attributes.date for timestamp
            snippet: headers.snippet || 'No Snippet', // If there's a snippet available
            userId: 1, // Set the appropriate userId if applicable
          };
      
          // Save email to the database
         Email.create(emailData);

          
        });
        
 
        resolve(emailData);

      })
      .catch((err) => {
        console.error('IMAP Connection Error:', err);
        reject(err);
      });
  });
};

// Use the email routes
// app.use('/apiSaved', emailRoutes);

app.get('/emails', async (req, res) => {
  try {
    const emails = await Email.findAll({
      attributes: ['emailId', 'senderEmail', 'senderName', 'subject', 'timestamp', 'snippet'],
    });
    res.status(200).json({ success: true, data: emails });
    // console.log(emails);
  } catch (error) {
    console.error('Error fetching emails:', error);
    res.status(500).json({ success: false, message: 'Error fetching emails' });
  }
});

// API route to get emails
app.get('/api/emails', async (req, res) => {
  try {
    const emails = await getEmails();
    res.redirect('http://localhost:500/emails');

    // res.json(emails);
  } catch (error) {
    console.error('Error fetching emails:', error);
    res.status(500).json({ message: error });
  }
});

app.listen(port, () => console.log(`Server is running on port ${port}`));