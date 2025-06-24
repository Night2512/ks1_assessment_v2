const nodemailer = require('nodemailer');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { parentName, childName, parentEmail, resultsText, resultsHtml, keyStage } = JSON.parse(event.body);

    const smtpHost = process.env.SMTP2GO_HOST || 'mail.smtp2go.com';
    const smtpPort = parseInt(process.env.SMTP2GO_PORT || '2525', 10);
    const smtpUser = process.env.SMTP2GO_USER;
    const smtpPass = process.env.SMTP2GO_PASSWORD;

    const senderEmail = process.env.SENDER_EMAIL;
    const adminRecipientEmail = process.env.RECIPIENT_EMAIL;

    // Basic validation
    if (!smtpUser || !smtpPass) {
        console.error('SMTP2GO credentials not configured. SMTP_USER or SMTP_PASSWORD missing.');
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Server configuration error: SMTP credentials missing.' })
        };
    }
    if (!parentEmail || !senderEmail || !adminRecipientEmail) {
        console.error(`Missing required email addresses. Parent: ${parentEmail}, Sender: ${senderEmail}, Admin: ${adminRecipientEmail}`);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Server configuration error: Missing required email addresses for sending.' })
        };
    }
    if (!resultsText || !resultsHtml) {
        console.error('Missing email content. resultsText or resultsHtml is empty.');
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Missing email content for results.' })
        };
    }


    let transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465, // Use true for 465 (SSL/TLS), false for other ports like 587, 2525 (STARTTLS)
        auth: {
            user: smtpUser,
            pass: smtpPass
        },
        // tls: {
        //     // Only use rejectUnauthorized: false if you are absolutely sure and understand the security implications
        //     // For most production environments, it should be true or omitted if using well-known CAs
        //     rejectUnauthorized: false
        // }
    });

    const mailOptions = {
        from: senderEmail,
        to: parentEmail,
        bcc: adminRecipientEmail,
        replyTo: parentEmail,
        subject: `${keyStage} Assessment Results for ${childName}`,
        text: resultsText,
        html: resultsHtml
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        console.log('Preview URL (if available):', nodemailer.getTestMessageUrl(info)); // For testing with ethereal.email
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Email sent successfully!' })
        };
    } catch (error) {
        // Granular Error Reporting
        console.error(`Error sending email for ${parentEmail} (Child: ${childName}):`, {
            errorMessage: error.message,
            errorCode: error.code, // Nodemailer specific error code
            smtpResponse: error.response, // Raw SMTP response
            // stack: error.stack // Uncomment for more detailed debugging in logs
        });
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Failed to send email.', error: error.message })
        };
    }
};