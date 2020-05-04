const WebSocket = require('ws');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const socket = new WebSocket(process.env.WEB_SOCKET_URL);
const K_MARKET_SELLO_PATH = 'prod-real-thing-no-kidding/detailed/3955';
const K_MARKET_SELLO_MESSAGE = '{"t":"d","d":{"r":11,"a":"q","b":{"p":"/prod-real-thing-no-kidding/detailed/3955","h":""}}}';
const MAIL_SERVER = {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.SENDER_EMAIL,
        pass: process.env.SENDER_PASSWORD
    }
};

const MAIL = {
    from: process.env.SENDER_EMAIL,
    to: process.env.RECEIVER_EMAIL,
    subject: 'New Rescue Offer',
};

const sendMail = async ({ MAIL_SERVER, mail }) => {
  // create a nodemailer transporter using smtp
  const transporter = nodemailer.createTransport(MAIL_SERVER);
  // send mail using transporter
  await transporter.sendMail(mail);
};

let numberOfOffersLeft = 0;

socket.addEventListener('open', function () {
  socket.send(K_MARKET_SELLO_MESSAGE);
  setInterval(() => socket.send(0), 10000);
});

socket.addEventListener('message', function (event) {
  const message = JSON.parse(event.data);
  if (message.d.b?.p === K_MARKET_SELLO_PATH && message.d.b.d.offersLeft) {
    const data = message.d.b.d;
    if (numberOfOffersLeft < data.offersLeft) {
        if (!data || !data.offers) {
            console.log('data', data);
        }
        const offersLeft = Object.values(data.offers)
            .filter((offer) => offer.unitsLeft)
            .map((offer) => (`${offer.name}/${offer.unitsLeft} units`))
            .join(',');
        const text = `There are new offers: ${offersLeft}`;
        const mail = {...MAIL, text};
        console.log('new offer');
        sendMail({MAIL_SERVER, mail}).catch(console.error);
    }
    numberOfOffersLeft = message.d.b.d.offersLeft;
  }
});
