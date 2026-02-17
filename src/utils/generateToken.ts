import jwt from "jsonwebtoken";
import {IUser} from "../modules/auth/models/User.model"

exports.genereateToken = (user:IUser) =>{
    return jwt.sign (
        {
            userId:user._id,
            email:user.email,
            role:user.role
        },
        process.env.JWT_SECRET as string,
        {expiresIn:"7d"}
    );
}