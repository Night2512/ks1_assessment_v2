// netlify/functions/admin-auth.js
exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { password } = JSON.parse(event.body);

    const adminPassword = process.env.FRONTEND_PASSWORD; // Get password from Netlify environment variable

    if (!adminPassword) {
        console.error('FRONTEND_PASSWORD environment variable is not set for admin-auth function.');
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Server configuration error: Administrator password not set.' })
        };
    }

    if (password === adminPassword) {
        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: 'Authentication successful.' })
        };
    } else {
        return {
            statusCode: 401,
            body: JSON.stringify({ success: false, message: 'Invalid password.' })
        };
    }
};