const nodemailer = require("nodemailer");
//const twilio = require("twilio");

// Keep aside first
// const twilioClient = twilio(
//     process.env.TWILIO_ACCOUNT_SID,
//     process.env.TWILIO_AUTH_TOKEN
// );

// const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "eddykoh2003@gmail.com",
        pass: "izhx twka tvsb qomb"
    }
});

// Helper to send notification email
const sendEmail = async (account_email, subject, message) => {
    if (!account_email) return;

    await transporter.sendMail({
        to: account_email,
        subject,
        html: `<p>${message}</p>`
    });
};

// Keep aside first
// Helper: send WhatsApp notification
// const sendWhatsApp = async (contact_no, message) => {
//     if (!contact_no) return;
//
//     const to = `whatsapp:+${contact_no.replace(/^0/, "60")}`; // Convert to international format
//     await twilioClient.messages.create({
//         from: whatsappFrom,
//         to,
//         body: message
//     });
// };

const notificationService = {
    sendEmail,
//   sendWhatsApp
};

module.exports = notificationService;