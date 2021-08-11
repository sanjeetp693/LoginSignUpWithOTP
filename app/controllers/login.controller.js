const User = require('../models/user.model');
const {validationResult} = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.login = async (req, res) =>{

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array()
      });
    }

    const {email, password} = req.body;
    try{
        let user = await User.findOne({
            email
        });
        if(!user)
        return res.status(400).json({
            message:"User Not Exist"
        });
        const isMatch = await bcrypt.compare(password,user.password);
        if(!isMatch)
          return res.status(400).json({
              message:"Incorrect Password!"
          });

          const payload ={
              user:{
                  id:user.id
              }
          };
          jwt.sign(
              payload,
              "randomString",
              {
                  expiresIn: 3600
              },
              (err,token) =>{
                  if(err) throw err;
                    res.status(200).json({
                        message:"Successfully login!!",
                        data:user,
                        token
                    });
              }
          );


    } catch(e) {
        res.status(500).json({
            message:"Server Error"
        });
    }



}