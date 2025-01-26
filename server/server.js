const express = require('express'); 
const Imap = require('imap-simple'); 
const dotenv = require('dotenv'); 
const mysql = require("mysql2"); 
const { OAuth2Client,GoogleAuth, auth } = require('google-auth-library'); 
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
app.use(express.json()); // This is the crucial part to handle JSON request bodies

sequelize
  .sync({ alter: true,force: true}) // Use `force: true` to reset the database during development
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


app.get('/auth/google', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.readonly'],
  });
  res.redirect(authUrl);
});

app.post('/auth/googleLogin', async (req, res) => {
  try {
    console.log('Incoming request body:', req.body); // Check if the body is properly parsed
    const { credential } = req.body; // Now you can access 'credential' from the body
    console.log('Credential:', credential);
    // const ticket = await oauth2Client.verifyIdToken({
    //   idToken: credential.access_token,
    //   audience: CLIENT_ID, // Your Google Client ID
    // });

    try {
      // Make a request to the Google User Info endpoint
      const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`,  // Include the access token in the authorization header
        },
      });
  
      // The response will contain user info
      console.log('User Info:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching user info:', error);
      throw new Error('Failed to get user info');
    }
    

    // const payload = ticket.getPayload();
  //  refresh_token: 1//0gyKLke34lX0-CgYIARAAGBASNwF-L9IrZRXJF00sD3fuspfIJodsTE7rS0NPKbgNJRDsOEPw06_J-HWQvwv4oaXUhdsZtcx8pcg
//     const auth = new GoogleAuth();
// const tokens = await auth.getAccessToken(credential)
    // const { tokens } = await oauth2Client.getToken(credential); // This retrieves the access token
    // oauth2Client.getToken(decodeURIComponent(credential), (err, token) => {
    //   if (err) {
    //     console.error('Error retrieving access token:', err);
    //     return;
    // }
    // });
    // console.log('ticket',ticket)

    // const tokens = await oauth2Client.getToken('eyJhbGciOiJSUzI1NiIsImtpZCI6IjYzMzdiZTYzNjRmMzgyNDAwOGQwZTkwMDNmNTBiYjZiNDNkNWE5YzYiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiIzNDQwNDIzNDIyNzItaHM0ZzU4cWppYjIzOTJ0NzBwaTdnNDQ4a3ZqNDM1YWwuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiIzNDQwNDIzNDIyNzItaHM0ZzU4cWppYjIzOTJ0NzBwaTdnNDQ4a3ZqNDM1YWwuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMDU5NjkxNDEyNzYzOTYyMDU2NjciLCJlbWFpbCI6Im1vc2lrbm5AZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsIm5iZiI6MTczNzc1MzYwMSwibmFtZSI6Ik1vc2lrYW5hbiBHbmFuYXNlZ2FyYW0iLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jSWtsSmMydUx3WU9UYWRWYmthUWlMUGlpcmRhWkRzWk5Vekg0QmNlOXdIS25ZTXloZUk9czk2LWMiLCJnaXZlbl9uYW1lIjoiTW9zaWthbmFuIiwiZmFtaWx5X25hbWUiOiJHbmFuYXNlZ2FyYW0iLCJpYXQiOjE3Mzc3NTM5MDEsImV4cCI6MTczNzc1NzUwMSwianRpIjoiNjhjOTFhOWNhOTRmZjgxOTU1NzJjNzE1OThjZTUxZDg3M2Q3YTBkOSJ9.z8w2ycPwj1cLgBMvX-KhuVioVmWnoRyBrsf2ZY2ymm7bczrc-Kl1NIbk2CAqxJKgsQUC-WGPwWB9XiEsfet4_m23fY1F5o4BBVHF6DTgkdKN1HthyMG-bOyClrJlZQ1YqWJSCjKySWXMBHQJ58lfDA3ICuV2EoSPacDF_prjzKOWNbsAgAZJzTvE3l1qvbfx_l_zmBbFd3ROlVgQ03PqGCxiRXzieos7xr7CAKVs8EOoLfUpv8PFB1bj3UzHnGY6PUfJEZaNAwrRU0o0PgO-Lp79WDtMGDhl67UUdtQPxyK4ort9UXvI6_eB-dYS6pnbNuDVG9UmGK_IdRbazQtRUw');
    // return
    // const { access_token: accessToken, refresh_token: refreshToken } = tokens;
    // console.log('tokens',payload);
    getEmails()

    return
    
    const { sub: googleId, email, name } = payload;

    // Store user data in the database using Sequelize's `findOrCreate` method
    const [user, created] = await User.findOrCreate({
      where: { googleId }, // Check if the user exists by googleId
      defaults: {
        email,
        name,
        // accessToken, // Store the access token in the database
        // refreshToken, // Store the refresh token in the database (optional)
      },
    });

    

    if (created) {
      console.log('New user created:', user);
    } else {
      console.log('User already exists:', user);
    }

    // Proceed with further authentication logic here
    res.status(200).json({ message: 'Login successful', response: payload });
  } catch (error) {
    console.error('Error during Google authentication:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

app.get('/callback', async (req, res) => {
  const { code } = req.query;
  console.log('code',req.query)
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
  // let accessToken = process.env.ACCESS_TOKEN;

  // // Refresh token if needed
  // if (!accessToken) {
  //   accessToken = await refreshAccessToken();
  // }

  const imapConfig = {
    imap: {
      user: 'mosiknn@gmail.com',
      scope: 'https://www.googleapis.com/auth/gmail.readonly',
      // password: 'Kannaplease123456789',
      // password: 'nsto ynnj bqpx xnit',
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
          const headers = msg.parts.find((part) => part.which === 'HEADER.FIELDS (FROM TO SUBJECT DATE)');
          
          const email = {
            emailId: msg.attributes['x-gm-msgid'], // Unique Gmail message ID
            senderEmail: headers.from || 'Unknown Sender', // Sender email
            subject: headers.subject || 'No Subject', // Subject of the email
            timestamp: headers.date || 'Unknown Date', // Timestamp
          };

          // Save email to DB
          Email.create(email); // Assuming Email is a Sequelize model
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