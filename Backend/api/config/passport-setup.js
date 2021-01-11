const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
// const GooglePlusTokenStrategy = require('passport-google-plus-token')
// const JwtStrategy = require('passport-jwt').Strategy;
const User = require('../models/user');
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
require('dotenv').config()
const item = require("../lib/itemlib")

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    item.getItemById(id, User, (err, user) => {
        if (err) {
            console.log(err)
        } else {
            done(null, user);

        }
    })
});






passport.use(new GoogleStrategy({
    clientID: process.env.clientID,
    clientSecret: process.env.clientSecret,
    callbackURL: '/api/auth/google/redirect'
}, async(accessToken, refreshToken, profile, done) => {

    // check if user already exists in our own db
    item.getSingleItemByQuery({ email: profile.emails[0].value }, User, (err, currentUser) => {
        if (err) {
            console.log(err);
        } else {
            if (currentUser) {
                // already have this user
                // console.log(currentUser)
                const token = jwt.sign({
                        userType: currentUser.userType,
                        userId: currentUser._id,
                        email: currentUser.email,
                        name: currentUser.name,
                        isEmailVerified: currentUser.isEmailVerified
                    },
                    process.env.jwtSecret, {
                        expiresIn: "1d",
                    }
                );
                item.getItemById(currentUser._id, User, (err, result7) => {
                    if (err) {
                        console.log(err);
                    } else {
                        result7.token = token
                        result7.googleId = profile.id
                        result7.isEmailVerified = true
                        result7.save().then((user) => {
                            done(null, user)
                        }).catch((err) => {
                            console.log(err)
                        })
                    }
                })

            } else {
                const user1 = {
                    _id: new mongoose.Types.ObjectId(),
                    googleId: profile.id,
                    name: profile.displayName,
                    email: profile.emails[0].value,
                    isEmailVerified: true
                }
                item.createitem(user1, User, (err, newUser) => {
                    if (err) {
                        console.log(err)

                    } else {
                        console.log(newUser)
                        const token = jwt.sign({
                                userType: newUser.userType,
                                userId: newUser._id,
                                email: newUser.email,
                                name: newUser.name,
                                isEmailVerified: newUser.isEmailVerified
                            },
                            process.env.jwtSecret, {
                                expiresIn: "1d",
                            }
                        );
                        item.getItemById(newUser._id, User, (err, result7) => {
                            if (err) {
                                console.log(err);
                            } else {
                                result7.token = token
                                result7.googleId = profile.id
                                result7.isEmailVerified = true
                                result7.save().then((user) => {
                                    done(null, user)
                                }).catch((err) => {
                                    console.log(err)
                                })
                            }
                        })

                    }
                })
            }
        }
    })

}))