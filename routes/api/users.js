const express = require('express');
const router = express.Router();
//NOTE calling in validator from npm express validator
const { body, validationResult, check } = require('express-validator');
//NOTE BRINGING IN THE USER MODEL
const User = require('../../models/User');
//NOTE CALLING NPM GRAVATAR
const gravatar = require('gravatar');
//NOTE CALLING BCRYPT
const bcrypt = require('bcryptjs');
//NOTE CALLING JSON WEB TOKEN (JWT)
const jwt = require('jsonwebtoken');
//NOTE CALLING CONFIG FILE FOR JWT TOKEN
const config = require('config');

// @route    POST api/users
// @desc     Register user
// @access   Public
router.post(
  '/',
  [
    body('name', 'Name is required').not().isEmpty(),
    body('email', 'Please include a valid email').isEmail(),
    body(
      'password',
      'Please enter a password with 6 or more characters'
    ).isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      //TODO: 1. See if user exists
      let user = await User.findOne({ email });
      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'User already exists.' }] });
      }

      //TODO: 2. GET USERS GRAVATAR
      const avatar = gravatar.url(email, {
        s: '200', //SIZE
        rating: 'pg', //DO NOT SHOW NAKED
        d: 'mm', //USE A DEFAULT PIC
      });

      //NOTE: MAKING USER INSTANCE
      user = new User({
        name,
        email,
        avatar,
        password,
      });
      //NOTE: JUST CREATING AN INSTANCE, WONT SAVE UNTIL saveOne() CALLED.
      //TODO: 3. ENCRYPT PASSWORD WITH BCRYPT
      //NOTE: CREATE SALT TO DO THE HASHING WITH
      const salt = await bcrypt.genSalt(10); //GENERALLY USES 10

      user.password = await bcrypt.hash(password, salt);
      //NOTE: SAVING USER
      await user.save();
      //TODO: 4. RETURN JSON WEB TOKEN

      //NOTE: MAKING JWT PAYLOAD
      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(payload, config.get('jwtSecret'),
     { expiresIn: 360000 },
     (err, token) => {
         if (err) throw err;
         res.json({ token }); 
     }
     );

      //// console.log(req.body); [PRINTS OUT THE USER JSON IN THE TERMINAL]
      ////res.send('user registered');//cut for jwt
    } catch (err) {
      console.error(err.massage);
      res.status(500).send('server error');
    }
  }
);

module.exports = router;
