const mongoose = require("mongoose");
const initdata = require("./data.js");
const Listing = require("../models/listing.js");

const MONGO_URl = "mongodb://127.0.0.1:27017/wanderlust";

main().then(() => {
    console.log("connected to db");
}).catch((err)=>{
    console.log(err);
});

async function main(){
    await mongoose.connect(MONGO_URl);
}

const initDB = async() => {
    await Listing.deleteMany({});
    initdata.data = initdata.data.map((obj) => ({...obj , owner: "6530cf570f2bb21a06b885dc" }));
    await Listing.insertMany(initdata.data);
    console.log("data initialized");
};

initDB();