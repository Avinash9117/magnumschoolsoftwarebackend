// Import required libraries and modules
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const executeQuery = require('./dbconnect');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Initialize the express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware to handle CORS and parse JSON body
app.use(cors());
app.use(bodyParser.json());

// MySQL Connection Configuration
const connection = mysql.createConnection({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'Avinash143@', // Use your MySQL password here
  database: 'schooldb', // Ensure the database name is correct
});

// Connect to the MySQL database
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err.stack);
    return;
  }
  console.log('Connected to MySQL');
});

// Sample route for user signup (Storing plain-text password)
app.post('/api/signup', async (req, res) => {
  const { username, email, password, role } = req.body;

  try {
    // Check if the user already exists by username or email
    const existingUser = await executeQuery.executeQuery(
      'SELECT * FROM login WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Insert the new user into the database (No password hashing here)
    await executeQuery.executeQuery(
      'INSERT INTO login (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email, password, role] // Store plain-text password
    );

    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Sample route for user login (Plain-text password comparison)
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Query to fetch the user by username
    const results = await executeQuery.executeQuery('SELECT * FROM login WHERE username = ?', [username]);

    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = results[0];

    // Directly compare the plain-text password with the stored one
    if (password === user.password) {
      // Generate a JWT token and include the role
      const token = jwt.sign({ id: user.user_id, role: user.role }, 'your_secret_key', { expiresIn: '1h' });

      // Respond with the token, username, and role
      res.json({
        token,
        username: user.username,
        role: user.role, // Send the role back as well
      });
    } else {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (err) {
    console.error('Error in login API:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Middleware to authenticate JWT token and check user role
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Extract token from the header

  if (!token) {
    return res.status(403).json({ message: 'Access denied. No token provided.' });
  }

  jwt.verify(token, 'your_secret_key', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next(); // Proceed to the next middleware or route handler
  });
};

// Middleware to check role for protected routes
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }
    next(); // Proceed if the role matches
  };
};

// Example of a protected route for the admin
app.get('/api/admin-dashboard', authenticateToken, checkRole(['admin']), (req, res) => {
  res.json({ message: 'Welcome to the Admin Dashboard' });
});

// Example of a protected route for the student
app.get('/api/student-dashboard', authenticateToken, checkRole(['student']), (req, res) => {
  res.json({ message: 'Welcome to the Student Dashboard' });
});

// Example of a protected route for the teacher
app.get('/api/teacher-dashboard', authenticateToken, checkRole(['teacher']), (req, res) => {
  res.json({ message: 'Welcome to the Teacher Dashboard' });
});

// Example of a protected route for the parent
app.get('/api/parent-dashboard', authenticateToken, checkRole(['parent']), (req, res) => {
  res.json({ message: 'Welcome to the Parent Dashboard' });
});


// ----------------------------------------------

// Set up storage for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Adding timestamp to avoid overwriting
  },
});

const upload = multer({ storage: storage });

// Middleware to handle JSON requests
app.use(express.json());

// Serve static files from the 'uploads' directory
app.use("/uploads", express.static("uploads")); 



// ----------------------------------------------------------------------------------------------------------


app.get('/api/studentsCount', async (req, res) => {
  try {
    // Fetch total number of students by gender
    const query = `
      SELECT gender, COUNT(*) AS count 
      FROM students 
      GROUP BY gender;
    `;
    const result = await executeQuery.executeQuery(query);
    res.status(200).json({ result });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Error fetching students.' });
  }
});


app.get('/api/studentsCount', async (req, res) => {
  try {
    const query = "SELECT gender, COUNT(*) AS count FROM students GROUP BY gender";
    console.log(query);
    
    const result = await executeQuery.executeQuery(query);
    console.log(result);

    // Format the result into male and female counts
    const maleCount = result.find(row => row.gender === 'Male')?.count || 0;
    const femaleCount = result.find(row => row.gender === 'Female')?.count || 0;

    res.status(200).json({
      result: [
        { gender: 'Male', count: maleCount },
        { gender: 'Female', count: femaleCount },
      ]
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Error fetching students.' });
  }
});

app.get('/api/teachersCount', async (req, res) => {
  try {
    const query = "SELECT COUNT(*) AS count FROM teachers";
    const result = await executeQuery.executeQuery(query);
    res.status(200).json({ result });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({ message: 'Error fetching teachers.' });
  }
});


app.get('/api/parentsCount', async (req, res) => {
  try {
    const query = "SELECT COUNT(*) AS count FROM parents";
    const result = await executeQuery.executeQuery(query);
    res.status(200).json({ result });
  } catch (error) {
    console.error('Error fetching parents:', error);
    res.status(500).json({ message: 'Error fetching parents.' });
  }
});



app.get('/api/earningsCount', async (req, res) => {
  try {
    const query = "SELECT SUM(amount) AS count FROM expenses";
    const result = await executeQuery.executeQuery(query);
    res.status(200).json({ result: result[0] });
  } catch (error) {
    console.error('Error fetching earnings count:', error);
    res.status(500).json({ message: 'Error fetching earnings count.' });
  }
});




// teacher examslist Endpoint to get the list of exams
app.get('/api/examlist', async (req, res) => {
  try {
    // Query to fetch all exam details from the exam_schedule table
    const query = "SELECT * FROM exam_schedule";
    console.log(query);
    
    const result = await executeQuery.executeQuery(query); // Execute the query
    
    console.log(result); // Log the result for debugging
    
    res.status(200).json(result); // Return the exam list data
  } catch (error) {
    console.error('Error fetching examlist:', error);
    res.status(500).json({ message: 'Error fetching examlist.' });
  }
});

app.get('/api/notification', async (req, res) => {
  try {
    // Query to fetch all exam details from the notification table
    const query = "SELECT * FROM notices";
    console.log(query);
    
    const result = await executeQuery.executeQuery(query); // Execute the query
    
    console.log(result); // Log the result for debugging
    
    res.status(200).json(result); // Return the exam list data
  } catch (error) {
    console.error('Error fetching notification:', error);
    res.status(500).json({ message: 'Error fetching notification.' });
  }
});


// Endpoint to add teacher data
app.post('/api/addTeacher', upload.single('photo'), async (req, res) => {
  const { firstName, lastName, gender, dob, idNumber, bloodGroup, religion, email, phoneNumber, address, classname, section, shortBio } = req.body;

  // Save the uploaded photo's path
  const photoPath = req.file ? req.file.path : null;

  try {
    // Insert teacher data into the database
    const query = `
      INSERT INTO teachers (firstName, lastName, gender, dob, idNumber, bloodGroup, religion, email, phoneNumber, address, classname, section, shortBio, photo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      firstName, lastName, gender, dob, idNumber, bloodGroup, religion, email, phoneNumber, address, classname, section, shortBio, photoPath,
    ];
    
    await executeQuery.executeQuery(query, values);

    res.status(200).json({ message: 'Teacher added successfully!' });
  } catch (error) {
    console.error('Error adding teacher:', error);
    res.status(500).json({ message: 'Error adding teacher.' });
  }
});

// Endpoint to get all teachers
app.get('/api/getTeachers', async (req, res) => {
  try {
    const query = 'SELECT id, CONCAT(firstName, lastName) AS name, gender, classname, section, address, phoneNumber, email, photo FROM teachers';
    const teachers = await executeQuery.executeQuery(query);
    res.status(200).json({ teachers });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({ message: 'Error fetching teachers.' });
  }
});



// API route to add student data
app.post('/api/addStudent', upload.single('photo'), async (req, res) => {
  const { firstName, lastName, gender, dob, Roll, bloodGroup, religion, email, Class, section, Admission, phoneNumber, shortBio } = req.body;

  // Save the uploaded student's photo path
  const photoPath = req.file ? req.file.path : null;

  // SQL query to insert student data into 'students' table
  const query = `
    INSERT INTO students (firstName, lastName, gender, dob, Roll, bloodGroup, religion, email, Class, section, Admission, phoneNumber, shortBio, photo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    firstName, lastName, gender, dob, Roll, bloodGroup, religion, email, Class, section, Admission, phoneNumber, shortBio, photoPath,
  ];

  connection.query(query, values, (err, result) => {
    if (err) {
      console.error('Error adding student:', err);
      return res.status(500).json({ message: 'Error adding student' });
    }
    res.status(200).json({ message: 'Student added successfully!' });
  });
});

// Endpoint to get all students
app.get('/api/getStudents', async (req, res) => {
  try {
    const query = `
      SELECT id, CONCAT(firstName, ' ', lastName) AS name, Roll, gender, Class, section, admission, phoneNumber, email, photo FROM students
    `;
    connection.query(query, (err, result) => {
      if (err) {
        console.error('Error fetching students:', err);
        return res.status(500).json({ message: 'Error fetching students.' });
      }
      res.status(200).json({ students: result });
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Error fetching students.' });
  }
});

// POST route to add parent data
app.post('/api/addParent', upload.single('photo'), async (req, res) => {
  const { firstName, lastName, gender, occupation, idNumber, bloodGroup, religion, email, phoneNumber, address, shortBio } = req.body;
  const photoPath = req.file ? req.file.path : null;

  const query = `
    INSERT INTO parents (firstName, lastName, gender, occupation, idNumber, bloodGroup, religion, email, phoneNumber, address, shortBio, photo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    firstName, lastName, gender, occupation, idNumber, bloodGroup, religion, email, phoneNumber, address, shortBio, photoPath,
  ];

  connection.query(query, values, (err, result) => {
    if (err) {
      console.error('Error adding parent:', err);
      return res.status(500).json({ message: 'Error adding parent' });
    }
    res.status(200).json({ message: 'Parent added successfully!' });
  });
});

// GET route to retrieve all parents data
app.get('/api/getParents', async (req, res) => {
  try {
    const query = `
      SELECT id, CONCAT(firstName, ' ', lastName) AS name, occupation, phoneNumber, email, photo FROM parents
    `;
    connection.query(query, (err, result) => {
      if (err) {
        console.error('Error fetching parents:', err);
        return res.status(500).json({ message: 'Error fetching parents.' });
      }
      res.status(200).json({ parents: result });
    });
  } catch (error) {
    console.error('Error fetching parents:', error);
    res.status(500).json({ message: 'Error fetching parents.' });
  }
});







// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
