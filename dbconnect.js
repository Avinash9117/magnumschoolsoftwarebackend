const mysql = require('mysql2');
const pool = mysql.createPool({
  host: 'sql8.freesqldatabase.com',
  port: 3306,
  user: 'sq18769734',
  password: '8pL5wqCvuX', // Use your MySQL password here
  database: 'sq18769734', // Ensure the database name is correct
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}).promise();
// Export a promisified pool


async function executeQuery(query, params = []) {
    try {
      const [rows] = await pool.query(query, params);
      return rows;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

module.exports = {executeQuery}
