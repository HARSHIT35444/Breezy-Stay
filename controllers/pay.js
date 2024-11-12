const Listing = require("../models/listing");

module.exports.payListing = async (req,res) => {
    let {id} = req.params;
    const listing = await Listing.findById(id).populate({
            path:"reviews",
            populate:{
                path:"author",
            },
        })
        .populate("owner");
    if(!listing){
        req.flash("errors","Listing you requested does not exist!");
        res.redirect("/listings");
    }
    // console.log(listing);
    const price = listing.price;
    res.locals.price = price;
    console.log("listing price = "+price);
    res.render("listings/pay.ejs",{listing , price});
    // res.render("show.ejs",{listing});
    
};
