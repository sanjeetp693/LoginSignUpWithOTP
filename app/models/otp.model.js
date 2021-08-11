const mongoose = require('mongoose');

const OtpSchema = new mongoose.Schema({


    phone:{
        type:Number,
       
    },
    email:{
        type:String,
        
    },
    otp:{
        type:String
    },
    expiration_time:{
        type:Date
    }
})

module.exports = mongoose.model('otps',OtpSchema);