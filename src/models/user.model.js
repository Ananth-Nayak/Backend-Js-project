import mongoose, {Schema} from 'mongoose';
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'


const userSchema = new Schema(
  {
    username:{
      type:String,
      required: true,
      unique: true,
      lowercase: true,
      trim:true,
      index:true,
    },
    email:{
      type:String,
      required: true,
      unique: true,
      lowercase: true,
      trim:true,
    },
    fullName:{
      type:String,
      required: true,
      lowercase: true,
      trim:true,
      index:true
    },
    avatar:{
      type:String,
      required:true,
    },
    coverImage:{
      type:String, //cloudinary url
    },
    watchHistory:[
      {
        type:Schema.Types.ObjectId,
        ref:'Video',
      }
    ],
    password: {
      type: String,
      required: [true, "Password is required"]
    },
    refreshToken:{
      type:String
    }
  },
  {
    timeStamps:true
  }
)

userSchema.pre('save',async function(next){
  if(!this.isModified("password")) return next()
  this.password = bcrypt.hash(this.password)
  next();
})
//pre is a middleware, happens just before any event in this case while saving the userdata
//but inside callback fn we only do encrypt if password is modified.
// using normal function declaration in callback function as arrow function does not carry this references

userSchema.methods.isPasswordCorrect = async function(password){
  return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken = function (){
  return jwt.sign(
    {
      _id:this._id,
      username:this.username,
      email:this.email,
      fullName:this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn:process.env.ACCESS_TOKEN_EXPIRY
    }
  )
}

userSchema.methods.generateRefreshtoken = function(){
  return jwt.sign(
    {
      _id:this._id
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn:REFRESH_TOKEN_EXPIRY
    }
  )
}


export const User = mongoose.model("User",userSchema);