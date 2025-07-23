const nodemailer = require('nodemailer');

// Create a transporter object using SMTP transport
const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.resend.com',
    port: 587,
    auth: {
      user: process.env.NODEMAILER_EMAIL,
      pass: process.env.NODEMAILER_PASSWORD
    }
  });
};

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content (optional)
 * @returns {Promise} - Promise resolving to the sent message info
 */
const sendEmail = async (options) => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: `"InQuill" <aliredamoumneh@gmail.com>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html || options.text
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Send a verification email to a user
 * @param {Object} user - User object
 * @param {string} token - Verification token
 * @returns {Promise} - Promise resolving to the sent message info
 */
const sendVerificationEmail = async (user, token) => {
  const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
  
  const mailOptions = {
    to: user.email,
    subject: 'InQuill - Verify Your Email Address',
    text: `Hello ${user.name || user.username},\n\nPlease verify your email address by clicking the link below:\n\n${verificationUrl}\n\nThis link will expire in 24 hours.\n\nIf you did not create an account with InQuill, please ignore this email.\n\nThank you,\nThe InQuill Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #4f46e5; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">InQuill</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
          <h2>Verify Your Email Address</h2>
          <p>Hello ${user.name || user.username},</p>
          <p>Thank you for signing up for InQuill. Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify Email Address</a>
          </div>
          <p>This link will expire in 24 hours.</p>
          <p>If you did not create an account with InQuill, please ignore this email.</p>
          <p>Thank you,<br>The InQuill Team</p>
        </div>
      </div>
    `
  };

  return sendEmail(mailOptions);
};

/**
 * Send a contact form submission email
 * @param {Object} contactData - Contact form data
 * @returns {Promise} - Promise resolving to the sent message info
 */
const sendContactFormEmail = async (contactData) => {
  const mailOptions = {
    to: process.env.NODEMAILER_RECIEVER, // Send to the site admin
    subject: `InQuill Contact Form: ${contactData.subject}`,
    text: `
      New contact form submission:
      
      Name: ${contactData.name}
      Email: ${contactData.email}
      ${contactData.phone ? `Phone: ${contactData.phone}` : ''}
      ${contactData.organization ? `Organization: ${contactData.organization}` : ''}
      Subject: ${contactData.subject}
      
      Message:
      ${contactData.message}
    `,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #4f46e5; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">InQuill Contact Form</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
          <h2>New Contact Form Submission</h2>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Name:</td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${contactData.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Email:</td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${contactData.email}</td>
            </tr>
            ${contactData.phone ? `
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Phone:</td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${contactData.phone}</td>
            </tr>
            ` : ''}
            ${contactData.organization ? `
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Organization:</td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${contactData.organization}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Subject:</td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${contactData.subject}</td>
            </tr>
          </table>
          
          <h3>Message:</h3>
          <p style="white-space: pre-line; background-color: #f9fafb; padding: 15px; border-radius: 4px;">${contactData.message}</p>
        </div>
      </div>
    `
  };

  return sendEmail(mailOptions);
};

/**
 * Send an auto-reply email to the contact form submitter
 * @param {Object} contactData - Contact form data
 * @returns {Promise} - Promise resolving to the sent message info
 */
const sendContactAutoReplyEmail = async (contactData) => {
  const mailOptions = {
    to: contactData.email,
    subject: 'Thank you for contacting InQuill',
    text: `
      Hello ${contactData.name},
      
      Thank you for contacting InQuill. We have received your message and will get back to you as soon as possible.
      
      Here's a summary of your inquiry:
      
      Subject: ${contactData.subject}
      Message: ${contactData.message}
      
      Our team typically responds within 24-48 hours during business days.
      
      Best regards,
      The InQuill Team
    `,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #4f46e5; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">InQuill</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
          <h2>Thank You for Contacting Us</h2>
          <p>Hello ${contactData.name},</p>
          <p>Thank you for contacting InQuill. We have received your message and will get back to you as soon as possible.</p>
          
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Your Message Summary:</h3>
            <p><strong>Subject:</strong> ${contactData.subject}</p>
            <p><strong>Message:</strong></p>
            <p style="white-space: pre-line;">${contactData.message}</p>
          </div>
          
          <p>Our team typically responds within 24-48 hours during business days.</p>
          <p>Best regards,<br>The InQuill Team</p>
        </div>
      </div>
    `
  };

  return sendEmail(mailOptions);
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendContactFormEmail,
  sendContactAutoReplyEmail
}; 