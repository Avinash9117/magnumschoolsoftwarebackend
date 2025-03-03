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
const pool = mysql.createPool({
 host: 'sql8.freesqldatabase.com',
  port: 3306,
  user: 'sql8764671',
  password: 'vEfPMw1bWy', // Use your MySQL password here
  database: 'sql8764671', // Ensure the database name is correct
  waitForConnections: true, // Wait for a connection if none are available
  connectionLimit: 10, // Maximum number of connections in the pool
  queueLimit: 0, // Unlimited queue for waiting connections
  enableKeepAlive: true, // Enable keep-alive to prevent connection timeouts
  keepAliveInitialDelay: 10000, // Send a keep-alive packet every 10 seconds

});

// Test the connection pool
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to MySQL:', err.stack);
    return;
  }
  console.log('Connected to MySQL using connection pool');
  connection.release(); // Release the connection back to the pool
});

// Export the pool for use in other modules
module.exports = pool;

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
    const query = 'SELECT employeeId, CONCAT(firstName, " ",  lastName) AS name, gender, classname, section, address, phoneNumber, email, photo FROM teachers';
    const teachers = await executeQuery.executeQuery(query);

    res.status(200).json({ teachers: teachers });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({ message: 'Error fetching teachers.' });
  }
});

// Edit Teacher - PUT endpoint
app.put('/api/editTeacher/:employeeId', upload.single('photo'), async (req, res) => {
  const { employeeId } = req.params;
  const { firstName, lastName, gender, dob, bloodGroup, religion, email, 
          phoneNumber, address, classname, section, shortBio } = req.body;

  try {
    // Get existing photo path if no new file uploaded
    const [existingTeacher] = await executeQuery.executeQuery(
      'SELECT photo FROM teachers WHERE employeeId = ?', 
      [employeeId]
    );

    const photoPath = req.file ? req.file.path : existingTeacher.photo;

    const query = `
      UPDATE teachers SET
        firstName = ?,
        lastName = ?,
        gender = ?,
        dob = ?,
        bloodGroup = ?,
        religion = ?,
        email = ?,
        phoneNumber = ?,
        address = ?,
        classname = ?,
        section = ?,
        shortBio = ?,
        photo = ?
      WHERE employeeId = ?
    `;

    const values = [
      firstName, lastName, gender, dob, bloodGroup, religion, email,
      phoneNumber, address, classname, section, shortBio, photoPath, employeeId
    ];

    await executeQuery.executeQuery(query, values);
    res.status(200).json({ message: 'Teacher updated successfully!' });

  } catch (error) {
    console.error('Error updating teacher:', error);
    res.status(500).json({ message: 'Error updating teacher' });
  }
});

// Delete Teacher(s) - DELETE endpoint
app.delete('/api/deleteTeachers', async (req, res) => {
  const { employeeIds } = req.body;

  if (!employeeIds || employeeIds.length === 0) {
    return res.status(400).json({ message: 'No teachers selected for deletion' });
  }

  try {
    const query = `
      DELETE FROM teachers 
      WHERE employeeId IN (${employeeIds.map(() => '?').join(',')})
    `;
    
    await executeQuery.executeQuery(query, employeeIds);
    res.status(200).json({ message: 'Teacher(s) deleted successfully' });

  } catch (error) {
    console.error('Error deleting teachers:', error);
    res.status(500).json({ message: 'Error deleting teachers' });
  }
});


// API to fetch teachers with salary details
// API to fetch teachers with salary details
// app.get('/api/getTeachers', async (req, res) => {
//   try {
//     const query = `
//       SELECT t.employeeId, CONCAT(t.firstName, ' ', t.lastName) AS name, 
//              'Teacher' AS role, -- Hardcoded role for now
//              t.phoneNumber, t.photo, 
//              p.month, p.year, p.status, p.salary, p.deductions, p.netSalary
//       FROM teachers t
//       LEFT JOIN payslips p ON t.employeeId = p.employeeId
//     `;
//     pool.query(query, (err, results) => {
//       if (err) {
//         console.error('Error executing query:', err);
//         return res.status(500).json({ message: 'Error fetching teachers.' });
//       }

//       // Add random salary details if not already present
//       const teachersWithSalary = results.map(teacher => {
//         if (!teacher.salary) {
//           const salary = Math.floor(Math.random() * 50000) + 30000; // Random salary between 30,000 and 80,000
//           const deductions = Math.floor(salary * 0.1); // 10% deductions
//           const netSalary = salary - deductions;

//           return {
//             ...teacher,
//             salary: salary,
//             deductions: deductions,
//             netSalary: netSalary,
//             status: 'Unpaid'
//           };
//         }
//         return teacher;
//       });

//       res.status(200).json({ teachers: teachersWithSalary });
//     });
//   } catch (error) {
//     console.error('Error fetching teachers:', error);
//     res.status(500).json({ message: 'Error fetching teachers.' });
//   }
// });


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

  pool.query(query, values, (err, result) => {
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
    pool.query(query, (err, result) => {
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

//update student 
app.put('/api/updateStudent/:id', upload.single('photo'), async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, gender, dob, Roll, bloodGroup, religion, email, Class, section, Admission, phoneNumber, shortBio } = req.body;
  const photoPath = req.file ? req.file.path : null;

  // Fetch existing student record to keep non-updated values
  pool.query(`SELECT * FROM students WHERE id = ?`, [id], (err, rows) => {
    if (err) {
      console.error('Error fetching student:', err);
      return res.status(500).json({ message: 'Error fetching student data' });
    }

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const existingStudent = rows[0];

    // Ensure we only update fields that have new values
    const updatedStudent = {
      firstName: firstName !== undefined && firstName !== '' ? firstName : existingStudent.firstName,
      lastName: lastName !== undefined && lastName !== '' ? lastName : existingStudent.lastName,
      gender: gender !== undefined && gender !== '' ? gender : existingStudent.gender,
      dob: dob !== undefined && dob !== '' ? dob : existingStudent.dob,
      Roll: Roll !== undefined && Roll !== '' ? Roll : existingStudent.Roll,
      bloodGroup: bloodGroup !== undefined && bloodGroup !== '' ? bloodGroup : existingStudent.bloodGroup,
      religion: religion !== undefined && religion !== '' ? religion : existingStudent.religion,
      email: email !== undefined && email !== '' ? email : existingStudent.email,
      Class: Class !== undefined && Class !== '' ? Class : existingStudent.Class,
      section: section !== undefined && section !== '' ? section : existingStudent.section,
      Admission: Admission !== undefined && Admission !== '' ? Admission : existingStudent.Admission,
      phoneNumber: phoneNumber !== undefined && phoneNumber !== '' ? phoneNumber : existingStudent.phoneNumber,
      shortBio: shortBio !== undefined && shortBio !== '' ? shortBio : existingStudent.shortBio,
      photo: photoPath !== null ? photoPath : existingStudent.photo // Only update photo if new one is uploaded
    };

    const query = `
      UPDATE students 
      SET firstName = ?, lastName = ?, gender = ?, dob = ?, Roll = ?, bloodGroup = ?, religion = ?, email = ?, Class = ?, section = ?, Admission = ?, phoneNumber = ?, shortBio = ?, photo = ?
      WHERE id = ?
    `;

    const values = [
      updatedStudent.firstName, updatedStudent.lastName, updatedStudent.gender, updatedStudent.dob,
      updatedStudent.Roll, updatedStudent.bloodGroup, updatedStudent.religion, updatedStudent.email,
      updatedStudent.Class, updatedStudent.section, updatedStudent.Admission, updatedStudent.phoneNumber,
      updatedStudent.shortBio, updatedStudent.photo, id
    ];

    pool.query(query, values, (err, result) => {
      if (err) {
        console.error('Error updating student:', err);
        return res.status(500).json({ message: 'Database error' });
      }
      res.status(200).json({ message: 'Student updated successfully!' });
    });
  });
});




//delete student
app.delete('/api/deleteStudent/:id', async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "Student ID is required" });
  }

  const query = `DELETE FROM students WHERE id = ?`;

  pool.query(query, [id], (err, result) => {
    if (err) {
      console.error('Error deleting student:', err);
      return res.status(500).json({ message: 'Database error: ' + err.message });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json({ message: 'Student deleted successfully!' });
  });
});





// Endpoint to add parent data
app.post('/api/addParent', upload.single('photo'), async (req, res) => {
  const { firstName, lastName, gender, occupation, idNumber, bloodGroup, religion, email, phoneNumber, address, shortBio, numChildren } = req.body;
  const photoPath = req.file ? req.file.path : null;

  const query = `
    INSERT INTO parents (firstName, lastName, gender, occupation, idNumber, bloodGroup, religion, email, phoneNumber, address, shortBio, photo,numChildren)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)
  `;

  const values = [
    firstName, lastName, gender, occupation, idNumber, bloodGroup, religion, email, phoneNumber, address, shortBio, photoPath, numChildren,
  ];

  pool.query(query, values, (err, result) => {
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
    pool.query(query, (err, result) => {
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

// PUT route to edit transport data
app.put('/api/editTransport/:id', async (req, res) => {
  const { id } = req.params;
  const { routeName, vehicleNumber, driverName, licenseNumber, phoneNumber } = req.body;

  try {
    const query = `
      UPDATE transport 
      SET routeName = ?, vehicleNumber = ?, driverName = ?, licenseNumber = ?, phoneNumber = ?
      WHERE id = ?
    `;
    const values = [routeName, vehicleNumber, driverName, licenseNumber, phoneNumber, id];

    await executeQuery.executeQuery(query, values);
    res.status(200).json({ message: 'Transport updated successfully' });
  } catch (error) {
    console.error('Error updating transport:', error);
    res.status(500).json({ message: 'Error updating transport' });
  }
});

// DELETE route to remove transport data
app.delete('/api/deleteTransport', async (req, res) => {
  const { ids } = req.body;

  try {
    const query = `
      DELETE FROM transport 
      WHERE id IN (${ids.map(() => '?').join(',')})
    `;
    await executeQuery.executeQuery(query, ids);
    
    res.status(200).json({ message: 'Transport(s) deleted successfully' });
  } catch (error) {
    console.error('Error deleting transport:', error);
    res.status(500).json({ message: 'Error deleting transport' });
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
  const { name, subject, classname, section, start_time, end_time, date } = req.body;

  try {
    const query = `
      INSERT INTO exam_schedule (name, subject, classname, section, start_time, end_time, date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [name, subject, classname, section, start_time, end_time, date];
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

// edit exam schedule
app.put('/api/updateExam/:id', async (req, res) => {
  const { id } = req.params;
  const { name, subject, classname, section, start_time, end_time, date } = req.body;

  try {
    const query = `
      UPDATE exam_schedule 
      SET name = ?, subject = ?, classname = ?, section = ?, start_time = ?, end_time = ?, date = ?
      WHERE id = ?
    `;
    const values = [name, subject, classname, section, start_time, end_time, date, id];
    await executeQuery.executeQuery(query, values);
    res.status(200).json({ message: 'Exam updated successfully' });
  } catch (error) {
    console.error('Error updating exam:', error);
    res.status(500).json({ message: 'Error updating exam' });
  }
});


// delete examschedule
app.delete('/api/deleteExam/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const query = 'DELETE FROM exam_schedule WHERE id = ?';
    await executeQuery.executeQuery(query, [id]);
    res.status(200).json({ message: 'Exam deleted successfully' });
  } catch (error) {
    console.error('Error deleting exam:', error);
    res.status(500).json({ message: 'Error deleting exam' });
  }
});

// Add new grade
app.post("/api/addExamGrade", async (req, res) => {
  console.log(req); // Form data (new grade)
  console.log(req.body, "uygeuiywuf");
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

// Edit Exam Grade (PUT)
app.put("/api/updateExamGrade", async (req, res) => {
  const { oldGradeName, oldGradePoint, newData } = req.body;

  try {
    const query = `
      UPDATE grades 
      SET 
        gradeName = ?,
        gradePoint = ?,
        percentFrom = ?,
        percentUpto = ?,
        comments = ?
      WHERE gradeName = ? AND gradePoint = ?
    `;
    const values = [
      newData.gradeName,
      newData.gradePoint,
      newData.percentFrom,
      newData.percentUpto,
      newData.comments,
      oldGradeName,
      oldGradePoint
    ];
    
    await executeQuery.executeQuery(query, values);
    res.status(200).json({ message: 'Grade updated successfully' });
  } catch (error) {
    console.error('Error updating grade:', error);
    res.status(500).json({ message: 'Error updating grade' });
  }
});

// Delete Exam Grade (DELETE)
app.delete("/api/deleteExamGrade", async (req, res) => {
  const { gradeName, gradePoint } = req.body;

  try {
    const query = `
      DELETE FROM grades 
      WHERE gradeName = ? AND gradePoint = ?
    `;
    await executeQuery.executeQuery(query, [gradeName, gradePoint]);
    
    res.status(200).json({ message: 'Grade deleted successfully' });
  } catch (error) {
    console.error('Error deleting grade:', error);
    res.status(500).json({ message: 'Error deleting grade' });
  }
});


// Add new room (POST)
app.post("/api/addRoom", async (req, res) => {
  console.log(req); // Form data (new grade)
  console.log(req.body, "uygeuiywufbhbhj");
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

// Edit Room Endpoint
app.put("/api/editRoom/:id", async (req, res) => {
  const { id } = req.params;
  const { hostel, roomNo, roomtype, beds, cost } = req.body;

  try {
    const query = `
      UPDATE rooms 
      SET hostel = ?, roomNo = ?, roomtype = ?, beds = ?, cost = ?
      WHERE id = ?
    `;
    const values = [hostel, roomNo, roomtype, beds, cost, id];

    await executeQuery.executeQuery(query, values);
    res.status(200).json({ message: "Room updated successfully" });
  } catch (error) {
    console.error("Error updating room:", error);
    res.status(500).json({ message: "Error updating room" });
  }
});

// Delete Room Endpoint
app.delete("/api/deleteRoom/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const query = `DELETE FROM rooms WHERE id = ?`;
    await executeQuery.executeQuery(query, [id]);
    res.status(200).json({ message: "Room deleted successfully" });
  } catch (error) {
    console.error("Error deleting room:", error);
    res.status(500).json({ message: "Error deleting room" });
  }
});



// Add new expense (POST)
app.post("/api/addExpenses", async (req, res) => {
  console.log(req); // Form data (new expenses)
  console.log(req.body, "uygeuiywufbhbhj");
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

// Edit Expense - PUT endpoint
app.put("/api/editExpenses/:id", async (req, res) => {
  const { id } = req.params;
  const { name, idNo, expenseType, amount, phone, email, status, date } = req.body;

  try {
    const query = `
      UPDATE expenses 
      SET 
        name = ?,
        idNo = ?,
        expenseType = ?,
        amount = ?,
        phone = ?,
        email = ?,
        status = ?,
        date = ?
      WHERE id = ?
    `;
    const values = [name, idNo, expenseType, amount, phone, email, status, date, id];

    await executeQuery.executeQuery(query, values);
    res.status(200).json({ message: "Expense updated successfully" });
  } catch (error) {
    console.error("Error updating expense:", error);
    res.status(500).json({ message: "Error updating expense" });
  }
});

// Delete Expense(s) - DELETE endpoint
app.delete("/api/deleteExpenses", async (req, res) => {
  const { ids } = req.body;

  if (!ids || ids.length === 0) {
    return res.status(400).json({ message: "No expenses selected for deletion" });
  }

  try {
    const query = `
      DELETE FROM expenses 
      WHERE id IN (${ids.map(() => '?').join(',')})
    `;
    await executeQuery.executeQuery(query, ids);
    
    res.status(200).json({ message: "Expense(s) deleted successfully" });
  } catch (error) {
    console.error("Error deleting expenses:", error);
    res.status(500).json({ message: "Error deleting expenses" });
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
    console.log(req.body, "uygeuiywufbhbhj");
    const values = [day, Class, Subject, section, teacher, time, date, subjectType, Code];

    // Use the connection object to query the database
    pool.query(query, values, (err, result) => {
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
    pool.query(query, (err, result) => {
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
    pool.query(query, [id], (err, result) => {
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
    pool.query(query, (err, result) => {
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

// Edit Book
app.put("/api/editBook/:id", upload.single("image"), async (req, res) => {
  const bookId = req.params.id;
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

  try {
    // Check if book exists
    const checkQuery = "SELECT * FROM books WHERE id = ?";
    const [existingBook] = await executeQuery.executeQuery(checkQuery, [bookId]);

    if (!existingBook) {
      return res.status(404).json({ message: "Book not found" });
    }

    // Use existing image if no new file uploaded
    const image = req.file ? req.file.path : existingBook.image;

    const updateQuery = `
      UPDATE books 
      SET 
        title = ?,
        bookNumber = ?,
        publisher = ?,
        author = ?,
        rackNo = ?,
        quantity = ?,
        available = ?,
        description = ?,
        image = ?
      WHERE id = ?
    `;

    const values = [
      title,
      bookNumber,
      publisher,
      author,
      rackNo,
      quantity,
      available,
      description,
      image,
      bookId
    ];

    await executeQuery.executeQuery(updateQuery, values);
    res.status(200).json({ message: "Book updated successfully" });
  } catch (error) {
    console.error("Error updating book:", error);
    res.status(500).json({ message: "Error updating book" });
  }
});

// Delete Book
app.delete("/api/deleteBook/:id", async (req, res) => {
  const bookId = req.params.id;

  try {
    // Check if book exists
    const checkQuery = "SELECT * FROM books WHERE id = ?";
    const [existingBook] = await executeQuery.executeQuery(checkQuery, [bookId]);

    if (!existingBook) {
      return res.status(404).json({ message: "Book not found" });
    }

    const deleteQuery = "DELETE FROM books WHERE id = ?";
    await executeQuery.executeQuery(deleteQuery, [bookId]);
    
    res.status(200).json({ message: "Book deleted successfully" });
  } catch (error) {
    console.error("Error deleting book:", error);
    res.status(500).json({ message: "Error deleting book" });
  }
});



// Add Subject (POST)
app.post("/api/addSubject", async (req, res) => {
  console.log(req.body, "Received Subject");

  const { subjectName, selectClass, subjectDate } = req.body;

  try {
    // Create the SQL query to insert a new subject into the Subject table
    const query = `
      INSERT INTO Subjects (subjectName, selectClass, subjectDate)
      VALUES (?, ?, ?)
    `;
    const values = [subjectName,  selectClass, subjectDate];

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
    pool.query(query, (err, result) => {
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

// Edit Subject - PUT endpoint
app.put("/api/editSubject/:id", async (req, res) => {
  const { id } = req.params;
  const { subjectName, selectClass, subjectDate } = req.body;

  try {
    const query = `
      UPDATE Subjects 
      SET 
        subjectName = ?, 
        selectClass = ?, 
        subjectDate = ?
      WHERE id = ?
    `;
    const values = [subjectName, selectClass, subjectDate, id];

    await executeQuery.executeQuery(query, values);
    res.status(200).json({ message: "Subject updated successfully" });
  } catch (error) {
    console.error("Error updating subject:", error);
    res.status(500).json({ message: "Error updating subject" });
  }
});

// Delete Subject(s) - POST endpoint
app.post("/api/deleteSubjects", async (req, res) => {
  const { ids } = req.body;

  // Add validation for empty IDs
  if (!ids || ids.length === 0) {
    return res.status(400).json({ message: "No subjects selected for deletion" });
  }

  try {
    const query = `
      DELETE FROM Subjects 
      WHERE id IN (${ids.map(() => "?").join(",")})
    `;
    await executeQuery.executeQuery(query, ids);
    
    res.status(200).json({ message: "Subject(s) deleted successfully" });
  } catch (error) {
    console.error("Error deleting subjects:", error);
    res.status(500).json({ message: "Error deleting subjects" });
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
    pool.query(query, [ids], (err, result) => {
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
// app.post("/api/addusers", (req, res) => {
//   console.log(req.body, "Received user data");

//   const {
//     firstName,
//     lastName,
//     userType,
//     gender,
//     fatherName,
//     motherName,
//     dateOfBirth,
//     religion,
//     joiningDate,
//     email,
//     subject,
//     class: className,
//     section,
//     idNo,
//     phone,
//     address,
//     username,
//     password,
//   } = req.body;

//   // SQL query to insert new user
//   const query = `
//     INSERT INTO users (firstName, lastName, userType, gender, fatherName, motherName, dateOfBirth, religion, joiningDate, email, subject, class, section, idNo, phone, address)
//     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//   `;
//   const values = [
//     firstName,
//     lastName,
//     userType,
//     gender,
//     fatherName,
//     motherName,
//     dateOfBirth,
//     religion,
//     joiningDate,
//     email,
//     subject,
//     className,
//     section,
//     idNo,
//     phone,
//     address,
//   ];

//   // Directly execute the query
//   pool.query(query, values, (err, result) => {
//     if (err) {
//       console.error("Error adding user:", err);
//       res.status(500).json({ message: "Error adding user" });
//     } else {
//       res.status(200).json({ message: "User added successfully" });
//     }
//   });
// });

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
    username,
    password,
  } = req.body;

  // Start a database transaction
  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting database connection:", err);
      return res.status(500).json({ message: "Database connection error" });
    }

    // Begin the transaction
    connection.beginTransaction((err) => {
      if (err) {
        connection.release();
        console.error("Error starting transaction:", err);
        return res.status(500).json({ message: "Error starting transaction" });
      }

      // SQL query to insert new user into the `users` table
      const userQuery = `
        INSERT INTO users (firstName, lastName, userType, gender, fatherName, motherName, dateOfBirth, religion, joiningDate, email, subject, class, section, idNo, phone, address)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const userValues = [
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

      // Execute the `users` table insert
      connection.query(userQuery, userValues, (err, userResult) => {
        if (err) {
          return connection.rollback(() => {
            connection.release();
            console.error("Error adding user:", err);
            res.status(500).json({ message: "Error adding user" });
          });
        }

        // SQL query to insert login details into the `login` table
        const loginQuery = `
          INSERT INTO login (username, email, password, phone_number, role, user_initial)
          VALUES (?, ?, ?, ?, ?, ?)
        `;
        const loginValues = [
          username,
          email,
          password, // Ensure you hash the password before storing it in production
          phone,
          userType,
          userType.charAt(0), // Use the first letter of the first name as the initial
        ];

        // Execute the `login` table insert
        connection.query(loginQuery, loginValues, (err, loginResult) => {
          if (err) {
            return connection.rollback(() => {
              connection.release();
              console.error("Error adding login details:", err);
              res.status(500).json({ message: "Error adding login details" });
            });
          }

          // Commit the transaction if both inserts are successful
          connection.commit((err) => {
            if (err) {
              return connection.rollback(() => {
                connection.release();
                console.error("Error committing transaction:", err);
                res.status(500).json({ message: "Error committing transaction" });
              });
            }

            connection.release();
            res.status(200).json({ message: "User and login details added successfully" });
          });
        });
      });
    });
  });
});

// GET route to fetch all users
// app.get("/api/getusers", async (req, res) => {
//   try {
//     const query = "SELECT * FROM users"; // Query to fetch all users

//     // Use the connection object to query the database
//     pool.query(query, (err, result) => {
//       if (err) {
//         console.error("Error fetching users:", err);
//         return res.status(500).json({ message: "Error fetching users" });
//       }
//       res.status(200).json(result); // Send the users list as a response
//     });
//   } catch (error) {
//     console.error("Error fetching users:", error);
//     res.status(500).json({ message: "Error fetching users" });
//   }
// });

// GET route to fetch all users
app.get("/api/getusers", async (req, res) => {
  try {
    // Query to fetch all users with their corresponding login details
    const query = `
      SELECT 
        users.*, 
        login.username, 
        login.password 
      FROM 
        users 
      INNER JOIN 
        login 
      ON 
        users.email = login.email
    `;

    // Use the connection object to query the database
    pool.query(query, (err, result) => {
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
    pool.execute(query, values, (err, result) => {
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
    pool.query(query, (err, results) => {
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
    pool.execute(query, values, (err, result) => {
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

    pool.query(query, (err, result) => {
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

// Edit Fee - PUT endpoint
app.put('/api/editFee/:id', async (req, res) => {
  const { id } = req.params;
  const { studentName, classDiv, parentName, feeAmount, totalFeeReceived, feeOutstanding } = req.body;

  try {
    const query = `
      UPDATE fees 
      SET 
        studentName = ?,
        classDiv = ?,
        parentName = ?,
        feeAmount = ?,
        totalFeeReceived = ?,
        feeOutstanding = ?
      WHERE id = ?
    `;
    const values = [studentName, classDiv, parentName, feeAmount, totalFeeReceived, feeOutstanding, id];

    pool.execute(query, values, (err, result) => {
      if (err) {
        console.error('Error updating fee:', err);
        return res.status(500).json({ message: 'Error updating fee' });
      }
      res.status(200).json({ message: 'Fee updated successfully' });
    });
  } catch (error) {
    console.error('Error in try-catch block:', error);
    res.status(500).json({ message: 'Error updating fee' });
  }
});

// Delete Fee(s) - DELETE endpoint
app.delete('/api/deleteFees', async (req, res) => {
  const { ids } = req.body;

  if (!ids || ids.length === 0) {
    return res.status(400).json({ message: 'No fees selected for deletion' });
  }

  try {
    const query = `
      DELETE FROM fees 
      WHERE id IN (${ids.map(() => '?').join(',')})
    `;
    
    pool.execute(query, ids, (err, result) => {
      if (err) {
        console.error('Error deleting fees:', err);
        return res.status(500).json({ message: 'Error deleting fees' });
      }
      res.status(200).json({ message: 'Fee(s) deleted successfully' });
    });
  } catch (error) {
    console.error('Error in try-catch block:', error);
    res.status(500).json({ message: 'Error deleting fees' });
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
    INSERT INTO leave_requests (teacher, leaveType, duration, fromDate, toDate, reason, supporting_docs, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    teacher,
    leaveType,
    duration,
    fromDate,
    toDate,
    reason,
    JSON.stringify(supportingDocs), // Convert array to JSON string
    'Pending', // Default status
  ];

  try {
    const [result] = await pool.promise().query(query, values);
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
    const [rows] = await pool.promise().query(query);
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
    const [result] = await pool.promise().query(query, [status, id]);

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

    pool.query(
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

    pool.query(query, [parentId], (err, result) => {
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

  pool.query(query, (error, results) => {
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

// ✅ POST: Add/Update multiple student attendance records
app.post('/api/addAttendance', async (req, res) => {
  const attendanceRecords = req.body;

  if (!Array.isArray(attendanceRecords) || attendanceRecords.length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'Attendance records must be an array and cannot be empty' 
    });
  }

  try {
    // Convert the pool.query to Promise
    const query = (sql, values) => {
      return new Promise((resolve, reject) => {
        pool.query(sql, values, (error, results) => {
          if (error) reject(error);
          else resolve(results);
        });
      });
    };

    // First, check for existing records
    const recordPairs = attendanceRecords.map(({ Roll, attendanceDate }) => [Roll, attendanceDate]);
    
    // Modified query to handle multiple pairs
    const checkQuery = `
      SELECT Roll, DATE_FORMAT(attendanceDate, '%Y-%m-%d') as attendanceDate 
      FROM attendance 
      WHERE CONCAT(Roll, '-', DATE_FORMAT(attendanceDate, '%Y-%m-%d')) IN (?)
    `;

    const pairs = recordPairs.map(([roll, date]) => `${roll}-${date}`);
    
    const existingRecords = await query(checkQuery, [pairs]);

    // Create a Set of existing "Roll-Date" combinations for easy lookup
    const existingSet = new Set(
      existingRecords.map(record => `${record.Roll}-${record.attendanceDate}`)
    );

    // Separate records into updates and inserts
    const recordsToUpdate = [];
    const recordsToInsert = [];

    attendanceRecords.forEach(record => {
      const key = `${record.Roll}-${record.attendanceDate}`;
      if (existingSet.has(key)) {
        recordsToUpdate.push(record);
      } else {
        recordsToInsert.push(record);
      }
    });

    // Process updates
    if (recordsToUpdate.length > 0) {
      const updatePromises = recordsToUpdate.map(record => {
        const updateQuery = `
          UPDATE attendance 
          SET attendanceStatus = ? 
          WHERE Roll = ? AND attendanceDate = ?
        `;
        return query(updateQuery, [
          record.attendanceStatus,
          record.Roll,
          record.attendanceDate
        ]);
      });

      await Promise.all(updatePromises);
    }

    // Process inserts
    if (recordsToInsert.length > 0) {
      const insertQuery = `
        INSERT INTO attendance (Roll, attendanceDate, attendanceStatus)
        VALUES ?
      `;

      const values = recordsToInsert.map(({ Roll, attendanceDate, attendanceStatus }) => 
        [Roll, attendanceDate, attendanceStatus]
      );

      await query(insertQuery, [values]);
    }

    // Send response after all operations are complete
    res.status(200).json({ 
      success: true, 
      message: 'Attendance records processed successfully',
      updated: recordsToUpdate.length,
      inserted: recordsToInsert.length
    });

  } catch (error) {
    console.error('❌ Error processing attendance records:', error);
    
    // Send appropriate error message based on the error type
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'Duplicate attendance record found. Please refresh and try again.'
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Server error processing attendance records' 
    });
  }
});


// ✅ GET: Fetch attendance records
app.get('/api/getAttendance', (req, res) => {
  pool.query('SELECT * FROM attendance', (error, results) => {
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
  const { class: className, section, date } = req.query;

  if (!className || !section) {
    return res.status(400).json({ success: false, message: 'Class and Section are required' });
  }

  const query = `
  SELECT s.Roll, CONCAT(s.firstName, ' ', s.lastName) AS fullName, 
         COALESCE(a.attendanceStatus, 'Absent') AS attendanceStatus
  FROM students s
  LEFT JOIN attendance a ON s.Roll = a.Roll AND a.attendanceDate = ?
  WHERE s.Class = ? AND s.section = ?
`;
pool.query(query, [date, className, section], (error, results) => {
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


// ✅ GET: Fetch attendance records for teachers
app.get('/api/getTeacherAttendance', (req, res) => {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ success: false, message: 'Date is required' });
  }

  const query = `
    SELECT 
      t.employeeId, 
      CONCAT(t.firstName, ' ', t.lastName) AS name, 
      t.classname AS classname,  -- Use 'classname' instead of 'subject' or 'department'
      COALESCE(ta.attendanceStatus, 'absent') AS attendanceStatus
    FROM teachers t
    LEFT JOIN teacher_attendance ta 
      ON t.employeeId = ta.employeeId 
      AND ta.attendanceDate = ?
  `;

  pool.query(query, [date], (error, results) => {
    if (error) {
      console.error('❌ Error fetching teacher attendance records:', error);
      return res.status(500).json({ success: false, message: 'Server error fetching teacher attendance records' });
    }

    if (!results.length) {
      return res.status(404).json({ success: false, message: 'No attendance records found for the specified date' });
    }

    res.status(200).json({ success: true, attendance: results });
  });
});


// ✅ POST: Mark teacher attendance
app.post('/api/markTeacherAttendance', (req, res) => {
  const { employeeId, attendanceDate, attendanceStatus } = req.body;

  // Validate required fields
  if (!employeeId || !attendanceDate || !attendanceStatus) {
    return res.status(400).json({ success: false, message: 'Employee ID, Date, and Attendance Status are required' });
  }

  // Query to insert or update attendance
  const query = `
    INSERT INTO teacher_attendance (employeeId, attendanceDate, attendanceStatus)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE attendanceStatus = ?
  `;

  // Execute the query
  pool.query(query, [employeeId, attendanceDate, attendanceStatus, attendanceStatus], (error, results) => {
    if (error) {
      console.error('❌ Error marking teacher attendance:', error);
      return res.status(500).json({ success: false, message: 'Server error marking teacher attendance' });
    }

    // Success response
    res.status(200).json({ success: true, message: 'Attendance marked successfully' });
  });
});


// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
