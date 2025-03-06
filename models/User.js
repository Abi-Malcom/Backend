/* eslint-disable eol-last */
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        unique:true,
        required:true,
    },
    password:{
        type:String,
        required:true,
    },
    phone:{
        type:String,
    
    }
});

userSchema.pre('save',function(next){
    if(!this.isModified('password')){
        return next();
    }
    bcrypt.genSalt(10,(err,salt)=>{
        if(err){
            return next(err);
        }
        bcrypt.hash(this.password,salt,(hashErr,hash)=>{
            if(err){
                return next(hashErr);
            }
            this.password = hash;
            next();
        });
    });
});


userSchema.methods.comparePassword = function(candidatePassword){
    return new Promise((resolve,reject)=>{
        bcrypt.compare(candidatePassword,this.password,(err,isMatch)=>{
            if(err){
                return reject(err);
            }
            if(!isMatch){
                return reject(err);
            }
            resolve(true);
        });
    });
};

const User = mongoose.model('User', userSchema);

module.exports = User;