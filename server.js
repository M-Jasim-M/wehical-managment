const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const cors = require('cors');
const multer = require('multer');
const app = express();
const port = process.env.PORT || 3000;
const User = require('./schema');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { log } = require('console');

app.use(cors());
app.use(express.json())
app.use('/uploads', express.static('uploads'));

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB Atlas');
})
.catch((err) => {
  console.error('Error connecting to MongoDB Atlas:', err.message);
});

const storage = multer.diskStorage({
    destination: 'uploads/', // Store uploaded images in the 'uploads' directory
    filename: function (req, file, cb) {
      cb(null, file.originalname);
    },
  });
  const upload = multer({ storage });

// this is the api for login the user

app.post('/api/create', upload.single('image'), async (req, res) => {
  try {
    const { name, email, password, phoneNumber, isAdmin } = req.body;
console.log(req.body);
    // Check if the email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    const file = req.file;
    const imageName = file.originalname;

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user with the hashed password
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      phoneNumber,
      image: imageName,
      isAdmin: isAdmin ,
    });

    await newUser.save();

    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error creating user:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// the api for the login users

app.post('/api/login', async (req, res) => {
  try {
    const { email, password, userType } = req.body;
console.log(req.body);
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Compare the provided password with the stored hashed password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Create a JWT token
    const token = jwt.sign({ userId: user._id, userType }, 'yourSecretKey', { expiresIn: '1h' });

    // Send both token and user data to the frontend
    res.status(200).json({ message: 'Login successful', token, user });
console.log(token);
  } catch (error) {
    console.error('Error during login:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// reset pasward apis for the login system


// app.post('/api/reset-password', async (req, res) => {
//   try {
//     const { email } = req.body;
// console.log(req.body);
//     // Find the user by email
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     // Generate a reset token
//     const resetToken = crypto.randomBytes(20).toString('hex');
    
//     // Set the reset token and expiration time in the user document
//     user.resetPasswordToken = resetToken;
//     user.resetPasswordExpires = Date.now() + 3600000; // Token expires in 1 hour

//     // Save the user document with the reset token
//     await user.save();

//     // Send the reset token to the user's email
//     const transporter = nodemailer.createTransport({
//       host: 'smtp.gmail.com',
//       port: 587, // Use port 587 for TLS (587 is the standard port for secure SMTP)
//       secure: false,
//       auth: {
//         user: 'webdeveloper4888@gmail.com', // Change to your email address
//         pass: 'ltiaryitzoskbjbj', // Change to your email password
//       },
//     });
//     const resetLink = `http://localhost:3000/newpasward?token=${resetToken}`;
//     const mailOptions = {
//       from: 'webdeveloper4888@gmail.com',
//       to: user.email,
//       subject: 'Password Reset',
//       text: `To reset your password, click on the following link: ${resetLink}`,
//     };

//     await transporter.sendMail(mailOptions);

//     res.status(200).json({ message: 'Password reset email sent successfully' });
//   } catch (error) {
//     console.error('Error during password reset request:', error.message);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });
app.post('/api/reset-password', async (req, res) => {
  try {
    const { email } = req.body;
console.log(req.body);
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate a short-lived reset token
    const resetToken = jwt.sign({ userId: user._id }, 'yourSecretKey', { expiresIn: '10m' });

    // Set the reset token and expiration time in the user document
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 600000; // Token expires in 10 minutes

    // Save the user document with the reset token and reset link
    await user.save();

    // Send the reset token to the user's email
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587, // Use port 587 for TLS (587 is the standard port for secure SMTP)
      secure: false,
      auth: {
        user: 'webdeveloper4888@gmail.com', // Change to your email address
        pass: 'ltiaryitzoskbjbj', // Change to your email password
      },
    });
    const resetLink = `http://localhost:3000/newpasward?token=${resetToken}`;
    const mailOptions = {
      from: 'webdeveloper4888@gmail.com',
      to: user.email,
      subject: 'Password Reset',
      text: `To reset your password, click on the following link: ${resetLink}`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Password reset email sent successfully' });
  } catch (error) {
    console.error('Error during password reset request:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/new-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    console.log(req.body);

    // Decode the reset token to extract the user ID
    const decodedToken = jwt.verify(token, 'yourSecretKey');
    const userId = decodedToken.userId;
console.log(userId);
    // Find the user by the decoded user ID
    const user = await User.findById(userId);

    if (!user) {
      console.error('User not found for reset token:', token);
      return res.status(401).json({ error: 'Invalid reset token' });
    }

    // Update the user's password
    user.password = await bcrypt.hash(newPassword, 10);

    // Clear the reset token fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    // Save the updated user document
    await user.save();

    console.log('Password reset successful');

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Error resetting password:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});





app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
