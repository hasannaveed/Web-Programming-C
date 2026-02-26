
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    req.session.name = "hello";
    req.session.ban = true;
    res.send("Session data set.");
})