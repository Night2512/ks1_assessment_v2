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
    // Corrected: Querying 'submitted_at' column instead of 'submission_time'
    // Also INCLUDE 'detailed_results' in the SELECT statement
    const result = await pool.query('SELECT id, child_name, parent_name, parent_email, score, total_questions, expectations, submitted_at, detailed_results FROM assessments ORDER BY submitted_at DESC');
    
    // Map the 'submitted_at' column to 'submission_time' for frontend consistency
    // And also include 'detailed_results' in the mapped object
    const submissions = result.rows.map(row => ({
      id: row.id,
      child_name: row.child_name,
      parent_name: row.parent_name,
      parent_email: row.parent_email,
      score: row.score,
      total_questions: row.total_questions,
      expectations: row.expectations,
      submission_time: new Date(row.submitted_at).toISOString(), // Use submitted_at and format
      detailed_results: row.detailed_results // Include detailed_results
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