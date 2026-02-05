import express from 'express';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = express.Router();

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '1d',
    });
}

router.post('/register', async (req, res) => {
    try {

        const reqBody = req.body;

        const { username, email, phone, password, profileImage, isAdmin } = reqBody;
        // Check if all required fields are provided
        if (!username || !phone || !password) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        // Check if email is valid (only if provided)
        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ message: 'Invalid email format' });
            }
        }

        // Check if password is strong enough
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{6,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                message: 'Password must be at least 6 characters long, include at least one letter, one number, and one special character'
            });
        }


        // check if password is less than 6 characters
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }
        // check if username is less than 3 characters
        if (username.length < 3) {
            return res.status(400).json({ message: 'Username must be at least 3 characters long' });
        }



        // Check if phone already exists
        const phoneExists = await User.findOne({ phone });
        if (phoneExists) {
            return res.status(400).json({ message: 'Phone number already exists' });
        }

        // Check if username already exists
        const usernameExists = await User.findOne({ username });
        if (usernameExists) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        // Check if email already exists (only if provided)
        if (email) {
            const emailExists = await User.findOne({ email });
            if (emailExists) {
                return res.status(400).json({ message: 'Email already exists' });
            }
        }

        const proImageDefault = 'https://www.w3schools.com/howto/img_avatar.png'


        // Create new user
        const newUser = new User({
            username,
            email,
            phone,
            password,
            profileImage: profileImage || proImageDefault,
            isAdmin
        });
        await newUser.save();

        // Generate token
        const token = generateToken(newUser._id);
        // Set token in cookie
        res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });
        // Send response
        res.status(201).json({
            message: 'User created successfully',
            token,
            user: {
                _id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                phone: newUser.phone,
                profileImage: newUser.profileImage,
                isAdmin: newUser.isAdmin,
            },
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server error' });

    }
})


router.post('/login', async (req, res) => {
    try {
        const { identifier, password } = req.body;

        // Validate input
        if (!identifier || !password) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        // Find user by email or phone
        let user;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (emailRegex.test(identifier)) {
            // It's an email
            user = await User.findOne({ email: identifier });
        } else {
            // It's a phone number
            user = await User.findOne({ phone: identifier });
        }

        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isPasswordCorrect = await user.comparePassword(password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate token
        const token = generateToken(user._id);

        // Set token in cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
        });

        // Send response
        return res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                phone: user.phone,
                profileImage: user.profileImage,
                isAdmin: user.isAdmin,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});


export default router;
