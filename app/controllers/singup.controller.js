const User = require('../models/user.model');
const Otp = require('../models/otp.model')
const {validationResult} = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { generateOTP } = require("../../config/otp.util");
const fast2sms = require('fast-two-sms');
const { now } = require('mongoose');
const nodemailer=require('nodemailer');


function AddMinutesToDate(date, minutes) {
    return new Date(date.getTime() + minutes*60000);
  }


// =================== Signup API =====================//  

exports.signup = async (req, res,next) =>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        });
    }
    const {
        username,
        email,
        phone,
        password
    } = req.body;

   try{
       let user = await User.findOne({email});
       if(user){
           return res.status(400).json({
               msg:"User Already Exists"
           });
       }

       user = new User({
           username,
           email,
           phone,
           password
       });

       const salt = await bcrypt.genSalt(10);
       user.password = await bcrypt.hash(password,salt);

     const userd =   await user.save()
       const payload ={ 
           user:{
               id:user.id
           }
       };
       jwt.sign(payload,
        "randomString",{
            expiresIn: 10000
        },
        (err,token) =>{
            if(err) throw err;
            
                res.status(200).json({
                data:{
                message:"Account created OTP sended to mobile number & email",
                userd,token
                }
            });
        }
        );

        // generate otp

        const otpgn = generateOTP(6);
        const now = new Date();
        const expiration_time = AddMinutesToDate(now,2);
        const otpm = new Otp({
            phone:phone,
            email:email,
            otp:otpgn,
            expiration_time:expiration_time
        })

// send otp on email

        let transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            service : 'Gmail',
            
            auth: {
            user: 'sanjeet@apptunix.com',
            pass: 'Tunix@5494',
            }
            
        });
        var mailOptions={
            to: req.body.email,
           subject: "Otp for registration is: ",
           html: "<h3>OTP for account verification is </h3>"  + "<h1 style='font-weight:bold;'>" + otpgn +"</h1>" // html body
         };

         transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return console.log(error);
            }
        });


        // send otp on mobile number

//         const Vonage = require('@vonage/server-sdk')
//         const vonage = new Vonage({
//         apiKey: "64e274f2",
//         apiSecret: "l26Vpfvybi7kRwwp"
//         })
//         const from = "Vonage APIs"
//         const to = "918002764714"
//         const text = `you verification otp is ${otpgn}`

//         vonage.message.sendSms(from, to, text, (err, responseData) => {
//     if (err) {
//         console.log(err);
//     } else {
//         if(responseData.messages[0]['status'] === "0") {
//             console.log("Message sent successfully.");
//         } else {
//             console.log(`Message failed with error: ${responseData.messages[0]['error-text']}`);
//         }
//     }
// })

        await otpm.save();
        phoneId = otpm._id;
        console.log(phoneId)
        console.log("Otp Gen",otpgn);
        console.log(userd.phone);
       //return res.send(response)
   } catch(e) {
        res.setHeader('Content-Type', 'text/plain');
        return res.status(500).json({
        message:e.message
    });
}
}





//*************/ Verify Phone OTP ******************//

exports.verifyOtp = (req, res) => {


      const { otp, phoneId } = req.body;
      const now = new Date();
      Otp.findById(phoneId)
      .then(async otpmm =>{
      if(otpmm.expiration_time < now) {
            otpmm.otp = "";
           await otpmm.save();
         return res.status(400).json({
              message:"OTP Time out"
          })
        }
      else {
  
       if (otpmm.otp !== otp) {
         return res.status(400).send({
              message:"Incorrect OTP"
          })
      }
      else {  
      otpmm.otp = "";
     await otpmm.save();
  
      res.status(201).json({
        type: "success",
        message: "OTP verified successfully",
        data: {
          data:otpmm
        },
      });
    }
  }

})
.catch(err => {
    return res.status(400).json({
        message:"Id not found"
    })
})

 }







//============== Resend otp ============//

exports.resendOtp = async (req, res) =>{

    try{
        const otpgn = generateOTP(6);
        const now = new Date();
        const expiration_time = AddMinutesToDate(now,2);
        const { phoneId } = req.body;


        const otpmm = await Otp.findById(phoneId);

        // send otp on email
        let transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            service : 'Gmail',
            
            auth: {
            user: 'sanjeet@apptunix.com',
            pass: 'Tunix@5494',
            }
            
        });
        var mailOptions={
            to: otpmm.email,
           subject: "Otp for registration is: ",
           html: "<h3> Resend OTP for account verification is </h3>"  + "<h1 style='font-weight:bold;'>" + otpgn +"</h1>" // html body
         };

         transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return console.log(error);
            }
        });

        // send otp on mobile number

        const Vonage = require('@vonage/server-sdk')
        const vonage = new Vonage({
        apiKey: "64e274f2",
        apiSecret: "l26Vpfvybi7kRwwp"
        })
        const from = "Vonage APIs"
        const to = "918002764714"
        const text = `you resend verification otp is ${otpgn}`

        vonage.message.sendSms(from, to, text, (err, responseData) => {
    if (err) {
        console.log(err);
    } else {
        if(responseData.messages[0]['status'] === "0") {
            console.log("Resend message sent successfully.");
        } else {
            console.log(`Message failed with error: ${responseData.messages[0]['error-text']}`);
        }
    }
})
 
    Otp.findByIdAndUpdate(req.body.phoneId, {
        otp: otpgn || "Untitled Note",
        expiration_time: expiration_time 
    }, {new: true})
    .then(data =>{
        if(!data){
            return res.status(404).send({
                message: "Otp not find with id " +req.params.phoneId
            });
        }
        res.send({
            type:"Success",
            message:"Successfully Resend OTP on our mobile no. & email",
            data:data
        });
    }).catch(err =>{
        return res.status(500).send({
            message: "Error updating note with id " + req.params.phoneId
        })
    })
   } catch(e) {
        res.setHeader('Content-Type', 'text/plain');
        return res.status(500).json({
            message:e.message
        });
}
}



//============== Change Password =============//

exports.changePassword = async (req, res) =>{
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        });
    }
        const { oldPassword,
                newPassword,
                cnfPassword,
                 userId, } = req.body;
    try{
        if(!req.body.oldPassword){
            return res.status(400).json({
                message:"Please enter old password"
            })
            }
        if(!req.body.newPassword){
            return res.status(400).json({
                message:"Please enter new password"
            })
        }
        
            User.findById(userId)
            .then(async user =>{
            const isMatch = await bcrypt.compare(oldPassword,user.password);
            if(!isMatch){
               return res.status(400).json({
              message:"Old password wrong!"
             });
            }
    
            if(newPassword != cnfPassword){
             return res.status(400).json({
                 message:"Confirm password not match"
             })
              }
              else{
                const salt = await bcrypt.genSalt(10);
                const newpas = await bcrypt.hash(newPassword,salt);
                User.findByIdAndUpdate(req.body.userId, {
                    password: newpas || "Untitled Note",
                }, {new: true})
                .then(user =>{
                    if(!user){
                        return res.status(404).send({
                            message: "user not change password"
                        });
                    }
                    res.send({
                        type:"Success",
                        message:"Successfully change your password",
                        data:user
                    });
                })
               }  
            })
            .catch(err =>{
                return res.status(400).json({
                    message:"Id not found"
                })
            })

    }catch(e) {
        res.setHeader('Content-Type', 'text/plain');
        return res.status(500).json({
            message:e.message
        });
    }
}




//============ Forget Password ==============//

exports.forgetPassword = async (req, res) =>{

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        });
    }
    const {email} = req.body;
    if(!req.body.email){
        return res.status(400).json({
            message:"Email can't be empaty"
        })
    }
    try{

    User.findOne({email},(err,user) =>{
    if(!user)
    {
        return res.status(400).json({
            message:"Email Not Exist"
        });
    }
    else
    {
        const otpgn = generateOTP(6);
        const now = new Date();
        const expiration_time = AddMinutesToDate(now,2);
        const otpm = new Otp({
            phone:user.phone,
            email:email,
            otp:otpgn,
            expiration_time:expiration_time
        })
        let transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            service : 'Gmail',
            
            auth: {
            user: 'sanjeet@apptunix.com',
            pass: 'Tunix@5494',
            }
            
        });
        var mailOptions={
            to: user.email,
           subject: "Otp for forget password: ",
           html: "<h3>  OTP for forget password is </h3>"  + "<h1 style='font-weight:bold;'>" + otpgn +"</h1>" // html body
         };

         transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return console.log(error);
            }
        });
         otpm.save();
         res.status(200).json({
            message:"Successfully send OTP on your email",
            data:user
            
        });
    


    } // else end

    
})
    

    }
    catch(e){

    }

}


//============ Update Password ===============//

exports.updatePassword = async (req, res) =>{

    const {
        newPassword,
        cnfPassword
    } = req.body

    if(!req.body.newPassword && !req.body.cnfPassword){
        return res.status(400).json({
            message:"Password can't be empty"
        })
    }
    if(newPassword != cnfPassword){
        return res.status(400).json({
            message:"Password & confirm password not match"
        })
    }
    const salt = await bcrypt.genSalt(10);
    const newpas = await bcrypt.hash(newPassword,salt);

    User.findByIdAndUpdate(req.params.userId, {
        password:newpas
    }, {new: true})
    .then(user =>{
        if(!user){
            return res.status(404).send({
                message: "Id not find with id " +req.params.userId
            });
        }
        res.send(user);
    }).catch(err =>{
        if(err.kind === 'ObjectId'){
            return res.status(400).send({
                message: "Id not found with id " + req.params.userId
            })
        }
      }
    )
}



