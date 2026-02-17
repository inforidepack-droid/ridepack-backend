import { Router } from "express";
import passport from "passport";
import { googleCallback } from "@/modules/auth/auth.controller";

const router = Router();

router.get('/google',passport.authenticate("google",{
    scope:["profile","email"],
    session:false
})
);

router.get('/google/callback',passport.authenticate("google",{
    session:false,
    failureRedirect:"/login"
}),
googleCallback
);  

export default router
