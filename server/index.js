const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

app.use(express.urlencoded({extended: true}));
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/iwpProject').then(() => console.log('Database connected'));

const userSchema = new mongoose.Schema({
    fname: {
        required: true,
        type: String
    },

    lname: {
        required: true,
        type: String
    },

    email: {
        required: true,
        type: String
    },

    password: {
        required: true,
        type: String
    }
});

const User = new mongoose.model('users', userSchema);

app.get("/custom", async (req, res) => {
    res.json("This is working");
});

app.get("/", async (req, res) => {
    console.log("Hello");
    res.send("Hello");
})

app.post("/signup", (req, res) => {
    let firstname = req.body.fname;
    let lastname = req.body.lname;
    let emailID = req.body.email;
    let pass = req.body.password;

    // bcrypt.hash(pass, 10, function(err, hash) {
        // Store hash in your password DB.
        // console.log(hash);
        // hashedPass = hash;

        const doc = {fname: firstname, lname: lastname, email: emailID, password: pass};
        const result = User.create(doc);

        console.log(
            `A document was inserted`,
         );
    // });

    // console.log(hashedPass)

    res.send("Credentials recieved successfully")
})

app.post("/login", (req, res) => {
    let emailID = req.body.email;
    let pass = req.body.password;
    console.log(pass)

    // bcrypt.hash(pass, 10, function(err, hash) {
    //     console.log(hash)
    //     User.find({'password': hash}, function(err, userpass) {
    //         if(err) {
    //             console.log(err)
    //         } else {
    //             console.log(userpass)
    //         }
    //     })
    // })

    User.find({'password': pass}, function(err, result) {
        if(err) {
            console.log(err)
        } else {
            console.log(result)
        }
    })


    res.send("Credentials recieved successfully")
})

app.listen(5000, () => {
    console.log("Server started at port 5000");
});