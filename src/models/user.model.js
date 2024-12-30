import mongoose, {Schema} from mongoose;
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
    fullname:{
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
      type:String,
    },
    watchHistory:[
      {
        type:mongoose.Schema.Types.ObjectId
        ref:'Video',
      }
    ]
  }
)

export const User = mongoose.model("User",userSchema);