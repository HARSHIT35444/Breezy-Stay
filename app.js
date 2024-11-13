if (process.env.NODE_ENV != "production") {
    require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore = require('connect-mongo');

//for payment gateway integration
const stripe = require("stripe")("sk_test_51OokAHCUp6ahQS49h8dasM6vN0uEQDnlWzTXjwt5KTGN6S1pd4mR25WCCE2sUJ07Fgxu3QPDKgjuQsQ2hBJC9CJc00YV4LwEQY");
app.use(express.json());
app.post('/create-payment-intent', async (req, res) => {
    const { amount } = req.body;
    // console.log(amount);
    // console.log(req.body);
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: 'usd',
            automatic_payment_methods: {
                enabled: true,
            },
        });
        
        res.status(200).json({
            clientSecret: paymentIntent.client_secret,
            success: true,
        }); 

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Unable to create payment intent.' });
    }
});

app.use("/newroute", async (req, res) => {
    console.log(req.body);
})


const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

const listingRouter = require("./routes/listing.js");
const reviewsRouter = require("./routes/reviews.js");
const userRouter = require("./routes/user.js");
// const payRouter = require("./routes/pay.js");
const { default: Stripe } = require("stripe");
const { Session } = require("inspector");
const { redirect } = require("next/dist/server/api-utils/index.js");
const { log } = require("console");
const { showListing } = require("./controllers/listings.js");
// const { payListing } = require("./controllers/pay.js");


// const MONGO_URL = 'mongodb://127.0.0.1:27017/wanderlust'
const dbUrl = process.env.ATLASDB_URL;

main().then(() => {
    console.log("connected to db");
}).catch((err) => {
    console.log(err);
})

async function main() {
    await mongoose.connect(MONGO_URL);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret: process.env.SECRET,
    },
    touchAfter: 24 * 3600,
});

store.on("error",() => {
    console.log("ERROR IN MONGO SESSION STORE",err);
});

const sessionOptions = {
    // store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    },
};

// app.get("/" , (req,res) => {
//     res.send("Hi,I am Root");
// });

app.use(session(sessionOptions));
app.use(flash());

app.use((req, res, next) => {
    res.locals.success = req.flash.success;
    next();
});

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.errors = req.flash("errors");
    res.locals.currUser = req.user;
    next();
});

// app.get("/demouser",async(req,res) => {
//     let fakeUser = new User({
//         email: "delta@gmail.com",
//         username: "Delta_Student"
//     });

//     let registeredUser = await User.register(fakeUser,"HelloWorld");
//     res.send(registeredUser);
// })

app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewsRouter);
app.use("/", userRouter);
// app.use("/paynew", reviewsRouter);

const Listing = require("./models/listing");
const { isLoggedIn } = require("./middleware.js");
// new added files for payment gateway trial
app.use("/paynew/:id",  isLoggedIn , async (req, res) => {
    let { id } = req.params;
    // console.log("in pay ejs");
    const listing = await Listing.findById(id);
    // console.log(listing);
    // console.log(showListing.price);
    // app.set('views engine', 'ejs');
    // app.set('views', path.join(__dirname, 'views'));
    // console.log(price);
    res.render("listings/pay.ejs" ,{ listing:listing });
});


app.use("/success",async (req,res) => {
    // let id = req.params;
    // const listing = await Listing.findById(id);
    // console.log(listing);
    res.render("listings/success.ejs")
})


// app.get("/paynew",(req,res) => {
//     res.render("pay");
// })
//ennded 

app.all("*", (req, res, next) => {
    next(new ExpressError(404, "page not found!!"));
});

// app.use((err , req , res , next) => {
//     app.set('views', '/Users/harshitsharma/Desktop/MAJORPROJECT copy/views/errors');
//     let { statusCode = 500 , message ="Something went wrong!" } = err;
//     res.status(statusCode).render("error.ejs",{ message });
//     // res.status(statusCode).send(message);
// });

app.listen(8080, () => {
    console.log("server is listening on port 8080");
});