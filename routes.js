"use strict";

const express = require("express");
const {asyncHandler} = require("./middleware/asyncHandler");
const { User, Task } = require('./models');
const {authenticateUser} = require("./middleware/authUser");
const bcrypt = require("bcrypt");
const router = express.Router();

//GET route for user authentication
router.get('/users', authenticateUser, asyncHandler(async (req, res) => {
    const user = req.currentUser;
    res.status(200);
    //json data to display current user's firstname and lastname in UI
    res.json({
        userId: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        emailAddress: user.emailAddress,
        password: user.password
    });
}));

//GET route to display task data from database
router.get("/tasks", authenticateUser, asyncHandler(async(req, res) => {
    try {
        const user = req.currentUser;
        let tasksMapped = [];
        const tasks = await Task.findAll({
        where: {
            userId: user.id
        },
        order: [['createdAt', 'DESC']],
        include: [
            {
                model: User,
                as: "task-manager",
            }
        ]
    });
  
    //Loops through task data and maps title, description, time, createdAt for UI
    tasks.map(task =>{
        let taskArr = { 
            id: task.id,
            title: task.title,
            time: task.time,
            description: task.description,
            createdAt: task.createdAt,
            userId: task.userId,
        };
        tasksMapped.push(taskArr)
        });

        res.json(tasksMapped);

        res.status(200).end();
    } catch(error){
        throw error;
    }
}));

//GET route to display a specific task
router.get("/tasks/:id", authenticateUser, asyncHandler(async(req, res) => {
    const user = req.currentUser;
    try {
        const task = await Task.findByPk(req.params.id, 
            {include: [
                {
                    model: User,
                    as: "task-manager",
                }
            ]}
    );
        if(task){
            if(user.id === task.userId){
                res.json({ 
                    id: task.id,
                    title: task.title,
                    description: task.description,
                    time: task.time,
                    userId: task.userId,
                    createdAt: task.createdAt,
            });
            } else {
                res.status(403).json({message: "Access Denied"}).end();
            }
        }
    } catch(error){
        throw error;
    }
}))

//POST route to create a new user
router.post('/users', asyncHandler(async (req, res) => {
    try {
        const salt =  await bcrypt.genSalt()
        const hashedPassword = await bcrypt.hash(req.body.password, salt);

        //swapped password for hashedPassword so user-password isn't saved as plain text in database
        if(
        ((req.body.firstName.length > 0) && (req.body.lastName.length > 0)) &&
            (((req.body.password.length >= 8) && (req.body.password.length <= 20)) && (req.body.emailAddress.length > 0))
        ){
        const user = {firstName: req.body.firstName, lastName: req.body.lastName, emailAddress: req.body.emailAddress, password: hashedPassword};
        await User.create(user);

        //sets location header to "/"
        res.location('/');
        //.json({ "message": "Account successfully created." });
        res.status(201).end(console.log(`New user '${req.body.emailAddress}' successfully created.`));
        } else if (
        ((req.body.firstName.length === 0) && (req.body.lastName.length === 0)) &&
            ((req.body.password.length === 0) && (req.body.emailAddress.length === 0))
        ){
            res.status(400).json({message: "Please make sure valid data is provided to create user."}).end();
        } else if ((req.body.firstName.length === 0) && (req.body.emailAddress.length === 0) &&
        ((req.body.password.length < 8) || (req.body.password.length > 20))){
            res.status(400).json({message: "Please enter a valid first name, email address, and password that is 8-20 characters."}).end();
        } else if ((req.body.lastName.length === 0) && (req.body.emailAddress.length === 0) &&
        ((req.body.password.length < 8) || (req.body.password.length > 20))){
            res.status(400).json({message: "Please enter a valid last name, email address, and password that is 8-20 characters."}).end();
        } else if (((req.body.firstName.length === 0) && (req.body.lastName.length === 0)) && 
        (req.body.emailAddress.length === 0)){
            res.status(400).json({message: "Please enter a valid first name, last name, and email address."}).end();
        } else if (((req.body.firstName.length === 0) && (req.body.lastName.length === 0)) && 
        ((req.body.password.length < 8) || (req.body.password.length > 20))){
            res.status(400).json({message: "Please enter a valid first name, last name, and password that is 8-20 characters."}).end();
        } else if ((req.body.firstName.length === 0) && (req.body.lastName.length === 0)){
            res.status(400).json({message: "Please enter a first and last name."}).end();
        } else if ((req.body.lastName.length === 0) && 
        ((req.body.password.length < 8) || (req.body.password.length > 20))){
            res.status(400).json({message: "Please enter a valid first name and a password that is 8-20 characters."}).end();
        } else if ((req.body.lastName.length === 0) && (req.body.emailAddress.length === 0)){
            res.status(400).json({message: "Please enter a valid last name and email address."}).end();
        } else if((req.body.emailAddress.length === 0) && ((req.body.password.length < 8) || (req.body.password.length > 20))){
            res.status(400).json({message: "Please enter a valid email address and password that is 8-20 characters"}).end();
        } else if ((req.body.firstName.length === 0) && ((req.body.password.length < 8) || (req.body.password.length > 20))){
            res.status(400).json({message: "Please enter a valid first name and a password that is 8-20 characters."}).end();
        } else if ((req.body.firstName.length === 0) && (req.body.emailAddress.length === 0)){
            res.status(400).json({message: "Please enter a valid first name and email address."}).end();
        } else if (req.body.firstName.length === 0) {
            res.status(400).json({message: "Please enter a first name."}).end();
        } else if (req.body.lastName.length === 0) {
            res.status(400).json({message: "Please enter a last name."}).end();
        } else if (req.body.emailAddress.length === 0) {
            res.status(400).json({message: "Please enter a valid email address."}).end();
        } else if ((req.body.password.length < 8) || (req.body.password.length > 20)){
            res.status(400).json({message: "Please enter a password that is 8-20 characters."}).end();
        }
    } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const errors = error.errors.map(err => err.message);
            res.status(400).json({message: errors });   
        } else {
            //Generic "error" message for any issues that might come from creating user
            res.status(400).json({message : "Please make sure valid data is provided to create user."})  
        }
    }
}));

router.post("/tasks", authenticateUser, asyncHandler(async(req, res) => {
    try{
        if(req.body.title.length > 0 && req.body.description.length > 0){
            await Task.create(req.body);
            //Sets location header to specific task id
            res.location(`/task/${Task.id}`);
            res.status(201).end(console.log("New task successfully created")).end();
        } else if(req.body.title.length === 0 && req.body.description.length === 0){
            res.status(400).json({errors: "You must enter a value for title and description."})
        } else if (req.body.title.length === 0) {
            res.status(400).json({errors: "You must enter a value for title."}).end();
        } else if (req.body.description.length === 0) {
            res.status(400).json({errors: "You must enter a value for description."}).end();
        }
    } catch(error){
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const errors = error.errors.map(err => err.message);
            res.status(400).json({ errors: errors });   
        } else {
            throw error;
        }
    }
}));

//PUT route to edit a task
router.put("/tasks/:id", authenticateUser, asyncHandler(async(req, res) => {
    const user = req.currentUser;
    try{
        if(req.body.title.length > 0 && req.body.description.length > 0){
            const task = await Task.findByPk(req.params.id);
            console.log("Retrieved task from put request");
            //Checks to see if current user possesses the task
            if(user.id === task.userId){
                if(task){
                    await task.update(req.body);
                    res.status(204).end();
                } else {
                    res.status(404).json({message: "Task Not Found"});
            }
        } else {
            res.status(403).json({message: "Access Denied"}).end();
        }
        } else if(req.body.title.length === 0 && req.body.description.length === 0){
            res.status(400).json({errors: "You must enter a value for title and description."})
        } else if (req.body.title.length === 0) {
            res.status(400).json({errors: "You must enter a value for title."}).end();
        } else if (req.body.description.length === 0) {
            res.status(400).json({errors: "You must enter a value for description."}).end();
        }
    } catch(error){
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const errors = error.errors.map(err => err.message);
            res.status(400).json({ errors: errors });   
        } else {
            throw error;
        }
    }
}));

//Delete route to destroy a specific task
router.delete("/tasks/:id", authenticateUser, async(req, res)=>{
    const user = req.currentUser;
    try{
        const task = await Task.findByPk(req.params.id);
        //Checks to see if current user possesses the course
        if(user.id === task.userId){
            await task.destroy();
            console.log("Task Successfully Deleted");
            res.status(204).end();
        } else {
            res.status(403).json({message: "Access Denied"}).end();
        }
    } catch(error){
        throw(error)
    } 
})

module.exports = router;