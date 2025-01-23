import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EmailList = () => {
  const [emails, setEmails] = useState([]);

  useEffect(() => {
    // Fetch emails from backend
    axios.get('/api/emails')
      .then(response => setEmails(response.data))
      .catch(error => console.error('Error fetching emails:', error));
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Emails</h1>
      <div className="mt-4">
        {emails.map(email => (
          <div key={email.id} className="border-b py-2">
            <h2 className="text-xl">{email.subject}</h2>
            <p>{email.sender}</p>
            <p className="text-sm">{email.timestamp}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmailList;
