module.exports = (app) =>{
    
    const validator = require('../../middleware/validation')
    const loginController = require('../controllers/login.controller');
    const singupController = require('../controllers/singup.controller');

    app.post('/signup',validator.validateregister,singupController.signup);
    app.post('/login',validator.validaterlogin,loginController.login);
    app.post('/verify',singupController.verifyOtp);
    app.put('/resend',singupController.resendOtp);
    app.put('/changepassword',validator.validemail,singupController.changePassword);
    app.put('/forgpassword',singupController.forgetPassword)
    app.put('/updatepassword/:userId',singupController.updatePassword)
}