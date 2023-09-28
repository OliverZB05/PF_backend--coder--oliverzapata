import nodemailer from 'nodemailer';

export async function sendEmail(userEmail) {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'zapataoliver280.2020@gmail.com',
            pass: 'tkqo pjtp aggc zjga'
        }
    });

    let mailOptions = {
        from: 'zapataoliver280.2020@gmail.com',
        to: userEmail,
        subject: 'Cuenta eliminada',
        text: 'Tu cuenta ha sido eliminada por inactividad.'
    };

    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}
