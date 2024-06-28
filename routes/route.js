// routes/users.js
const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/UserSchema");
const jwt = require("jsonwebtoken");
const Ticket = require("../models/TicketSchema");
const chatController = require("../controllers/chatController");

// Define JWT secret key directly
const jwtSecret =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"; // Replace with your actual secret key

const router = express.Router();

router.post("/register", async (req, res) => {
  const { firstName, lastName, email, password, phone, role } = req.body;

  try {
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ errors: [{ msg: "User already exists" }] });
    }

    const newUser = new User({
      firstName,
      lastName,
      email,
      password,
      phone,
      role: role || 0, // default to regular user (role 0) if not provided
      profileImage: "", // default profile image
    });

    await newUser.save();

    // Respond with a JSON object
    res.json({ message: "User registered successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ errors: [{ msg: "Invalid credentials" }] });
    }

    // Compare input password with hashed password in the database
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ errors: [{ msg: "Invalid credentials" }] });
    }

    // Create JWT payload
    const payload = {
      user: {
        id: user.id,
      },
    };

    // Sign the token with an expiration of 30 days
    jwt.sign(
      payload,
      jwtSecret,
      { expiresIn: "30d" }, // Token expires in 30 days
      (err, token) => {
        if (err) throw err;
        res.json({ token, userId: user.id, role: user.role });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// Route to get user data based on JWT token
router.get("/user", async (req, res) => {
  try {
    // Extract token from request headers
    const token = req.header("x-auth-token");

    if (!token) {
      return res.status(401).json({ msg: "No token, authorization denied" });
    }

    // Verify token
    const decoded = jwt.verify(token, jwtSecret);

    // Fetch user from database using decoded user id
    const user = await User.findById(decoded.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

router.put("/update", async (req, res) => {
  const { firstName, lastName, email, phone, profileImage, userId } = req.body;

  if (!firstName || !lastName || !email || !phone || !userId) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        firstName,
        lastName,
        email,
        phone,
        profileImage, // base64 encoded image
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/create", async (req, res) => {
  const { title, subtitle, issueDescription, userId, attachedFiles } = req.body;

  if (!title || !subtitle || !issueDescription || !userId) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const newTicket = new Ticket({
      title,
      subtitle,
      issueDescription,
      userId,
      attachedFiles, // Array of base64 encoded strings
    });

    const savedTicket = await newTicket.save();
    res.status(201).json(savedTicket);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// GET all tickets
router.get("/all", async (req, res) => {
  try {
    const tickets = await Ticket.find();
    res.status(200).json(tickets);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch tickets" });
  }
});

// Route to get tickets for a particular user
router.get("/tickets/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const tickets = await Ticket.find({ userId });

    if (!tickets.length) {
      return res
        .status(404)
        .json({ message: "No tickets found for this user" });
    }

    res.status(200).json(tickets);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Failed to fetch tickets" });
  }
});

router.get("/search", chatController.findPeople);
router.get("/conversation", chatController.getConversation);
router.get("/get-messages", chatController.getMessages);
router.get("/conversation-list", chatController.getConversationList);
router.post("/send-message", chatController.sendMessage);

module.exports = router;
