// netlify/functions/get-submissions.js
const { Pool } = require('pg');

let conn;

// Helper to get database connection (lazy initialization)
async function getDbConnection() {
  if (!conn) {
    conn = new Pool({
      connectionString: process.env.NETLIFY_DATABASE_URL, // Corrected env var
      ssl: {
        rejectUnauthorized: false, // Required for NeonDB due to self-signed certs or specific configurations
      },
    });
  }
  return conn;
}

exports.handler = async (event, context) => {
  // Basic Authentication (validating against FRONTEND_PASSWORD from env vars)
  const authHeader = event.headers.authorization;
  const expectedPassword = process.env.FRONTEND_PASSWORD;

  if (!authHeader || !expectedPassword || authHeader !== `Bearer ${expectedPassword}`) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: 'Unauthorized' }),
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  try {
    const pool = await getDbConnection();
    // Querying the 'assessments' table
    const result = await pool.query('SELECT id, child_name, parent_name, parent_email, score, total_questions, expectations, submission_time FROM assessments ORDER BY submission_time DESC');
    
    // Convert submission_time to ISO string or a more readable format if needed by frontend
    const submissions = result.rows.map(row => ({
      ...row,
      submission_time: new Date(row.submission_time).toISOString(), // Or .toLocaleString()
    }));

    return {
      statusCode: 200,
      body: JSON.stringify(submissions),
    };
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to fetch submissions', error: error.message }),
    };
  }
};