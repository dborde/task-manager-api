const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from:'dave@bigad.tv',
        subject: 'Thanks for joining in!',
        text: `Welcome to the app, ${name}. Let me know how you get along with the app.`
    });
}

const sendCancelationEmail = (email, name) => {
    sgMail.send({
        to: email,
        from:'dave@bigad.tv',
        subject: 'Sorry to see you go!',
        text: `${name}, your profile has been canceled. Please let us know why you canceled and if there was anything we could have done to keep you.`
    });
}

module.exports = {
    sendWelcomeEmail,
    sendCancelationEmail
}