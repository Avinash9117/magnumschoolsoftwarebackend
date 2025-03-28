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
// app.use(cors());
app.use(cors({
  origin: ['http://localhost:3000', 'https://yoursite.com'], // ✅ Array for multiple origins
  methods: ['GET', 'POST', 'PUT', 'OPTIONS'], // ✅ Array of methods
  allowedHeaders: ['Content-Type', 'Authorization'], // ✅ Explicit headers
}));
app.use(bodyParser.json());

// Create a connection pool
const pool = mysql.createPool({
  host: 'sql8.freesqldatabase.com', // Replace with your database host
  port: 3306, // Replace with your database port
  user: '	sql8769734', // Replace with your database username
  password: '8pL5wqCvuX', // Replace with your database password
  database: 'sql8769734', // Replace with your database name
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
// app.post('/api/signup', async (req, res) => {
//   const { username, email, password, role } = req.body;

//   // Validate username's first character
//   if (!isValidUsername(username)) {
//     return res.status(400).json({ message: 'Username must start with A (Admin), P (Parent), T (Teacher), or S (Student)' });
//   }

//   // Generate the initial based on the role
//   let userInitial = '';
//   switch (role) {
//     case 'admin':
//       userInitial = 'A';
//       break;
//     case 'student':
//       userInitial = 'S';
//       break;
//     case 'teacher':
//       userInitial = 'T';
//       break;
//     case 'parent':
//       userInitial = 'P';
//       break;
//     default:
//       userInitial = 'U'; // Default to 'U' if role is not recognized
//   }

//   try {
//     const existingUser = await executeQuery.executeQuery(
//       'SELECT * FROM login WHERE username = ? OR email = ?',
//       [username, email]
//     );

//     if (existingUser.length > 0) {
//       return res.status(400).json({ message: 'User already exists' });
//     }

//     // Store the plain password directly in the database (not hashed)
//     const plainPassword = password;  // Plain password

//     // Insert the new user into the database with the plain password and the initial
//     await executeQuery.executeQuery(
//       'INSERT INTO login (username, email, password, role, user_initial) VALUES (?, ?, ?, ?, ?)',
//       [username, email, plainPassword, role, userInitial]
//     );

//     res.status(201).json({ message: 'User created successfully' });
//   } catch (err) {
//     console.error('Database error:', err);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// });

// Sample route for user login (Using JWT for authentication)
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  // // Validate username's first character
  // if (!isValidUsername(username)) {
  //   return res.status(400).json({ message: 'Username must start with A (Admin), P (Parent), T (Teacher), or S (Student)' });
  // }

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
        // if (!isValidUsername(username)) {
        //   return res.status(400).json({ message: 'Username must start with A (Admin), P (Parent), T (Teacher), or S (Student)' });
        // }

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
app.post('/api/addTeacher', upload.single('photo'), (req, res) => {
  const { firstName, lastName, gender, dob, employeeId, bloodGroup, religion, email, phoneNumber, address, classname, section, shortBio, salary } = req.body;
  const photoPath = req.file ? req.file.path : null;

  // Generate login credentials
  const username = employeeId;
  const password = `${employeeId}@${dob}`; // Note: You should hash this!
  const userInitial = firstName.charAt(0).toUpperCase();

  // Get a connection from the pool
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error getting database connection:', err);
      return res.status(500).json({ message: 'Database connection error' });
    }

    // Start transaction
    connection.beginTransaction((err) => {
      if (err) {
        connection.release();
        console.error('Error starting transaction:', err);
        return res.status(500).json({ message: 'Error starting transaction' });
      }

      // Insert into teachers table
      const teacherQuery = `
        INSERT INTO teachers (firstName, lastName, gender, dob, employeeId, bloodGroup, religion, email, phoneNumber, address, classname, section, shortBio, salary, photo)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const teacherValues = [
        firstName, lastName, gender, dob, employeeId, bloodGroup, religion, email, 
        phoneNumber, address, classname, section, shortBio, salary, photoPath
      ];

      // Execute teacher insert
      connection.query(teacherQuery, teacherValues, (err, teacherResult) => {
        if (err) {
          return connection.rollback(() => {
            connection.release();
            console.error('Error adding teacher:', err);
            res.status(500).json({ message: 'Error adding teacher' });
          });
        }

        // Insert into login table
        const loginQuery = `
          INSERT INTO login (username, email, password, phone_number, role, user_initial)
          VALUES (?, ?, ?, ?, ?, ?)
        `;
        const loginValues = [
          username, 
          email, 
          password,  // Remember to hash this in production!
          phoneNumber, 
          'teacher', 
          userInitial
        ];

        // Execute login insert
        connection.query(loginQuery, loginValues, (err, loginResult) => {
          if (err) {
            return connection.rollback(() => {
              connection.release();
              console.error('Error adding login credentials:', err);
              res.status(500).json({ message: 'Error adding login credentials' });
            });
          }

          // Commit transaction
          connection.commit((err) => {
            if (err) {
              return connection.rollback(() => {
                connection.release();
                console.error('Error committing transaction:', err);
                res.status(500).json({ message: 'Error committing transaction' });
              });
            }

            connection.release();
            res.status(200).json({ message: 'Teacher and login credentials added successfully!' });
          });
        });
      });
    });
  });
});

// Endpoint to get all teachers with correct photo URLs
app.get('/api/getTeachers', async (req, res) => {
  try {
    const query = 'SELECT employeeId, CONCAT(firstName, " ",  lastName) AS name, gender, classname, section, address, phoneNumber, email, photo, salary FROM teachers';
    const teachers = await executeQuery.executeQuery(query);

    res.status(200).json({ teachers: teachers });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({ message: 'Error fetching teachers.' });
  }
});


app.get('/api/getTeacher/:employeeId', async (req, res) => {
  try {
    const query = `
      SELECT firstName, lastName, gender, dob, employeeId, 
             bloodGroup, religion, email, classname, section, 
             address, phoneNumber, shortBio, salary, photo
      FROM teachers 
      WHERE employeeId = ?
    `;
    const [teacher] = await executeQuery.executeQuery(query, [req.params.employeeId]);

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    res.status(200).json(teacher);
  } catch (error) {
    console.error('Error fetching teacher:', error);
    res.status(500).json({ message: 'Error fetching teacher data' });
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
// app.post('/api/addStudent', upload.single('photo'), async (req, res) => {
//   const { firstName, lastName, gender, dob, Roll, bloodGroup, religion, email, Class, section, Admission, phoneNumber, shortBio } = req.body;

//   // Save the uploaded student's photo path
//   const photoPath = req.file ? req.file.path : null;

//   const query = `
//     INSERT INTO students (firstName, lastName, gender, dob, Roll, bloodGroup, religion, email, Class, section, Admission, phoneNumber, shortBio, photo)
//     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//   `;

//   const values = [
//     firstName, lastName, gender, dob, Roll, bloodGroup, religion, email, Class, section, Admission, phoneNumber, shortBio, photoPath,
//   ];

//   pool.query(query, values, (err, result) => {
//     if (err) {
//       console.error('Error adding student:', err);
//       return res.status(500).json({ message: 'Error adding student' });
//     }
//     res.status(200).json({ message: 'Student added successfully!' });
//   });
// });


// app.post('/api/addStudent', upload.single('photo'), async (req, res) => {
//   const { 
//     firstName, lastName, gender, dob, Roll, bloodGroup, religion, 
//     email, Class, section, Admission, phoneNumber, shortBio, parent_id 
//   } = req.body;

//   try {
//     // Validate parent
//     const [parent] = await pool.promise().query(
//       `SELECT id, numChildren FROM parents WHERE id = ?`,
//       [parent_id]
//     );

//     if (!parent.length) return res.status(400).json({ message: 'Parent not found' });
//     if (parent[0].numChildren >= 3) {
//       return res.status(400).json({ message: 'Parent has maximum 3 students' });
//     }

//     // Insert student
//     const [result] = await pool.promise().query(
//       `INSERT INTO students (
//         firstName, lastName, gender, dob, Roll, bloodGroup, religion,
//         email, Class, section, Admission, phoneNumber, shortBio, photo, parent_id
//       ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
//       [
//         firstName, lastName, gender, dob, Roll, bloodGroup, religion,
//         email, Class, section, Admission, phoneNumber, shortBio,
//         req.file?.path || null, parent_id
//       ]
//     );

//     // Update parent's child count
//     await pool.promise().query(
//       `UPDATE parents SET numChildren = numChildren + 1 WHERE id = ?`,
//       [parent_id]
//     );

//     res.status(200).json({ message: 'Student added successfully!' });
//   } catch (err) {
//     console.error('Error adding student:', err);
//     res.status(500).json({ message: 'Error adding student' });
//   }
// });

app.post('/api/addStudent', upload.single('photo'), (req, res) => {
  const { 
    firstName, lastName, gender, dob, Roll, bloodGroup, religion, 
    email, Class, section, Admission, phoneNumber, shortBio, parent_id 
  } = req.body;
  const photoPath = req.file ? req.file.path : null;

  // Generate login credentials
  const username = Admission;
  const password = `${Admission}@${dob}`; // Note: Hash this in production!
  const userInitial = firstName.charAt(0).toUpperCase();

  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error getting connection:', err);
      return res.status(500).json({ message: 'Database connection error' });
    }

    connection.beginTransaction((err) => {
      if (err) {
        connection.release();
        console.error('Error starting transaction:', err);
        return res.status(500).json({ message: 'Transaction error' });
      }

      // 1. Validate parent
      connection.query(
        'SELECT id, numChildren FROM parents WHERE id = ?',
        [parent_id],
        (err, parentResults) => {
          if (err) {
            return connection.rollback(() => {
              connection.release();
              console.error('Parent validation error:', err);
              res.status(500).json({ message: 'Parent validation failed' });
            });
          }

          if (parentResults.length === 0) {
            return connection.rollback(() => {
              connection.release();
              res.status(404).json({ message: 'Parent not found' });
            });
          }

          if (parentResults[0].numChildren >= 3) {
            return connection.rollback(() => {
              connection.release();
              res.status(400).json({ message: 'Parent has maximum 3 students' });
            });
          }

          // 2. Insert student
          const studentQuery = `
            INSERT INTO students (
              firstName, lastName, gender, dob, Roll, bloodGroup, religion,
              email, Class, section, Admission, phoneNumber, shortBio, photo, parent_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
          const studentValues = [
            firstName, lastName, gender, dob, Roll, bloodGroup, religion,
            email, Class, section, Admission, phoneNumber, shortBio, photoPath, parent_id
          ];

          connection.query(studentQuery, studentValues, (err, studentResult) => {
            if (err) {
              return connection.rollback(() => {
                connection.release();
                console.error('Student insert error:', err);
                res.status(500).json({ message: 'Error adding student' });
              });
            }

            // 3. Update parent's child count
            connection.query(
              'UPDATE parents SET numChildren = numChildren + 1 WHERE id = ?',
              [parent_id],
              (err, updateResult) => {
                if (err) {
                  return connection.rollback(() => {
                    connection.release();
                    console.error('Parent update error:', err);
                    res.status(500).json({ message: 'Error updating parent' });
                  });
                }

                // 4. Add login credentials
                const loginQuery = `
                  INSERT INTO login (username, email, password, phone_number, role, user_initial)
                  VALUES (?, ?, ?, ?, ?, ?)
                `;
                const loginValues = [
                  username,
                  email,
                  password, // Remember to hash this!
                  phoneNumber,
                  'student',
                  userInitial
                ];

                connection.query(loginQuery, loginValues, (err, loginResult) => {
                  if (err) {
                    return connection.rollback(() => {
                      connection.release();
                      console.error('Login creation error:', err);
                      res.status(500).json({ message: 'Error creating login' });
                    });
                  }

                  // Commit transaction
                  connection.commit((err) => {
                    if (err) {
                      return connection.rollback(() => {
                        connection.release();
                        console.error('Commit error:', err);
                        res.status(500).json({ message: 'Commit failed' });
                      });
                    }

                    connection.release();
                    res.status(200).json({ message: 'Student added with login credentials!' });
                  });
                });
              }
            );
          });
        }
      );
    });
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

app.get('/api/getStudentByRoll/:roll', async (req, res) => {
  const { roll } = req.params;

  try {
    // Get student data
    const [student] = await pool.promise().query(
      `SELECT * FROM students WHERE Roll = ?`,
      [roll]
    );

    if (!student.length) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get parent data
    const [parent] = await pool.promise().query(
      `SELECT * FROM parents WHERE id = ?`,
      [student[0].parent_id]
    );

    // Combine data
    const response = {
      student: student[0],
      parent: parent[0] || null
    };

    // Convert photo path to absolute URL if needed
    if (response.student.photo) {
      response.student.photo = `${req.protocol}://${req.get('host')}/${response.student.photo}`;
    }

    res.status(200).json(response);
    
  } catch (err) {
    console.error('Error fetching student:', err);
    res.status(500).json({ message: 'Error fetching student data' });
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
// app.post('/api/addParent', upload.single('photo'), async (req, res) => {
//   const { firstName, lastName, gender, occupation, idNumber, bloodGroup, religion, email, phoneNumber, address, shortBio, numChildren } = req.body;
//   const photoPath = req.file ? req.file.path : null;

//   const query = `
//     INSERT INTO parents (firstName, lastName, gender, occupation, idNumber, bloodGroup, religion, email, phoneNumber, address, shortBio, photo,numChildren)
//     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)
//   `;

//   const values = [
//     firstName, lastName, gender, occupation, idNumber, bloodGroup, religion, email, phoneNumber, address, shortBio, photoPath, numChildren,
//   ];

//   pool.query(query, values, (err, result) => {
//     if (err) {
//       console.error('Error adding parent:', err);
//       return res.status(500).json({ message: 'Error adding parent' });
//     }
//     res.status(200).json({ message: 'Parent added successfully!' });
//   });
// });

app.post('/api/addParent', upload.single('photo'), (req, res) => {
  const { firstName, lastName, gender, occupation, idNumber, bloodGroup, religion, email, phoneNumber, address, shortBio, numChildren } = req.body;
  const photoPath = req.file ? req.file.path : null;

  // Generate login credentials
  const username = idNumber;
  const password = `${idNumber}@${phoneNumber}`; // Note: Remember to hash this in production!
  const userInitial = firstName.charAt(0).toUpperCase();

  // Get a connection from the pool
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error getting database connection:', err);
      return res.status(500).json({ message: 'Database connection error' });
    }

    // Start transaction
    connection.beginTransaction((err) => {
      if (err) {
        connection.release();
        console.error('Error starting transaction:', err);
        return res.status(500).json({ message: 'Error starting transaction' });
      }

      // Insert into parents table
      const parentQuery = `
        INSERT INTO parents (firstName, lastName, gender, occupation, idNumber, bloodGroup, religion, email, phoneNumber, address, shortBio, photo, numChildren)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const parentValues = [
        firstName, lastName, gender, occupation, idNumber, bloodGroup, religion, email,
        phoneNumber, address, shortBio, photoPath, numChildren
      ];

      // Execute parent insert
      connection.query(parentQuery, parentValues, (err, parentResult) => {
        if (err) {
          return connection.rollback(() => {
            connection.release();
            console.error('Error adding parent:', err);
            res.status(500).json({ message: 'Error adding parent' });
          });
        }

        // Insert into login table
        const loginQuery = `
          INSERT INTO login (username, email, password, phone_number, role, user_initial)
          VALUES (?, ?, ?, ?, ?, ?)
        `;
        const loginValues = [
          username,
          email,
          password,  // Remember to hash this in production!
          phoneNumber,
          'parent',
          userInitial
        ];

        // Execute login insert
        connection.query(loginQuery, loginValues, (err, loginResult) => {
          if (err) {
            return connection.rollback(() => {
              connection.release();
              console.error('Error adding login credentials:', err);
              res.status(500).json({ message: 'Error adding login credentials' });
            });
          }

          // Commit transaction
          connection.commit((err) => {
            if (err) {
              return connection.rollback(() => {
                connection.release();
                console.error('Error committing transaction:', err);
                res.status(500).json({ message: 'Error committing transaction' });
              });
            }

            connection.release();
            res.status(200).json({ message: 'Parent and login credentials added successfully!' });
          });
        });
      });
    });
  });
});

// Endpoint to get all parents with correct photo URLs
app.get('/api/getParents', async (req, res) => {
  try {
    const query = `
      SELECT 
        id,
        idNumber, 
        CONCAT(firstName, ' ', lastName) AS name, 
        occupation, 
        phoneNumber, 
        email, 
        gender, 
        photo,
        numChildren 
      FROM parents
    `;

    const [results] = await pool.promise().query(query);
    res.status(200).json({ parents: results });
  } catch (error) {
    console.error('Error fetching parents:', error);
    res.status(500).json({ message: 'Error fetching parents' });
  }
});


// for student admission form

app.get('/api/parents', async (req, res) => {
  try {
    const [parents] = await pool.promise().query(`
      SELECT id, CONCAT(firstName, ' ', lastName) AS name, numChildren 
      FROM parents
    `);
    res.status(200).json({ parents });
  } catch (err) {
    console.error('Error fetching parents:', err);
    res.status(500).json({ message: 'Error fetching parents' });
  }
});

// Updated endpoint using promises
app.get('/api/getParentChildren/:parentId', async (req, res) => {
  try {
    const [rows] = await pool.promise().query(
      'SELECT id, Roll, firstName, lastName FROM students WHERE parent_id = ?',
      [req.params.parentId]
    );
    
    res.status(200).json(rows);
  } catch (err) {
    console.error('Error fetching children:', err);
    res.status(500).json({ 
      message: 'Error fetching children',
      error: err.message
    });
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
    const query = "SELECT SUM(total_paid) AS count FROM fee_structures;";
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
// Get all class routines
app.get('/api/getClassRoutine', async (req, res) => {
  try {
    const query = `
      SELECT 
        class, 
        section, 
        DATE_FORMAT(date, '%Y-%m-%d') AS date, 
        day, 
        TIME_FORMAT(start_time, '%H:%i') AS start_time,
        TIME_FORMAT(end_time, '%H:%i') AS end_time,
        subject,
        teacher,
        is_substituted
      FROM class_routines
    `;
    
    const [results] = await pool.promise().query(query);
    
    // Reconstruct the nested schedule structure with boolean conversion
    const schedules = {};
    results.forEach((row) => {
      const { 
        class: cls, 
        section, 
        date, 
        day, 
        start_time, 
        end_time, 
        subject, 
        teacher, 
        is_substituted 
      } = row;
      
      const timeSlot = `${start_time} - ${end_time}`;
      
      // Convert TINYINT(1) to boolean
      const isSubstituted = Boolean(is_substituted);
      
      // Build nested structure
      schedules[cls] = schedules[cls] || {};
      schedules[cls][section] = schedules[cls][section] || {};
      schedules[cls][section][date] = schedules[cls][section][date] || {};
      schedules[cls][section][date][day] = schedules[cls][section][date][day] || {};
      
      schedules[cls][section][date][day][timeSlot] = {
        subject,
        teacher,
        isSubstituted // Now properly boolean
      };
    });

    res.status(200).json(schedules);
  } catch (error) {
    console.error('Error fetching class routines:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Save all class routines
app.post('/api/saveClassRoutine', async (req, res) => {
  const { schedules } = req.body;
  
  if (!schedules) {
    return res.status(400).json({ error: 'Schedules data is required' });
  }

  const connection = await pool.promise().getConnection();
  try {
    await connection.beginTransaction();

    // Clear existing data
    await connection.query('DELETE FROM class_routines');

    // Prepare batch insert data
    const insertData = [];
    for (const [className, sections] of Object.entries(schedules)) {
      for (const [sectionName, dates] of Object.entries(sections)) {
        for (const [dateString, days] of Object.entries(dates)) {
          for (const [dayName, timeSlots] of Object.entries(days)) {
            for (const [timeRange, slotData] of Object.entries(timeSlots)) {
              const [startTime, endTime] = timeRange.split(' - ');
              
              insertData.push([
                className,
                sectionName,
                dateString,
                dayName,
                startTime,
                endTime,
                slotData.subject || '',
                slotData.teacher || '',
                Boolean(slotData.isSubstituted)
              ]);
            }
          }
        }
      }
    }

    // Batch insert if there's data
    if (insertData.length > 0) {
      await connection.query(
        `INSERT INTO class_routines 
          (class, section, date, day, start_time, end_time, subject, teacher, is_substituted)
         VALUES ?`,
        [insertData]
      );
    }

    await connection.commit();
    res.status(200).json({ message: 'Class routines saved successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error saving class routines:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    connection.release();
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
// app.get('/api/getFees', async (req, res) => {
//   try {
//     // SQL query to fetch all fees from the database
//     const query = 'SELECT * FROM fees';

//     pool.query(query, (err, result) => {
//       if (err) {
//         console.error('Error fetching fees:', err);
//         return res.status(500).json({ message: 'Error fetching fees' });
//       }
//       console.log('Fees fetched successfully');
//       res.status(200).json(result); // Send the fetched fee data as a response
//     });
//   } catch (error) {
//     console.error('Error in try-catch block:', error);
//     res.status(500).json({ message: 'Error fetching fees' });
//   }
// });

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
      WHERE idNumber = ?
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
    const query = `DELETE FROM Parents WHERE idNumber = ?`;

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

// GET Attendance Summary
app.get('/api/getAttendanceSummary/:roll', async (req, res) => {
  try {
    const roll = req.params.roll;
    
    // First get total days
    const totalQuery = `
      SELECT COUNT(*) AS totalDays 
      FROM attendance 
      WHERE Roll = ?
    `;
    
    // Then get present days
    const presentQuery = `
      SELECT COUNT(*) AS presentDays 
      FROM attendance 
      WHERE Roll = ? AND attendanceStatus = 'Present'
    `;

    // Execute both queries in parallel
    const [totalResult, presentResult] = await Promise.all([
      pool.promise().query(totalQuery, [roll]),
      pool.promise().query(presentQuery, [roll])
    ]);

    const totalDays = totalResult[0][0].totalDays;
    const presentDays = presentResult[0][0].presentDays;

    res.json({
      success: true,
      totalDays,
      presentDays,
      absentDays: totalDays - presentDays
    });
    
  } catch (error) {
    console.error('Error fetching attendance summary:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching attendance summary' 
    });
  }
});

// ✅ GET: Fetch students based on Class & Section
app.get('/api/students', (req, res) => {
  const { class: className, section, date } = req.query;

  if (!className || !section) {
    return res.status(400).json({ success: false, message: 'Class and Section are required' });
  }

  const query = `
  SELECT s.Roll, CONCAT(s.firstName, ' ', s.lastName) AS fullName, s.gender, s.photo,
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


// ✅ GET: Fetch single teacher's monthly attendance summary
app.get('/api/teacher/monthly-attendance', (req, res) => {
  const { employeeId, month } = req.query;

  if (!employeeId || !month) {
    return res.status(400).json({ 
      success: false, 
      message: 'Employee ID and Month are required' 
    });
  }

  const query = `
    SELECT 
      COUNT(*) AS totalDays,
      SUM(CASE WHEN attendanceStatus = 'present' THEN 1 ELSE 0 END) AS presentDays,
      SUM(CASE WHEN attendanceStatus = 'absent' THEN 1 ELSE 0 END) AS absentDays
    FROM teacher_attendance
    WHERE employeeId = ?
      AND DATE_FORMAT(attendanceDate, '%Y-%m') = ?
  `;

  pool.query(query, [employeeId, month], (error, results) => {
    if (error) {
      console.error('❌ Error fetching monthly attendance:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Server error fetching monthly attendance' 
      });
    }

    const data = results[0];
    data.totalDays = Number(data.totalDays);
    data.presentDays = Number(data.presentDays);
    data.absentDays = Number(data.absentDays);

    res.status(200).json({ success: true, ...data });
  });
});

// ✅ GET: Check today's attendance status for a teacher
app.get('/api/teacher/daily-attendance', (req, res) => {
  const { employeeId } = req.query;
  const today = new Date().toISOString().split('T')[0];

  if (!employeeId) {
    return res.status(400).json({ 
      success: false, 
      message: 'Employee ID is required' 
    });
  }

  const query = `
    SELECT attendanceStatus 
    FROM teacher_attendance
    WHERE employeeId = ?
      AND attendanceDate = ?
    LIMIT 1
  `;

  pool.query(query, [employeeId, today], (error, results) => {
    if (error) {
      console.error('❌ Error fetching daily attendance:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Server error fetching daily attendance' 
      });
    }

    res.status(200).json({ 
      success: true, 
      status: results[0]?.attendanceStatus || 'not-marked' 
    });
  });
});


// Store exam result
app.post('/api/storeResult', async (req, res) => {
  try {
      const { rollNumber, examType, subjects, totalMarks, marksObtained, percentage, grade } = req.body;

      const [result] = await pool.promise().query(
          `INSERT INTO exam_results 
          (roll_number, exam_type, subjects, total_marks, marks_obtained, percentage, grade)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
              rollNumber,
              examType,
              JSON.stringify(subjects),
              totalMarks,
              marksObtained,
              percentage,
              grade
          ]
      );

      res.status(201).json({
          success: true,
          message: 'Result stored successfully',
          resultId: result.insertId
      });
  } catch (error) {
      console.error('Database error:', error);
      res.status(500).json({
          success: false,
          message: 'Failed to store result',
          error: error.message
      });
  }
});

// for admin view subject wise performance
app.get('/api/subjectPerformance', async (req, res) => {
  try {
    const [results] = await pool.promise().query('SELECT subjects FROM exam_results');
    const subjectStats = {};

    results.forEach(row => {
      try {
        // Handle both stringified JSON and already parsed objects
        let subjects;
        if (typeof row.subjects === 'string') {
          subjects = JSON.parse(row.subjects);
        } else if (Array.isArray(row.subjects)) {
          subjects = row.subjects;
        } else {
          console.error('Invalid subjects format:', row.subjects);
          return;
        }

        // Debug: Log sample data structure
        if (!subjectStats._loggedSample) {
          console.log('Sample subjects data:', subjects);
          subjectStats._loggedSample = true;
        }

        subjects.forEach(({ subject, marks }) => {
          if (!subject || typeof marks !== 'number') {
            console.warn('Invalid subject entry:', { subject, marks });
            return;
          }

          if (!subjectStats[subject]) {
            subjectStats[subject] = {
              totalMarks: 0,
              studentCount: 0,
              passes: 0
            };
          }

          subjectStats[subject].totalMarks += marks;
          subjectStats[subject].studentCount++;
          if (marks >= 40) subjectStats[subject].passes++;
        });
      } catch (error) {
        console.error('Error processing row:', error);
        console.log('Problematic row data:', row.subjects);
      }
    });

    // Format response
    const performance = Object.entries(subjectStats).map(([subject, data]) => ({
      subject,
      averagePercentage: (data.totalMarks / data.studentCount).toFixed(2),
      passPercentage: ((data.passes / data.studentCount) * 100).toFixed(2),
      totalStudents: data.studentCount
    }));

    res.status(200).json({
      success: true,
      data: performance.sort((a, b) => b.averagePercentage - a.averagePercentage)
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get results by roll number
app.get('/api/getResults/:rollNumber', async (req, res) => {
  try {
      const [results] = await pool.promise().query(
          `SELECT * FROM exam_results 
          WHERE roll_number = ? 
          ORDER BY created_at DESC`,
          [req.params.rollNumber]
      );

      const parsedResults = results.map(row => {
          // Convert percentage to number
          const percentage = parseFloat(row.percentage) || 0; // Fallback to 0 if conversion fails
          
          // Parse subjects JSON
          let subjects = [];
          try {
              subjects = typeof row.subjects === 'string' 
                  ? JSON.parse(row.subjects)
                  : row.subjects;
          } catch (error) {
              console.error('Failed to parse subjects:', row.subjects);
          }

          return {
              ...row,
              percentage, // Numeric value
              subjects,
              created_at: row.created_at.toISOString(),
              updated_at: row.updated_at?.toISOString() || null
          };
      });

      res.json({
          success: true,
          results: parsedResults
      });
  } catch (error) {
      console.error('Database error:', error);
      res.status(500).json({
          success: false,
          message: 'Failed to fetch results',
          error: error.message
      });
  }
});

// GET: Get student results with name by roll number
app.get('/api/getStudentResults/:rollNumber', async (req, res) => {
  try {
    // First get student details
    const [student] = await pool.promise().query(
      `SELECT s.Class, s.section, CONCAT(s.firstName, ' ', s.lastName) AS fullName 
       FROM students s
       WHERE s.Roll = ?`,
      [req.params.rollNumber]
    );

    if (!student.length) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Then get results
    const [results] = await pool.promise().query(
      `SELECT * FROM exam_results 
       WHERE roll_number = ? 
       ORDER BY created_at DESC`,
      [req.params.rollNumber]
    );

    // Parse results with student details
    const parsedResults = results.map(row => ({
      ...row,
      studentName: student[0].fullName,
      className: student[0].Class,
      section: student[0].section,
      subjects: typeof row.subjects === 'string' ? JSON.parse(row.subjects) : row.subjects
    }));

    res.json({
      success: true,
      results: parsedResults
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});


// Get teachers with payment status
app.get('/getTeachersWithPayroll', async (req, res) => {
  try {
    const { month, year } = req.query;
    
    const query = `
      SELECT t.*, 
        COALESCE(p.status, 'Unpaid') as status,
        p.month as payment_month,
        p.year as payment_year
      FROM teachers t
      LEFT JOIN payroll p 
        ON t.employeeId = p.teacher_id
        ${month && year ? `AND p.month = ? AND p.year = ?` : ''}
    `;

    const params = month && year ? [month, year] : [];
    
    // Use `pool.promise().query()` instead of `connection.execute()`
    const [teachers] = await pool.promise().query(query, params);
    
    res.json({ teachers });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update payment status endpoint - Improved version
app.put('/updatePaymentStatus', async (req, res) => {
  try {
    const { teacherId, month, year, status } = req.body;
    
    // Validate input
    if (!teacherId || !month || !year || !status) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Add transaction support
    const connection = await pool.promise().getConnection();
    
    try {
      await connection.beginTransaction();

      // Check for existing record
      const [existing] = await connection.query(
        `SELECT * FROM payroll 
        WHERE teacher_id = ? AND month = ? AND year = ?`,
        [teacherId, month, year]
      );

      if (existing.length > 0) {
        // Update existing record
        await connection.query(
          `UPDATE payroll SET 
            status = ?, 
            payment_date = CURRENT_TIMESTAMP()
          WHERE id = ?`,
          [status, existing[0].id]
        );
      } else {
        // Create new record
        await connection.query(
          `INSERT INTO payroll 
            (teacher_id, month, year, status, payment_date)
          VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP())`,
          [teacherId, month, year, status]
        );
      }

      await connection.commit();
      res.json({ success: true });
    } catch (transactionError) {
      await connection.rollback();
      throw transactionError;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      error: error.message,
      code: error.code,
      sql: error.sql 
    });
  }
});



// ======================
// Fee Structure Endpoints
// ======================
app.post('/api/fees', async (req, res) => {
  const { rollNumber, academicYear, totalFee } = req.body;
  
  try {
    if (!rollNumber || !academicYear || !totalFee) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Check existing fee structure
    const [existing] = await pool.promise().query(
      `SELECT id FROM fee_structures 
       WHERE student_roll = ? AND academic_year = ?`,
      [rollNumber, academicYear]
    );

    if (existing.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Fee structure exists for this academic year' 
      });
    }

    // Create new fee structure
    const [result] = await pool.promise().query(
      `INSERT INTO fee_structures 
       (student_roll, academic_year, total_fee, outstanding)
       VALUES (?, ?, ?, ?)`,
      [rollNumber, academicYear, totalFee, totalFee]
    );

    res.status(201).json({
      success: true,
      message: 'Fee structure created',
      feeId: result.insertId
    });

  } catch (error) {
    console.error('Fee structure error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

app.get('/api/fees/:roll', async (req, res) => {
  try {
    const [results] = await pool.promise().query(
      `SELECT * FROM fee_structures 
       WHERE student_roll = ?
       ORDER BY academic_year DESC`,
      [req.params.roll]
    );

    // Ensure we always return an array
    const formatted = results.map(fee => ({
      id: fee.id,
      academicYear: fee.academic_year,
      totalFee: fee.total_fee || 0,  // Ensure numerical values
      paid: fee.total_paid || 0,
      outstanding: fee.outstanding || 0,
      createdAt: fee.created_at
    }));

    res.json({ 
      success: true, 
      data: formatted // This should be an array
    });

  } catch (error) {
    console.error('Get fees error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

// ======================
// Payment Endpoints
// ======================
app.post('/api/payments', async (req, res) => {
  const { rollNumber, amount, paymentMode, receiptNumber } = req.body;
  let connection;

  try {
    // Validate input
    if (!rollNumber || !amount || !paymentMode || !receiptNumber) {
      return res.status(400).json({ 
        success: false, 
        message: 'All payment fields are required' 
      });
    }

    // Get connection from promise pool
    connection = await pool.promise().getConnection(); // Changed this line
    
    await connection.beginTransaction();

    // Get latest fee structure
    const [feeStructures] = await connection.query(
      `SELECT id, total_fee, total_paid 
       FROM fee_structures 
       WHERE student_roll = ?
       ORDER BY academic_year DESC 
       LIMIT 1`,
      [rollNumber]
    );

    if (feeStructures.length === 0) {
      await connection.rollback();
      return res.status(404).json({ 
        success: false, 
        message: 'No active fee structure found for student' 
      });
    }

    const fee = feeStructures[0];
    const numericAmount = parseFloat(amount);
    const newTotalPaid = parseFloat(fee.total_paid) + numericAmount;
    const outstanding = parseFloat(fee.total_fee) - newTotalPaid;

    if (numericAmount > outstanding) {
      await connection.rollback();
      return res.status(400).json({ 
        success: false, 
        message: `Payment amount exceeds outstanding balance of ₹${outstanding}` 
      });
    }

    // Record payment
    const [paymentResult] = await connection.query(
      `INSERT INTO payments 
       (fee_id, amount_paid, payment_mode, receipt_number, payment_date)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`, // Added CURRENT_TIMESTAMP
      [fee.id, numericAmount, paymentMode, receiptNumber]
    );

    // Update fee structure
    await connection.query(
      `UPDATE fee_structures 
       SET total_paid = ?, outstanding = ?
       WHERE id = ?`,
      [newTotalPaid, outstanding, fee.id]
    );

    await connection.commit();

    res.json({
      success: true,
      message: 'Payment recorded successfully',
      paymentId: paymentResult.insertId,
      newBalance: outstanding.toFixed(2)
    });

  } catch (error) {
    console.error('Payment Error:', error);
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    res.status(500).json({ 
      success: false, 
      message: 'Payment processing failed',
      error: error.message 
    });
  } finally {
    if (connection) connection.release();
  }
});

app.get('/api/payments/:roll', async (req, res) => {
  try {
    const [results] = await pool.promise().query(
      `SELECT p.*, f.academic_year 
       FROM payments p
       JOIN fee_structures f ON p.fee_id = f.id
       WHERE f.student_roll = ?
       ORDER BY p.created_at DESC`,
      [req.params.roll]
    );

    const formatted = results.map(payment => ({
      id: payment.id,
      amount: Number(payment.amount_paid) || 0, // Convert to number
      mode: payment.payment_mode,
      receiptNumber: payment.receipt_number,
      date: payment.created_at,
      academicYear: payment.academic_year
    }));

    res.json({ success: true, data: formatted });

  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

// Add this endpoint in the Fee Structure Endpoints section
app.get('/api/getFees', async (req, res) => {
  try {
    const [results] = await pool.promise().query(
      `SELECT * FROM fee_structures`
    );

    // Format data to match frontend expectations
    const formatted = results.map(fee => ({
      id: fee.id,
      student_roll: fee.student_roll,
      academic_year: fee.academic_year,
      feeAmount: Number(fee.total_fee) || 0,       // Frontend expects 'feeAmount'
      totalFeeReceived: Number(fee.total_paid) || 0, // Frontend expects 'totalFeeReceived'
      outstanding: Number(fee.outstanding) || 0,
      created_at: fee.created_at,
      updated_at: fee.updated_at
    }));

    res.json({ 
      success: true, 
      data: formatted 
    });

  } catch (error) {
    console.error('Get all fees error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});


// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
