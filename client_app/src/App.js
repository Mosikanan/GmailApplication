import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EmailList = () => {
  const [emails, setEmails] = useState([]);
  const [authUrl, setAuthUrl] = useState('');

  const handleLogin = async () => {
    console.log('pressed')
    try {
      
      window.location.href = 'http://localhost:500/auth/google';

    } catch (error) {
      console.error('Error triggering Google OAuth2 login:', error);
    }
  };

  // Fetch emails after the user logs in
  useEffect(() => {
    // Make sure user is authenticated before fetching emails
    axios.get('http://localhost:5000/auth/google')
      .then(response => setEmails(response.data))
      .catch(error => console.error('Error fetching emails:', error));
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Emails</h1>
      {/* Show Login Button if not logged in */}
      <button 
        onClick={handleLogin} 
        className="bg-blue-500 text-white p-2 rounded mt-4"
      >
        Login with Google
      </button>
      {/* Display Emails once fetched */}
      <div className="mt-4">
        {emails.length === 0 ? (
          <p>Please login to see your emails.</p>
        ) : (
          emails.map(email => (
            <div key={email.id} className="border-b py-2">
              <h2 className="text-xl">{email.subject}</h2>
              <p>{email.sender}</p>
              <p className="text-sm">{email.timestamp}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default EmailList;
