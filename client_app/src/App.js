import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { GoogleOAuthProvider, GoogleLogin, useGoogleLogin } from "@react-oauth/google";


const EmailList = () => {
  const [emails, setEmails] = useState([]);
  const [authUrl, setAuthUrl] = useState('');

  const handleLogin = async () => {
    console.log('pressed')
    try {
      getAllMails();
      // return;
      window.location.href = 'http://localhost:500/auth/google';

    } catch (error) {
      console.error('Error triggering Google OAuth2 login:', error);
    }
  };

  const getAllMails = () => {
    axios.get('http://localhost:500/emails')
      .then(response =>
        console.log(response.data),)
      .catch(error => console.error('Error fetching emails:', error));
  };


const googleLogin = useGoogleLogin({
  // flow: 'auth-code',
  onSuccess: async (tokenResponse) => {
      console.log(tokenResponse);
      // const tokens = await axios.post(
      //     'http://localhost:3001/auth/google', {
      //         code: codeResponse.code,
      //     });

      // console.log(tokens);
       
    try {
      // Wait for the response before logging it
      const response = await axios.post('http://localhost:500/auth/googleLogin', {
        credential: tokenResponse, // Send token to backend
      });
  
      console.log('User authenticated successfully:', response.data);
    } catch (error) {
      console.error('Error during login:', error);
    }
  },
  onError: errorResponse => console.log(errorResponse),
});

  const handleSuccess = async (tokenResponse) => {
    console.log("Login Success:", tokenResponse);
    const token = tokenResponse.credential;
    
    try {
      // Wait for the response before logging it
      const response = await axios.post('http://localhost:500/auth/googleLogin', {
        credential: token, // Send token to backend
      });
  
      console.log('User authenticated successfully:', response.data);
    } catch (error) {
      console.error('Error during login:', error);
    }
    // Use the token for backend validation or user data retrieval
  };

  const handleFailure = () => {
    console.error("Login Failed");
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Get Emails</h1>
      {/* Show Login Button if not logged in */}
      
      {/* Display Emails once fetched */}
      <div className="mt-4">
          <div>
          <button
        onClick={googleLogin}
        className="bg-blue-500 text-white p-2 rounded mt-4"
      >
        Login with Google
      </button>
          </div>
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
