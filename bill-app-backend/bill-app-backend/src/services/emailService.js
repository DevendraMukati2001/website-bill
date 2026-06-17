const nodemailer = require("nodemailer");

// Create transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send birthday discount email to client
 * @param {Object} client - { name, email }
 * @param {Number} discountAmount - calculated 5% amount
 * @param {String} invoiceNumber - optional
 */
const sendBirthdayDiscountEmail = async (
  client,
  discountAmount,
  invoiceNumber = "",
) => {
  if (!client?.email) return; // email nahi hai toh skip

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: client.email,
      subject: `🎂 Happy Birthday ${client.name}! Special discount from Binjwa IT Solutions`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fffbeb; border-radius: 12px; overflow: hidden;">
          
          <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 30px; text-align: center;">
            <div style="font-size: 48px;">🎂</div>
            <h1 style="color: white; margin: 10px 0 0; font-size: 26px;">
              Happy Birthday, ${client.name}!
            </h1>
          </div>

          <div style="padding: 30px; color: #374151;">
            <p style="font-size: 16px; line-height: 1.6;">
              Wishing you a wonderful birthday! 🎉

As a special birthday offer from Binjwa IT Solutions, 
you have received an exclusive <strong style="color: #d97706;">30% OFF on AI Agent Services</strong> 🚀
              on your invoice today.
            </p>

            <div style="background: #fff; border: 2px dashed #fbbf24; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center;">
             <p style="margin: 0; font-size: 13px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px;">
  SPECIAL BIRTHDAY OFFER
</p>

<p style="margin-top: 10px; font-size: 15px; color: #374151; font-weight: 600;">
  On AI Agent 
</p>
              ${invoiceNumber ? `<p style="margin: 6px 0 0; font-size: 12px; color: #6b7280;">Invoice #${invoiceNumber}</p>` : ""}
            </div>

            <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">
              Thank you for your continued trust in Binjwa IT Solutions.
              We look forward to serving you for many more years to come! 🚀
            </p>

            <hr style="border: none; border-top: 1px solid #fde68a; margin: 24px 0;">
            
            <p style="font-size: 12px; color: #9ca3af; text-align: center;">
              Binjwa IT Solutions | 605 & 301, Atulya IT Park, Indore - 452010<br>
              +91 7974147736 | info@binjwaitsolutions.com
            </p>
          </div>
        </div>
      `,
    });
    console.log(`🎂 Birthday email sent to ${client.email}`);
  } catch (err) {
    console.error("Birthday email error:", err.message);
  }
};

/**
 * Send email notification for overdue invoice
 * @param {Object} invoice - Invoice details
 * @param {Object} client - Client details
 */
const sendOverdueInvoiceEmail = async (invoice, client) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: "binjwaitsolutions@gmail.com",
      subject: `Overdue Invoice Alert - ${invoice.invoiceNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #e74c3c;">Overdue Invoice Notification</h2>
          <p>An invoice has become overdue:</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3>Invoice Details:</h3>
            <p><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</p>
            <p><strong>Client:</strong> ${client.name}</p>
            <p><strong>Company:</strong> ${client.company || "N/A"}</p>
            <p><strong>Invoice Date:</strong> ${new Date(invoice.date).toLocaleDateString()}</p>
            <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
            <p><strong>Total Amount:</strong> ₹ ${invoice.total}</p>
            <p><strong>Status:</strong> <span style="color: #e74c3c; font-weight: bold;">${invoice.status}</span></p>
          </div>

          <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Client Contact Information:</strong></p>
            <p><strong>Email:</strong> ${client.email || "N/A"}</p>
            <p><strong>Phone:</strong> ${client.phone || "N/A"}</p>
            <p><strong>GST Number:</strong> ${client.gstNumber || "N/A"}</p>
          </div>

          <p style="color: #666;">Please follow up with the client regarding this overdue payment.</p>
          
          <hr style="margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">This is an automated notification from the Invoice System.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Overdue email sent for invoice ${invoice.invoiceNumber}`);
  } catch (error) {
    console.error("Error sending overdue email:", error);
  }
};

module.exports = {
  sendOverdueInvoiceEmail,
  sendBirthdayDiscountEmail, // ← ye add karo exports mein
};
