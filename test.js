const mongoose = require('mongoose');
const { DATABASE_URL } = require('./config//config');

const connect = mongoose.connect(DATABASE_URL, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
});

connect.then((db) => {
    console.log('Connected correctly to the server');
}, (err) => { console.log(err)});

/* const User = require('./models/users');

User.register(new User({ name: ' art ', mobile: '018646512299'}), 'tushar', (err, user) => {
    if (err){
        console.log(JSON.stringify(err));
    } else {
        user.email = 'art@gmail.com';
        user.save((err, user) => {
            console.log('hello');
            if (err) console.log(JSON.stringify(err))
            else console.log(JSON.stringify(user))
        })
    }
}) */
// mongoose.connection.close();
mongoose.disconnect();