import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { uploadOnCloudinary } from "../utils/cloudinaryUpload.js"
import { User } from "../models/user.models.js"
import { ApiResponse } from "../utils/ApiResponse.js"

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

export { registerUser }