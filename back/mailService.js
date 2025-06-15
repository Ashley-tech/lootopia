const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

dotenv.config()
dotenv.config({ path: '.env.local', override: true });

// Configuration du service mail (exemple avec Gmail)
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,  // Ton email
        pass: process.env.EMAIL_PASS   // Ton mot de passe ou un mot de passe d'application
    }
});

// Fonction d'envoi d'e-mail
const sendEmail = async (from, to, subject, text) => {
    try {
        const plainText = text.replace(/\r/g, "").trim(); // Nettoyage
        const htmlContent = plainText.replace(/\n/g, "<br>"); // Conversion en HTML
        const mailOptions = {
            from: from,
            to: to,
            subject: subject,
            text: plainText,
            html: htmlContent,
        };
        console.log("text",plainText)
        console.log("html",htmlContent)

        let info = await transporter.sendMail(mailOptions);
        console.log("E-mail envoyé: ", info.response);
        return { success: true, message: "E-mail envoyé avec succès!" };
    } catch (error) {
        console.error("Erreur lors de l'envoi de l'email:", error);
        return { success: false, error: error.message };
    }
};

module.exports = sendEmail;
