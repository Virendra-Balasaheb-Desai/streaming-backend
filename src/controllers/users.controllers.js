import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { uploadOnCloudinary } from "../utils/cloudinaryUpload.js"
import { User } from "../models/user.models.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"

const generateTokens = async (user) => {
    try {

        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        if(!accessToken || !refreshToken) throw new ApiError(500,"Token generation failed.")
    
        const userData = await User.findByIdAndUpdate({_id:user._id},{$set : {refreshToken:refreshToken}}).select("-password -refreshToken")
        
        if(!userData) throw new ApiError(501,"Token updation failed")
    
        return {accessToken,refreshToken,user:userData}
    } catch (error) {
        throw new ApiError(501,"Token generation error")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    
    const { username, fullName, email, password } = req.body

    if (
        [username, fullName, email, password].some(field => field?.trim() === "")
    )
    throw new ApiError(400, "All fields are required")
    
    const userExists = await User.findOne({
        $or: [{ username }, { email }]
    })    

    if (userExists) throw new ApiError(409, "User with username or email is already exists")
    
    let avatarLocalPath;
    if(req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0)
        avatarLocalPath = req.files?.avatar[0]?.path

    if (!avatarLocalPath) throw new ApiError(400, "Avatar image is required")

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0)
        coverImageLocalPath = req.files?.coverImage[0]?.path

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar) throw new ApiError(400, "Avatar image is not uploaded try again")

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    const userData = await User.create({
        email,
        password,
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        username: username.toLowerCase()
    })

    
    if (!userData) throw new ApiError(500, "User is not able to register")

    delete userData.password;

    return res.status(201).json(new ApiResponse(200,userData,"User registered successful"))
})

const loginUser = asyncHandler(async (req, res) => {
    const {email, username, password} = req.body;

    if(!(email || username)) throw new ApiError(401,"Username or Email is required.")
    
    if(!password) throw new ApiError(401,"Password is required.")

    const userExists = await User.findOne({
        $or:[{username},{email}]
    })

    if(!userExists) throw new ApiError(401,"User doesn't exists, register first.")

    const verifiedUser = await userExists.isPasswordVerify(password);

    if(!verifiedUser) throw new ApiError(401,"Password is incorrect.")
    
    const userData = await generateTokens(userExists)

    const cookieOptions = {
        httpOnly:true,
        secure:true
    }

    return res.status(200)
    .cookie("accessToken",userData.accessToken,cookieOptions)
    .cookie("refreshToken",userData.refreshToken,cookieOptions)
    .json(new ApiResponse(200,userData,"Login Successfull"))
})

const logoutUser = asyncHandler(async (req, res) => {
    const userId = req.userId

    await User.findByIdAndUpdate(userId,{$set: {refreshToken:undefined}})

    const cookieOptions = {
        httpOnly:true,
        secure:true
    }

    return res.status(200)
    .cookie("accessToken","",cookieOptions)
    .cookie("refreshToken","",cookieOptions)
    .json(new ApiResponse(200,"","Logout successfull"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;

    if(!token) throw new ApiError(401,"Unauthorized request")

    let decodedToken;
    try {   
        decodedToken = jwt.verify(token,process.env.REFRESH_TOKEN_SECRET)
    } catch (error) {    
        throw new ApiError(401,"Invalid token")
    }    

    const userData = await User.findById(decodedToken?._id)

    if(token !== userData.refreshToken) throw new ApiError(401,"Unmatched token")

    const user = await generateTokens(userData)

    if(!user) throw new ApiError(401,"Failed to generate token")

    const cookieOptions = {
        httpOnly:true,
        secure:true
    }

    return res.status(200)
    .cookie("accessToken",user.accessToken,cookieOptions)
    .cookie("refreshToken",user.refreshToken,cookieOptions)
    .json(new ApiResponse(200,user,"Access token refreshed."))
})



export { registerUser, loginUser, logoutUser, refreshAccessToken }