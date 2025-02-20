// Import required libraries and modules
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs'); // For hashing passwords
const jwt = require('jsonwebtoken'); // For JWT authentication
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

// Set up storage for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // File will be saved in 'uploads' directory
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Adding timestamp to avoid overwriting
  },
});

const upload = multer({ storage: storage });

// Middleware to serve static files from the 'uploads' directory
app.use('/uploads', express.static('uploads'));

// -----------------------------------------------------------
// Helper function to check if the username starts with valid initial
const isValidUsername = (username) => {
  const validInitials = ['A', 'P', 'T', 'S'];  // Allowed initials
  const firstChar = username.charAt(0).toUpperCase();
  return validInitials.includes(firstChar);
};

// Sample route for user signup (Storing plain text password)
app.post('/api/signup', async (req, res) => {
  const { username, email, password, role } = req.body;

  // Validate username's first character
  if (!isValidUsername(username)) {
    return res.status(400).json({ message: 'Username must start with A (Admin), P (Parent), T (Teacher), or S (Student)' });
  }

  // Generate the initial based on the role
  let userInitial = '';
  switch (role) {
    case 'admin':
      userInitial = 'A';
      break;
    case 'student':
      userInitial = 'S';
      break;
    case 'teacher':
      userInitial = 'T';
      break;
    case 'parent':
      userInitial = 'P';
      break;
    default:
      userInitial = 'U'; // Default to 'U' if role is not recognized
  }

  try {
    const existingUser = await executeQuery.executeQuery(
      'SELECT * FROM login WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Store the plain password directly in the database (not hashed)
    const plainPassword = password;  // Plain password

    // Insert the new user into the database with the plain password and the initial
    await executeQuery.executeQuery(
      'INSERT INTO login (username, email, password, role, user_initial) VALUES (?, ?, ?, ?, ?)',
      [username, email, plainPassword, role, userInitial]
    );

    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Sample route for user login (Using JWT for authentication)
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  // Validate username's first character
  if (!isValidUsername(username)) {
    return res.status(400).json({ message: 'Username must start with A (Admin), P (Parent), T (Teacher), or S (Student)' });
  }

  try {
    // Check if the user exists in the database
    const [user] = await executeQuery.executeQuery(
      'SELECT * FROM login WHERE username = ?',
      [username]
    );

    if (!user) {// Sample route for user signup
app.post('/api/signup', async (req, res) => {
  const { username, email, password, role } = req.body;

  // Validate username's first character
  if (!isValidUsername(username)) {
    return res.status(400).json({ message: 'Username must start with A (Admin), P (Parent), T (Teacher), or S (Student)' });
  }

  // Generate the initial based on the role
  let userInitial = '';
  switch (role) {
    case 'admin':
      userInitial = 'A';
      break;
    case 'student':
      userInitial = 'S';
      break;
    case 'teacher':
      userInitial = 'T';
      break;
    case 'parent':
      userInitial = 'P';
      break;
    default:
      userInitial = 'U'; // Default to 'U' if role is not recognized
  }

  try {
    const existingUser = await executeQuery.executeQuery(
      'SELECT * FROM login WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Store the plain password directly in the database (not hashed)
    const plainPassword = password;

    // Insert the new user into the database with the plain password and the initial
    await executeQuery.executeQuery(
      'INSERT INTO login (username, email, password, role, user_initial) VALUES (?, ?, ?, ?, ?)',
      [username, email, plainPassword, role, userInitial]
    );

    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Sample route for user login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  // Validate username's first character
  if (!isValidUsername(username)) {
    return res.status(400).json({ message: 'Username must start with A (Admin), P (Parent), T (Teacher), or S (Student)' });
  }

  try {
    // Check if the user exists in the database
    const [user] = await executeQuery.executeQuery(
      'SELECT * FROM login WHERE username = ?',
      [username]
    );

    if (!user) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    // Compare the entered password with the plain password stored in the database
    if (password !== user.password) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    // Generate a JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role, userInitial: user.user_initial },
      'your_jwt_secret_key',
      { expiresIn: '1h' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      role: user.role,
      userInitial: user.user_initial,
    });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

      return res.status(400).json({ message: 'Invalid username or password' });
    }

    // Compare the entered password with the plain password stored in the database
    if (password !== user.password) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    // Generate a JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role, userInitial: user.user_initial },
      'your_jwt_secret_key', // Use a secret key from environment variable or .env file
      { expiresIn: '1h' } // Token expiration set to 1 hour (can adjust as needed)
    );

    res.status(200).json({
      message: 'Login successful',
      token, // Send the JWT token in the response
      role: user.role, // Send the user's role with the response
      userInitial: user.user_initial, // Send the user's initial with the response
    });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Middleware to protect routes (JWT Authentication)
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Get token from Authorization header

  if (!token) {
    return res.status(403).json({ message: 'No token provided, authorization denied' });
  }

  jwt.verify(token, 'your_jwt_secret_key', (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Token is not valid' });
    }

    req.user = decoded; // Attach user info to request object
    next(); // Proceed to the next middleware or route handler
  });
};

// Example of a protected route
app.get('/api/protected', verifyToken, (req, res) => {
  res.status(200).json({ message: 'You have access to this route', user: req.user });
});
// -----------------------------------------------------------

// -----------------------------------------------------------
// Endpoint to add teacher data
// Endpoint to add a new teacher
app.post('/api/addTeacher', upload.single('photo'), async (req, res) => {
  const { firstName, lastName, gender, dob, employeeId, bloodGroup, religion, email, phoneNumber, address, classname, section, shortBio } = req.body;

  // Save the uploaded photo's path
  const photoPath = req.file ? req.file.path : null;

  try {
    const query = `
      INSERT INTO teachers (firstName, lastName, gender, dob, employeeId, bloodGroup, religion, email, phoneNumber, address, classname, section, shortBio, photo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      firstName, lastName, gender, dob, employeeId, bloodGroup, religion, email, phoneNumber, address, classname, section, shortBio, photoPath,
    ];
    
    await executeQuery.executeQuery(query, values);
    res.status(200).json({ message: 'Teacher added successfully!' });
  } catch (error) {
    console.error('Error adding teacher:', error);
    res.status(500).json({ message: 'Error adding teacher.' });
  }
});

// Endpoint to get all teachers with correct photo URLs
app.get('/api/getTeachers', async (req, res) => {
  try {
    const query = 'SELECT employeeId, CONCAT(firstName, lastName) AS name, gender, classname, section, address, phoneNumber, email, photo FROM teachers';
    const teachers = await executeQuery.executeQuery(query);

    // Add full URL path to photo for frontend access
    const teachersWithPhotoURL = teachers.map(teacher => {
      return {
        ...teacher,
        photo: teacher.photo ? `http://localhost:5000/${teacher.photo}` : null,
      };
    });

    res.status(200).json({ teachers: teachersWithPhotoURL });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({ message: 'Error fetching teachers.' });
  }
});


// Endpoint to add student data
app.post('/api/addStudent', upload.single('photo'), async (req, res) => {
  const { firstName, lastName, gender, dob, Roll, bloodGroup, religion, email, Class, section, Admission, phoneNumber, shortBio } = req.body;

  // Save the uploaded student's photo path
  const photoPath = req.file ? req.file.path : null;

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

// Endpoint to get all students with correct photo URLs
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

      // Add full URL path to photo for frontend access
      const studentsWithPhotoURL = result.map(student => {
        return {
          ...student,
          photo: student.photo ? `http://localhost:5000/${student.photo}` : null,
        };
      });

      res.status(200).json({ students: studentsWithPhotoURL });
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Error fetching students.' });
  }
});




// Endpoint to add parent data
app.post('/api/addParent', upload.single('photo'), async (req, res) => {
  const { firstName, lastName, gender, occupation, idNumber, bloodGroup, religion, email, phoneNumber, address, shortBio,numChildren } = req.body;
  const photoPath = req.file ? req.file.path : null;

  const query = `
    INSERT INTO parents (firstName, lastName, gender, occupation, idNumber, bloodGroup, religion, email, phoneNumber, address, shortBio, photo,numChildren)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)
  `;

  const values = [
    firstName, lastName, gender, occupation, idNumber, bloodGroup, religion, email, phoneNumber, address, shortBio, photoPath,numChildren,
  ];

  connection.query(query, values, (err, result) => {
    if (err) {
      console.error('Error adding parent:', err);
      return res.status(500).json({ message: 'Error adding parent' });
    }
    res.status(200).json({ message: 'Parent added successfully!' });
  });
});

// Endpoint to get all parents with correct photo URLs
app.get('/api/getParents', async (req, res) => {
  try {
    const query = `
      SELECT idNumber, CONCAT(firstName, ' ', lastName) AS name, occupation, phoneNumber, email, gender, photo,numChildren 
      FROM parents
    `;
    connection.query(query, (err, result) => {
      if (err) {
        console.error('Error fetching parents:', err);
        return res.status(500).json({ message: 'Error fetching parents.' });
      }

      // Add full URL path to photo for frontend access
      const parentsWithPhotoURL = result.map(parent => {
        return {
          ...parent,
          photo: parent.photo ? `${parent.photo}` : null,
        };
      });

      res.status(200).json({ parents: parentsWithPhotoURL });
    });
  } catch (error) {
    console.error('Error fetching parents:', error);
    res.status(500).json({ message: 'Error fetching parents.' });
  }
});


// Admin Dahboard view backend------------------------------------

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
    const query = "SELECT SUM(totalFeeReceived) AS count FROM fees;";
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


//  adding remaining all modules---------------------------------------------------------


// POST route to add transport data
app.post('/api/addTransport', async (req, res) => {
  const { routeName, vehicleNumber, driverName, licenseNumber, phoneNumber } = req.body;

  try {
    const query = `
      INSERT INTO transport (routeName, vehicleNumber, driverName, licenseNumber, phoneNumber)
      VALUES (?, ?, ?, ?, ?)
    `;
    const values = [routeName, vehicleNumber, driverName, licenseNumber, phoneNumber];

    await executeQuery.executeQuery(query, values);

    res.status(200).json({ message: 'Transport added successfully' });
  } catch (error) {
    console.error('Error adding transport:', error);
    res.status(500).json({ message: 'Error adding transport' });
  }
});

// GET route to fetch transport list
app.get('/api/getTransportList', async (req, res) => {
  try {
    const query = 'SELECT * FROM transport';
    const transportList = await executeQuery.executeQuery(query);
    res.status(200).json(transportList);
  } catch (error) {
    console.error('Error fetching transport list:', error);
    res.status(500).json({ message: 'Error fetching transport list' });
  }
});
// ---------------------------------------------------------
// POST route to add class routine
app.post('/api/addClassRoutine', async (req, res) => {
  const { className, section, date, scheduleData } = req.body;

  try {
    // Query to insert the class routine into the database
    const query = `
      INSERT INTO class_routines (className, section, date, scheduleData)
      VALUES (?, ?, ?, ?)
    `;
    const values = [className, section, date, JSON.stringify(scheduleData)];

    await executeQuery.executeQuery(query, values);

    res.status(200).json({ message: 'Class routine added successfully' });
  } catch (error) {
    console.error('Error adding class routine:', error);
    res.status(500).json({ message: 'Error adding class routine' });
  }
});

// GET route to fetch class routine list
app.get('/api/getClassRoutine', async (req, res) => {
  const { className, section, date } = req.query;

  try {
    // Query to fetch the class routine for the given class, section, and date
    const query = `
      SELECT * FROM class_routines
      WHERE className = ? AND section = ? AND date = ?
    `;
    const values = [className, section, date];
    
    const classRoutine = await executeQuery.executeQuery(query, values);

    if (classRoutine.length === 0) {
      return res.status(404).json({ message: 'No routine found for the selected parameters' });
    }

    // Assuming the schedule is stored as a JSON string in the database
    const parsedSchedule = classRoutine[0].scheduleData ? JSON.parse(classRoutine[0].scheduleData) : {};

    res.status(200).json(parsedSchedule);
  } catch (error) {
    console.error('Error fetching class routine:', error);
    res.status(500).json({ message: 'Error fetching class routine' });
  }
});
// -----------------------------------
// POST route to add exam schedule
app.post('/api/addExamSchedule', async (req, res) => {
  const { name, subject, classname, section, time, date } = req.body;

  try {
    const query = `
      INSERT INTO exam_schedule (name, subject, classname, section, time, date)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const values = [name, subject, classname, section, time, date];
    await executeQuery.executeQuery(query, values);

    res.status(200).json({ message: 'Exam added successfully' });
  } catch (error) {
    console.error('Error adding exam:', error);
    res.status(500).json({ message: 'Error adding exam' });
  }
});

// GET route to fetch exam list
app.get('/api/getExamList', async (req, res) => {
  try {
    const query = 'SELECT * FROM exam_schedule';
    const examList = await executeQuery.executeQuery(query);
    res.status(200).json(examList);
  } catch (error) {
    console.error('Error fetching exam list:', error);
    res.status(500).json({ message: 'Error fetching exam list' });
  }
});

// Add new grade
app.post("/api/addExamGrade", async (req, res) => {
  console.log(req); // Form data (new grade)
  console.log(req.body,"uygeuiywuf");
  const { gradeName, gradePoint, percentFrom, percentUpto, comments } = req.body;

  try {
    const query = `
      INSERT INTO grades (gradeName, gradePoint, percentFrom, percentUpto, comments)
      VALUES (?, ?, ?, ?, ?)
    `;
    const values = [gradeName, gradePoint, percentFrom, percentUpto, comments];
    await executeQuery.executeQuery(query, values);

    res.status(200).json({ message: 'Grade added successfully' });
  } catch (error) {
    console.error('Error adding grade:', error);
    res.status(500).json({ message: 'Error adding grade' });
  }
});

// Get list of all grades
app.get("/api/getExamGrades", async (req, res) => {
  try {
    const query = "SELECT * FROM grades";
    const examGrade = await executeQuery.executeQuery(query);
    res.status(200).json(examGrade);  // Send data if everything is fine
  } catch (error) {
    console.error("Error fetching grade list:", error);
    res.status(500).json({ message: "Error fetching grade list", error: error.message }); // Send detailed error message
  }
});


// Add new room (POST)
app.post("/api/addRoom", async (req, res) => {
  console.log(req); // Form data (new grade)
  console.log(req.body,"uygeuiywufbhbhj");
  const { hostel, roomNo, roomtype, beds, cost } = req.body; // Extracting the room data from the request body

  try {
    const query = `
      INSERT INTO rooms (hostel, roomNo, roomtype, beds, cost)
      VALUES (?, ?, ?, ?, ?)
    `;
    const values = [hostel, roomNo, roomtype, beds, cost];

    // Execute the query to insert the room into the database
    await executeQuery.executeQuery(query, values);

    res.status(200).json({ message: "Room added successfully" }); // Send success response
  } catch (error) {
    console.error("Error adding room:", error);
    res.status(500).json({ message: "Error adding room" }); // Send error response
  }
});

// Get list of all rooms (GET)
app.get("/api/getRooms", async (req, res) => {
  try {
    const query = "SELECT * FROM rooms"; // Query to fetch all room data
    const rooms = await executeQuery.executeQuery(query); // Execute the query

    res.status(200).json(rooms);  // Send back the room data as a JSON response
  } catch (error) {
    console.error("Error fetching room list:", error);
    res.status(500).json({ message: "Error fetching room list", error: error.message }); // Send detailed error message
  }
});



// Add new expense (POST)
app.post("/api/addExpenses", async (req, res) => {
  console.log(req); // Form data (new expenses)
  console.log(req.body,"uygeuiywufbhbhj");
  const { name, idNo, expenseType, amount, phone, email, status, date } = req.body; // Extracting the expense data from the request body

  try {
    const query = `
      INSERT INTO expenses (name, idNo, expenseType, amount, phone, email, status, date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [name, idNo, expenseType, amount, phone, email, status, date];

    // Execute the query to insert the expense into the database
    await executeQuery.executeQuery(query, values);

    res.status(200).json({ message: "Expense added successfully" }); // Send success response
  } catch (error) {
    console.error("Error adding expense:", error);
    res.status(500).json({ message: "Error adding expense" }); // Send error response
  }
});

// Get list of all expenses (GET)
app.get('/api/getExpenses', async (req, res) => {
  try {
    const query = 'SELECT * FROM expenses';
    const result = await executeQuery.executeQuery(query); // Ensure this works properly with your database
    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ message: 'Error fetching expenses' });
  }
});








// Route to add a new class routine (POST)
app.post("/api/addRoutine", async (req, res) => {
  const { day, Class, subject, section, teacher, time, date, subjectType, code } = req.body;

  try {
    const query = `
      INSERT INTO class_routines (day, Class, Subject, section, teacher, time, date, subjectType, code)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    console.log(req); // Form data (new expenses)
    console.log(req.body,"uygeuiywufbhbhj");
    const values = [day, Class, Subject, section, teacher, time, date, subjectType, Code];

    // Use the connection object to query the database
    connection.query(query, values, (err, result) => {
      if (err) {
        console.error("Error adding routine:", err);
        return res.status(500).json({ message: "Error adding routine" });
      }
      res.status(200).json({ message: "Routine added successfully" });
    });
  } catch (error) {
    console.error("Error adding routine:", error);
    res.status(500).json({ message: "Error adding routine" });
  }
});

// Route to get all class routines (GET)
app.get("/api/getRoutines", async (req, res) => {
  try {
    const query = "SELECT * FROM class_routines";
    
    // Use the connection object to query the database
    connection.query(query, (err, result) => {
      if (err) {
        console.error("Error fetching routines:", err);
        return res.status(500).json({ message: "Error fetching routines" });
      }
      res.status(200).json(result); // Send the routines list as a response
    });
  } catch (error) {
    console.error("Error fetching routines:", error);
    res.status(500).json({ message: "Error fetching routines" });
  }
});

// Route to delete a class routine (DELETE)
app.delete("/api/deleteRoutine/:id", (req, res) => {
  const { id } = req.params;

  try {
    const query = "DELETE FROM class_routines WHERE id = ?";

    // Use the connection object to query the database
    connection.query(query, [id], (err, result) => {
      if (err) {
        console.error("Error deleting routine:", err);
        return res.status(500).json({ message: "Error deleting routine" });
      }
      res.status(200).json({ message: "Routine deleted successfully" });
    });
  } catch (error) {
    console.error("Error deleting routine:", error);
    res.status(500).json({ message: "Error deleting routine" });
  }
});



// Add new book (POST)
app.post("/api/addBook", upload.single("image"), async (req, res) => {
  console.log(req.body, "Received book data");
  console.log(req.file, "Received file data");

  // Destructure the new fields from the request body
  const {
    title,
    bookNumber,
    publisher,
    author,
    rackNo,
    quantity,
    available,
    description,
  } = req.body;

  // Get the image path from the file upload
  const image = req.file ? req.file.path : null;

  try {
    // Create the SQL query to insert a new book into the books table
    const query = `
      INSERT INTO books (title, bookNumber, publisher, author, rackNo, quantity, available, description, image)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [title, bookNumber, publisher, author, rackNo, quantity, available, description, image];

    // Execute the query
    await executeQuery.executeQuery(query, values);

    res.status(200).json({ message: "Book added successfully" });
  } catch (error) {
    console.error("Error adding book:", error);
    res.status(500).json({ message: "Error adding book" });
  }
});


// Route to get all Books (GET)
app.get("/api/getBooks", async (req, res) => {
  try {
    const query = "SELECT * FROM books";
    
    // Use the connection object to query the database
    connection.query(query, (err, result) => {
      if (err) {
        console.error("Error fetching books:", err);
        return res.status(500).json({ message: "Error fetching routines" });
      }
      res.status(200).json(result); // Send the routines list as a response
    });
  } catch (error) {
    console.error("Error fetching routines:", error);
    res.status(500).json({ message: "Error fetching books" });
  }
});



// Add Subject (POST)
app.post("/api/addSubject", async (req, res) => {
  console.log(req.body, "Received Subject");

  const { subjectName, subjectType, selectClass, selectCode, subjectDate } = req.body;

  try {
    // Create the SQL query to insert a new subject into the Subject table
    const query = `
      INSERT INTO Subjects (subjectName, subjectType, selectClass, selectCode, subjectDate)
      VALUES (?, ?, ?, ?, ?)
    `;
    const values = [subjectName, subjectType, selectClass, selectCode, subjectDate];

    // Execute the query
    await executeQuery.executeQuery(query, values);

    res.status(200).json({ message: "Subject added successfully" });
  } catch (error) {
    console.error("Error adding Subject:", error);
    res.status(500).json({ message: "Error adding Subject" });
  }
});

// Route to get all Subject (GET)
app.get("/api/getSubjects", async (req, res) => {
  try {
    const query = "SELECT * FROM subjects";
    
    // Use the connection object to query the database
    connection.query(query, (err, result) => {
      if (err) {
        console.error("Error fetching Subjects:", err);
        return res.status(500).json({ message: "Error fetching Subjects" });
      }
      res.status(200).json(result); // Send the subjects list as a response
    });
  } catch (error) {
    console.error("Error fetching Subjects:", error);
    res.status(500).json({ message: "Error fetching Subjects" });
  }
});


// Route to delete selected subjects (DELETE)
app.post("/api/deleteSubjects", async (req, res) => {
  const { ids } = req.body; // Expect an array of subject IDs from the frontend

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: "No subjects selected" });
  }

  try {
    // Create the SQL query to delete selected subjects based on their IDs
    const query = `DELETE FROM Subjects WHERE id IN (?)`;
    
    // Execute the query
    connection.query(query, [ids], (err, result) => {
      if (err) {
        console.error("Error deleting subjects:", err);
        return res.status(500).json({ message: "Error deleting subjects" });
      }

      // If no subjects were deleted, return a not found message
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "No subjects found to delete" });
      }

      res.status(200).json({
        message: `${result.affectedRows} subjects deleted successfully`,
      });
    });
  } catch (error) {
    console.error("Error deleting subjects:", error);
    res.status(500).json({ message: "Error deleting subjects" });
  }
});


// Add Class (POST)
app.post("/api/addClass", async (req, res) => {
  console.log(req.body, "Received Class");

  const {
    teachername,
    idNo,
    gender,
    class: classNum,
    subject,
    section,
    time,
    date,
    phone,
    email
  } = req.body;

  try {
    // Insert the class details into the classes table
    const query = `
      INSERT INTO classes (teachername, idNo, gender, class, subject, section, time, date, phone, email)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      teachername,
      idNo,
      gender,
      classNum,
      subject,
      section,
      time,
      date,
      phone,
      email
    ];

    // Execute the query
    await executeQuery.executeQuery(query, values);

    res.status(200).json({ message: "Class added successfully" });
  } catch (error) {
    console.error("Error adding Class:", error);
    res.status(500).json({ message: "Error adding Class" });
  }
});


app.get('/api/getClasses', async (req, res) => {
  try {
    const query = 'SELECT * FROM classes';
    const result = await executeQuery.executeQuery(query);
    res.status(200).json(result); // Send the fetched class details as a response
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ message: 'Failed to fetch classes' });
  }
});


// POST route to add a new user
app.post("/api/addusers", (req, res) => {
  console.log(req.body, "Received user data");

  const {
    firstName,
    lastName,
    userType,
    gender,
    fatherName,
    motherName,
    dateOfBirth,
    religion,
    joiningDate,
    email,
    subject,
    class: className,
    section,
    idNo,
    phone,
    address,
  } = req.body;

  // SQL query to insert new user
  const query = `
    INSERT INTO users (firstName, lastName, userType, gender, fatherName, motherName, dateOfBirth, religion, joiningDate, email, subject, class, section, idNo, phone, address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [
    firstName,
    lastName,
    userType,
    gender,
    fatherName,
    motherName,
    dateOfBirth,
    religion,
    joiningDate,
    email,
    subject,
    className,
    section,
    idNo,
    phone,
    address,
  ];

  // Directly execute the query
  connection.query(query, values, (err, result) => {
    if (err) {
      console.error("Error adding user:", err);
      res.status(500).json({ message: "Error adding user" });
    } else {
      res.status(200).json({ message: "User added successfully" });
    }
  });
});

// GET route to fetch all users
app.get("/api/getusers", async (req, res) => {
  try {
    const query = "SELECT * FROM users"; // Query to fetch all users
    
    // Use the connection object to query the database
    connection.query(query, (err, result) => {
      if (err) {
        console.error("Error fetching users:", err);
        return res.status(500).json({ message: "Error fetching users" });
      }
      res.status(200).json(result); // Send the users list as a response
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Error fetching users" });
  }
});

//add Notice
app.post("/api/addNotice", async (req, res) => {
  const { subject, details, postedTo, date } = req.body;
  
  try {
    const query = `
      INSERT INTO notices (subject, details, postedTo, date)
      VALUES (?, ?, ?, ?)
    `;
    const values = [subject, details, postedTo, date];
    
    // Execute the query to insert the new notice into the database
    await executeQuery.executeQuery(query, values);
    
    res.status(200).json({ message: "Notice added successfully" });
  } catch (error) {
    console.error("Error adding notice:", error);
    res.status(500).json({ message: "Error adding notice", error: error.message });
  }
});

app.get("/api/getNotices", async (req, res) => {
  try {
    const query = "SELECT * FROM notices ";
    const notices = await executeQuery.executeQuery(query);
    
    res.status(200).json(notices);  // Send back the notices data
  } catch (error) {
    console.error("Error fetching notices:", error);
    res.status(500).json({ message: "Error fetching notices", error: error.message });
  }
});

app.get("/api/searchNotices", async (req, res) => {
  const { subject, date } = req.query;

  let query = "SELECT * FROM notices WHERE 1 = 1";
  const values = [];

  if (subject) {
    query += " AND subject LIKE ?";
    values.push(`%${subject}%`);
  }

  if (date) {
    query += " AND date = ?";
    values.push(date);
  }

  query += " ORDER BY createdAt DESC";

  try {
    const notices = await executeQuery.executeQuery(query, values);
    res.status(200).json(notices);
  } catch (error) {
    console.error("Error searching notices:", error);
    res.status(500).json({ message: "Error searching notices", error: error.message });
  }
});


// Route to send a message (POST)
app.post('/api/sendMessage', async (req, res) => {
  const { title, recipient, message } = req.body;

  console.log('Received message data:', req.body); // Log the received data for debugging

  try {
    // SQL query to insert the message into the database
    const query = `
      INSERT INTO messages (title, recipient, message)
      VALUES (?, ?, ?)
    `;
    const values = [title, recipient, message];

    // Execute the query to insert the message
    connection.execute(query, values, (err, result) => {
      if (err) {
        console.error('Error sending message:', err);
        return res.status(500).json({ message: 'Error sending message' });
      }
      console.log('Message sent successfully');
      return res.status(200).json({ message: 'Message sent successfully' });
    });
  } catch (error) {
    console.error('Error in try-catch block:', error);
    res.status(500).json({ message: 'Error sending message' });
  }
});


// Route to get all messages (GET)
app.get('/api/getMessages', async (req, res) => {
  try {
    // SQL query to fetch all messages from the database
    const query = 'SELECT * FROM messages';

    // Execute the query to fetch data from the database
    connection.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching messages:', err);
        return res.status(500).json({ message: 'Error fetching messages' });
      }
      console.log('Messages fetched successfully');
      return res.status(200).json(results); // Send the fetched messages as a response
    });
  } catch (error) {
    console.error('Error in try-catch block:', error);
    res.status(500).json({ message: 'Error fetching messages' });
  }
});


// Route to add a new fee (POST)
app.post('/api/addFee', async (req, res) => {
  const { studentName, classDiv, parentName, feeAmount, totalFeeReceived, feeOutstanding } = req.body;

  console.log('Received fee data:', req.body); // Logging the received data

  try {
    // SQL query to insert fee data into the database
    const query = `
      INSERT INTO fees (studentName, classDiv, parentName, feeAmount, totalFeeReceived, feeOutstanding)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const values = [studentName, classDiv, parentName, feeAmount, totalFeeReceived, feeOutstanding];

    // Execute the query
    connection.execute(query, values, (err, result) => {
      if (err) {
        console.error('Error adding fee:', err);
        return res.status(500).json({ message: 'Error adding fee' });
      }
      console.log('Fee added successfully');
      res.status(200).json({ message: 'Fee added successfully' });
    });
  } catch (error) {
    console.error('Error in try-catch block:', error);
    res.status(500).json({ message: 'Error adding fee' });
  }
});

// Route to get all fees (GET)
app.get('/api/getFees', async (req, res) => {
  try {
    // SQL query to fetch all fees from the database
    const query = 'SELECT * FROM fees';

    connection.query(query, (err, result) => {
      if (err) {
        console.error('Error fetching fees:', err);
        return res.status(500).json({ message: 'Error fetching fees' });
      }
      console.log('Fees fetched successfully');
      res.status(200).json(result); // Send the fetched fee data as a response
    });
  } catch (error) {
    console.error('Error in try-catch block:', error);
    res.status(500).json({ message: 'Error fetching fees' });
  }
});

// ------------------------------------------------------


// Route to handle leave request submission
app.post('/api/leave', upload.array('supportingDocs'), async (req, res) => {
  const { leaveType, duration, fromDate, toDate, reason, teacherName } = req.body;
  const teacher = teacherName || 'Unknown Teacher'; // Default teacher name if not provided

  // Process supporting documents
  const supportingDocs = req.files ? req.files.map(file => file.filename) : [];

  // SQL query to insert leave request
  const query = `
    INSERT INTO leave_requests (teacher, leavetype, duration, fromdate, todate)
    VALUES (?, ?, ?, ?, ? )
  `;

  const values = [teacher, leaveType, duration, fromDate, toDate];

  try {
    const [result] = await connection.promise().query(query, values);
    res.status(200).json({ message: 'Leave request submitted successfully!' });
  } catch (err) {
    console.error('Error submitting leave request:', err);
    res.status(500).json({ message: 'Error submitting leave request.' });
  }
});

// Route to fetch all leave requests
app.get('/api/leaveRequests', async (req, res) => {
  const query = 'SELECT * FROM leave_requests';

  try {
    const [rows] = await connection.promise().query(query);
    res.status(200).json({ data: rows });
  } catch (error) {
    console.error('Error fetching leave requests:', error);
    res.status(500).json({ message: 'Error fetching leave requests.' });
  }
});

// Route to update leave request status (Approve/Reject)
app.patch('/api/leave/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['Approved', 'Rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status value.' });
  }

  const query = 'UPDATE leave_requests SET status = ? WHERE id = ?';

  try {
    const [result] = await connection.promise().query(query, [status, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Leave request not found.' });
    }

    res.status(200).json({ message: `Leave request ${status.toLowerCase()} successfully.` });
  } catch (error) {
    console.error('Error updating leave request:', error);
    res.status(500).json({ message: 'Error updating leave request status.' });
  }
});
// ------------------------------------------------------




app.put("/api/editParent/:id", async (req, res) => {
  const parentId = req.params.id;
  const { name, gender, occupation, children, phone, email } = req.body;

  // Log the received request body
  console.log("Received body:", req.body);

  if (!name || !email) {
    return res.status(400).json({ message: "Name and Email are required" });
  }

  try {
    // SQL query to update the parent's details
    const query = `
      UPDATE Parents 
      SET name = ?, gender = ?, occupation = ?, children = ?, phone = ?, email = ?
      WHERE id = ?
    `;

    connection.query(
      query,
      [name, gender, occupation, children, phone, email, parentId],
      (err, result) => {
        if (err) {
          console.error("Error updating parent:", err);
          return res.status(500).json({ message: "Error updating parent" });
        }

        console.log("Result of update:", result);

        if (result.affectedRows === 0) {
          return res.status(404).json({ message: "Parent not found" });
        }

        res.status(200).json({ message: "Parent updated successfully" });
      }
    );
  } catch (error) {
    console.error("Error updating parent:", error);
    res.status(500).json({ message: "Error updating parent" });
  }
});

// Route to delete a parent (DELETE)
app.delete("/api/deleteParent/:id", async (req, res) => {
  const parentId = req.params.id;

  try {
    const query = `DELETE FROM Parents WHERE id = ?`;

    connection.query(query, [parentId], (err, result) => {
      if (err) {
        console.error("Error deleting parent:", err);
        return res.status(500).json({ message: "Error deleting parent" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Parent not found" });
      }

      res.status(200).json({ message: "Parent deleted successfully" });
    });
  } catch (error) {
    console.error("Error deleting parent:", error);
    res.status(500).json({ message: "Error deleting parent" });
  }
});


// ✅ GET: Fetch unique classes & sections for dropdowns
app.get('/api/getClassesAndSections', (req, res) => {
  const query = `SELECT DISTINCT Class, section FROM students`;

  connection.query(query, (error, results) => {
    if (error) {
      console.error('❌ Error fetching classes and sections:', error);
      return res.status(500).json({ success: false, message: 'Server error fetching classes' });
    }

    if (!results.length) {
      return res.status(404).json({ success: false, message: 'No classes found' });
    }

    // Format data into an object
    const formattedData = results.reduce((acc, row) => {
      if (!acc[row.Class]) {
        acc[row.Class] = [];
      }
      acc[row.Class].push(row.section);
      return acc;
    }, {});

    res.status(200).json({ success: true, classes: formattedData });
  });
});

// ✅ POST: Add student attendance
app.post('/api/addAttendance', (req, res) => {
  const { studentId, attendanceDate, attendanceStatus } = req.body;

  if (!studentId || !attendanceDate || !attendanceStatus) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  const query = `
    INSERT INTO attendance (studentId, attendanceDate, attendanceStatus)
    VALUES (?, ?, ?)
  `;

  connection.query(query, [studentId, attendanceDate, attendanceStatus], (error) => {
    if (error) {
      console.error('❌ Error adding attendance:', error);
      return res.status(500).json({ success: false, message: 'Server error adding attendance' });
    }

    res.status(200).json({ success: true, message: 'Attendance recorded successfully' });
  });
});

// ✅ GET: Fetch attendance records
app.get('/api/getAttendance', (req, res) => {
  connection.query('SELECT * FROM attendance', (error, results) => {
    if (error) {
      console.error('❌ Error fetching attendance records:', error);
      return res.status(500).json({ success: false, message: 'Server error fetching attendance records' });
    }

    if (!results.length) {
      return res.status(404).json({ success: false, message: 'No attendance records found' });
    }

    res.status(200).json({ success: true, attendance: results });
  });
});

// ✅ GET: Fetch students based on Class & Section
app.get('/api/students', (req, res) => {
  const { class: className, section } = req.query;

  if (!className || !section) {
    return res.status(400).json({ success: false, message: 'Class and Section are required' });
  }

  const query = `SELECT * FROM students WHERE Class = ? AND section = ?`;

  connection.query(query, [className, section], (error, results) => {
    if (error) {
      console.error('❌ Error fetching students:', error);
      return res.status(500).json({ success: false, message: 'Server error fetching students' });
    }

    if (!results.length) {
      return res.status(404).json({ success: false, message: 'No students found for this class and section' });
    }

    res.status(200).json({ success: true, students: results });
  });
});


// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
