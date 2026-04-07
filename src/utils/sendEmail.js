const nodemailer = require('nodemailer');
const { getConfigGroup } = require('./configHelper');

const sendEmail = async (options) => {
    // 1. Get SMTP settings from Database
    const smtpConfig = await getConfigGroup('SMTP');

    // 2. Create transporter using DB values
    const transporter = nodemailer.createTransport({
        host: smtpConfig.email_smtp_host,
        port: parseInt(smtpConfig.email_port),
        secure: parseInt(smtpConfig.email_port) === 465, // true for 465, false for 587
        auth: {
            user: smtpConfig.email_user,
            pass: smtpConfig.email_app_password,
        },
    });

    // 3. Define email options
    const mailOptions = {
        from: `"${smtpConfig.email_from_name}" <${smtpConfig.email_user}>`,
        to: options.email,
        subject: options.subject,
        html: options.message,
    };

    // 4. Actually send the email
    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;