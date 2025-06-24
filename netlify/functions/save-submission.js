// netlify/functions/save-submission.js
const { Pool } = require('pg');

let conn; // Use a single connection pool

// Helper to get database connection (lazy initialization)
async function getDbConnection() {
  if (!conn) {
    conn = new Pool({
      connectionString: process.env.NETLIFY_DATABASE_URL, // Using the corrected env var
      ssl: {
        rejectUnauthorized: false, // Required for NeonDB due to self-signed certs or specific configurations
      },
    });
  }
  return conn;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { parentName, childName, parentEmail, score, expectations, detailedResults, totalQuestions } = JSON.parse(event.body);

    if (!childName || !parentEmail || score === undefined || expectations === undefined || totalQuestions === undefined) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing required fields: childName, parentEmail, score, expectations, totalQuestions.' }),
      };
    }

    const pool = await getDbConnection();
    await pool.query(
      `INSERT INTO assessments (child_name, parent_name, parent_email, score, total_questions, expectations, detailed_results)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [childName, parentName, parentEmail, score, totalQuestions, expectations, JSON.stringify(detailedResults)] // detailedResults as JSONB
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Submission saved successfully!' }),
    };
  } catch (error) {
    console.error('Error saving submission:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to save submission.', error: error.message }),
    };
  }
};