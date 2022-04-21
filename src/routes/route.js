const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController')
const middleware = require('../midd/auth')

router.post('/addUser', userController.addUser)
router.post('/login', userController.userLogin)
router.get('/userList', userController.userList)
router.put('/userList/:userId', middleware.userAuth, userController.updateuser)
router.delete('/user/:userId', middleware.userAuth, userController.deleteUser)


module.exports = router;