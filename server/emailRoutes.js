// const express = require('express');
// const router = express.Router();
// const Email = require('./emailModel'); // Your Sequelize Email model

// // Route to get all emails
// router.get('/emails', async (req, res) => {
//   try {
//     const emails = await Email.findAll({
//       attributes: ['emailId', 'senderEmail', 'senderName', 'subject', 'timestamp', 'snippet'],
//     });
//     res.status(200).json({ success: true, data: emails });
//   } catch (error) {
//     console.error('Error fetching emails:', error);
//     res.status(500).json({ success: false, message: 'Error fetching emails' });
//   }
// });

// module.exports = router;
