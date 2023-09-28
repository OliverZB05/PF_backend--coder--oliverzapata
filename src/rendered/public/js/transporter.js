import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    port: 587,
    auth: {
        user: 'zapataoliver280.2020@gmail.com',
        pass: 'tkqo pjtp aggc zjga'

    }
})

export { transporter };