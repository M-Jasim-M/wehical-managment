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
const Wehical = require('./wehicalscheam');
const FuelingDetail = require('./fuelingscheama');
// const { log } = require('console');

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

    // Find the user by email and populate the 'wehical' field
    const user = await User.findOne({ email }).populate('wehical');
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

    // Send both token and user data (with populated wehical) to the frontend
    res.status(200).json({ message: 'Login successful', token, user });
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
    // user.resetPasswordToken = resetToken;
    // user.resetPasswordExpires = Date.now() + 600000; // Token expires in 10 minutes

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

// the login system compleated the api for the assisgn wehical

// Fetch all users from the database
app.get('/api/users', async (req, res) => {
  try {
    // Retrieve only client users from the database
    const clientUsers = await User.find({ isAdmin: 'client' });

    res.status(200).json(clientUsers);
  } catch (error) {
    console.error('Error fetching client users:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// the api for delet users
app.delete('/api/use/:id', async (req, res) => {
  const userId = req.params.id;
  console.log('Received user ID:', userId);

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  try {
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ message: 'User deleted successfully', user: deletedUser });
  } catch (error) {
    console.error('Error deleting user:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// this is the api for the assign wehical 

app.post('/api/assignwehical/:userId', async (req, res) => {
  const { vehicleType, plateNumber } = req.body;
  const userId = req.params.userId;
console.log(userId);
  try {
    // Check if the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create a new wehical
    const newWehical = new Wehical({
      vehicleType,
      plateNumber,
      // ... other wehical fields
    });

    // Save the wehical to the database
    await newWehical.save();

    // Update the user with the wehical reference
    user.wehical = newWehical._id;
    await user.save();

    res.status(200).json({ message: 'Wehical assigned successfully', user, wehical: newWehical });
  } catch (error) {
    console.error('Error assigning wehical:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// the api for the user and wehical data 

app.get('/users-with-wehical', async (req, res) => {
  try {
    // Populate the 'wehical' field in the user data for clients with assigned wehicals
    const clientsWithWehical = await User.find({ isAdmin: 'client', wehical: { $exists: true, $ne: null } }).populate('wehical');

    res.status(200).json(clientsWithWehical);
  } catch (error) {
    console.error('Error fetching clients with assigned wehicals:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.delete('/api/delete-wehical-from-user/:userId', async (req, res) => {
  const userId = req.params.userId;
console.log(userId);
  try {
    // Find the user by ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if the user has an associated wehical
    if (!user.wehical) {
      return res.status(404).json({ error: 'User does not have an associated wehical' });
    }

    // Get the wehical ID
    const wehicalId = user.wehical;

    // Remove the reference from the user
    user.wehical = undefined;
    await user.save();

    // Delete the wehical
    await Wehical.findByIdAndDelete(wehicalId);

    res.status(200).json({ message: 'Wehical deleted from user successfully', user });
  } catch (error) {
    console.error('Error deleting wehical from user:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// this is the api for the user 

// app.get('/api/userweh/:id', async (req, res) => {
//   try {
//     const userId = req.params.id;
//     console.log("this is "+userId);
//     const user = await User.findById(userId).populate('wehical');
//     res.status(200).json(user);
//   } catch (error) {
//     console.error('Error fetching user data:', error.message);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });
// app.get('/api/userweh/:id', async (req, res) => {
//     try {
//         const userId = req.params.id;
//         console.log("this is " + userId);

//         // Populate both 'wehical' and 'fuelHistory' fields
//         const user = await User.findById(userId).populate('wehical').populate('fuelHistory');

//         res.status(200).json(user);
//     } catch (error) {
//         console.error('Error fetching user data:', error.message);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// });

app.get('/api/userweh/:id', async (req, res) => {
    try {
        const userId = req.params.id;
console.log(userId);
        const user = await User.findById(userId)
            .populate('wehical')
            .populate('fuelHistory');

        res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching user data:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});
;


// Assuming you have a route for adding fueling data
app.post('/api/fueling/add-fueling/:userId', upload.single('image'), async (req, res) => {
  const userId = req.params.userId;
  console.log(userId);

  try {
      const {
          wehicalId, // Assuming you have the wehical ID from the frontend
          stationName,
          pricePerLiter,
          totalLiters,
          totalPrice,
          location,
          date,
      } = req.body;
console.log(req.body);
      // Check if the user exists
      const user = await User.findById(userId);
      if (!user) {
          return res.status(404).json({ error: 'User not found' });
      }

      // Check if the wehical exists
      const wehical = await Wehical.findById(wehicalId);
      if (!wehical) {
          return res.status(404).json({ error: 'Wehical not found' });
      }

      // Create a new FuelingDetail instance
      const newFuelingDetail = new FuelingDetail({
          user: userId, // Reference to the user
          wehical: wehicalId, // Reference to the wehical
          stationName,
          pricePerLiter,
          totalLiters,
          totalPrice,
          location,
          date,
          image: req.file.filename, // Save the filename in the database
      });

      // Save the new fueling detail
      await newFuelingDetail.save();

      // Update the user's fuelHistory array with the new FuelingDetail ID
      user.fuelHistory.push(newFuelingDetail._id);
      await user.save();

      res.status(201).json({ message: 'Fueling data saved successfully', user });
  } catch (error) {
      console.error('Error saving fueling data:', error.message);
      res.status(500).json({ error: 'Internal server error' });
  }
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
