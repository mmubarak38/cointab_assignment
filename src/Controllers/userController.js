const userModel = require('../models/userModel');
const validator = require('../validators/checkValidation');
const jwt = require('jsonwebtoken');
const mongoose= require('mongoose')


//creating user by validating every details.
const addUser = async (req, res) => {
    try {
        let requestBody = req.body;
        let {
            firstName,
            lastName,
            userName,
            email,
            password,
            confirmPassword,
        } = requestBody

        //validation starts
        if (!validator.isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, message: "please provide valid request body" })
        }
        if (!validator.isValid(firstName)) {
            return res.status(400).send({ status: false, message: "firstName is required" })
        }
        if (!validator.isValid(lastName)) {
            return res.status(400).send({ status: false, message: "lastName is required" })
        }
        if (!validator.isValid(userName)) {
            return res.status(400).send({ status: false, message: "userName is required" })
        }
        //searching userName in DB to maintain its uniqueness
        const isUserNamesAleadyTaken = await userModel.findOne({ userName })
        if (isUserNamesAleadyTaken) {
            return res.status(400).send({
                status: false,
                message: `${userName} is alraedy in use. Please try another userName Id.`
            })
        }
        if (!validator.isValid(email)) {
            return res.status(400).send({ status: false, message: "email is required" })
        }

        //searching email in DB to maintain its uniqueness
        const isEmailAleadyUsed = await userModel.findOne({ email })
        if (isEmailAleadyUsed) {
            return res.status(400).send({
                status: false,
                message: `${email} is alraedy in use. Please try another email Id.`
            })
        }

        //validating email using RegEx.
        if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email))
            return res.status(400).send({ status: false, message: "Invalid Email id." })

        if (!validator.isValid(password)) {
            return res.status(400).send({ status: false, message: "password is required" })
        }
        if (password.length < 8 || password.length > 15) {
            return res.status(400).send({ status: false, message: "Password must be of 8-15 letters." })
        }
        // if (!validator.isValid(reEnterPassword)) {
        //     return res.status(400).send({ status: false, message: " re-enter password is required" })
        // }else 
        if (password !== confirmPassword) {
            return res.status(400).send({ status: false, message: "password and confirmPassword must be same" })
        }
        //validation ends
        //object destructuring for response body.
        userData = {
            firstName,
            lastName,
            userName,
            email,
            password,
            confirmPassword
        }

        const saveUserData = await userModel.create(userData);
        return res
            .status(201)
            .send({
                status: true,
                message: "user created successfully.",
                data: saveUserData
            });
    } catch (error) {
        return res.status(500).send({
            status: false,
            message: "Error is : " + error.message
        })
    }
}

//user login by validating the email and password.
const userLogin = async function (req, res) {
    try {
        const requestBody = req.body;

        // Extract params
        const { email, password } = requestBody;

        // Validation starts
        if (!validator.isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, message: 'Invalid request parameters. Please provide login details' })
        }
        if (!validator.isValid(requestBody.email)) {
            return res.status(400).send({ status: false, message: 'Email Id is required' })
        }

        if (!validator.isValid(requestBody.password)) {
            return res.status(400).send({ status: false, message: 'Password is required' })
        }
        // Validation ends

        //finding user's details in DB to verify the credentials.
        const user = await userModel.findOne({ email, password });
        console.log(email, password)

        if (!user) {
            return res.status(401).send({ status: false, message: `Login failed! ${email}  or ${password}  is incorrect.` });
        }

        //Creating JWT token through userId. 
        const userId = user._id
        const token = await jwt.sign({
            userId: userId,
            iat: Math.floor(Date.now() / 1000),   //time of issuing the token.
            exp: Math.floor(Date.now() / 1000) + 3600 * 24 * 7   //setting token expiry time limit.
        }, 'cointabkey');

        return res.status(200).send({
            status: true,
            message: `user login successfull `,
            data: {
                userId,
                token
            }
        });
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }
}

const userList = async function (req, res) {
    try {
        //let userList = await userModel.find();
        const getList = await userModel.find({ isDeleted: false }).select({ userName: 1, email: 1, _id: 0 });
        return res.status(200).send({ status: true, message: `user List`, data: getList })

    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}


const updateuser = async (req, res) => {
    try {
        let requestBody = req.body
        let userId = req.params.userId
        let userIdFromToken = req.userId

        //Validation starts.
        if (!validator.isValidObjectId(userId)) {
            res.status(400).send({ status: false, message: `${userId} is not a valid user id` })
            return
        }

        if (!validator.isValidRequestBody(requestBody)) {
            return res.status(400).send({
                status: false,
                message: "Invalid request parameters. Please provide user's details to update."
            })
        }

        const findUser = await userModel.findOne({ _id: userId, isDeleted:false })
        if (!findUser) {
            return res.status(400).send({
                status: false,
                message: `User doesn't exists by ${userId}`
            })
        }

        //Authentication & authorization
        if (findUser._id.toString() != userIdFromToken) {
            res.status(401).send({ status: false, message: `Unauthorized access! User's info doesn't match` });
            return
        }

        // Extract params
        let { userName, email, password, confirmPassword } = requestBody;

        //validations for updatation details. 2. uniqueness of userName IS being handles by Schema.
        if (userName) {            
            if (!validator.isValid(userName)) {
                return res.status(400).send({ status: false, message: "userName is required" })
            }
        }
        //email validation

        if (!validator.isValid(email)) {
            return res.status(400).send({ status: false, message: "Invalid request parameter, please provide email" })
        }
        if (!/^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/.test(email)) {
            return res.status(400).send({ status: false, message: `Email should be a valid email address` });
        }
        let checkEmail = await userModel.findOne({ email: email })
        if (!checkEmail) {
            return res.status(400).send({ status: false, message: `this ${email} doesn't match with original email, email is uneditable please provide valid email ID.` });
        }



        //password validation and setting range of password.
        if (password) {
            if (!validator.isValid(password)) {
                return res.status(400).send({ status: false, message: "password is required" })
            }
            if (password.length < 8 || password.length > 15) {
                return res.status(400).send({ status: false, message: "Password must be of 8-15 letters." })
            }
        }
        if (password !== confirmPassword) {
            return res.status(400).send({ status: false, message: "password and confirmPassword must be same" })
        }

        //Validation ends

        //object destructuring for response body.
        let updatedDetails = await userModel.findOneAndUpdate({ _id: userId }, {
            $set: {
                userName: userName,
                email,
                password: password,
                confirmPassword: confirmPassword
            }
        }, { new: true })
        return res.status(200).send({ status: true, data: updatedDetails })
    } catch (err) {
        return res.status(500).send({
            status: false,
            message: "Error is: " + err.message
        })
    }
}

const deleteUser = async (req, res) => {
    try{
        let userId = req.params.userId
        let userIdFromToken = req.userId

        //Validation starts.
        if (!validator.isValidObjectId(userId)) {
            res.status(400).send({ status: false, message: `${userId} is not a valid user id` })
            return
        }

        const findUser = await userModel.findOne({ _id: userId, isDeleted:false })
        if (!findUser) {
            return res.status(400).send({
                status: false,
                message: `User doesn't exists by ${userId}`
            })
        }

        //Authentication & authorization
        if (findUser._id.toString() != userIdFromToken) {
            res.status(401).send({ status: false, message: `Unauthorized access! User's info doesn't match` });
            return
        }

        //Validation ends

        //object destructuring for response body.
        let deletedDetails = await userModel.findOneAndUpdate({ _id: userId }, {
            $set: {
                isDeleted: true
            }
        }, { new: true })
        return res.status(200).send({ status: true, data: deletedDetails })

    }catch(error){
        res.status(500).send({ status: false, message: error.message })
    }
}


module.exports = {
    addUser,
    userLogin,
    userList,
    updateuser,
    deleteUser
}