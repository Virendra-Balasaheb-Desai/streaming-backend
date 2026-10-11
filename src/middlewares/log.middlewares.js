import { asyncHandler } from "../utils/asyncHandler.js";

export const log = asyncHandler(async (req, res, next) => {
    const start = Date.now();

    console.log("\n========== INCOMING REQUEST ==========");
    console.log("Time:", new Date().toISOString());
    console.log("Method:", req.method);
    console.log("URL:", req.originalUrl);
    console.log("Origin:", req.headers.origin || "none");
    console.log("IP:", req.ip);
    console.log("User-Agent:", req.headers["user-agent"]);
    console.log("Content-Type:", req.headers["content-type"]);

    console.log("Cookie names:", Object.keys(req.cookies || {}));

    console.log("Authorization header present:", Boolean(req.headers.authorization));

    res.on("finish", () => {
        console.log("Status:", res.statusCode);
        console.log("Duration:", `${Date.now() - start}ms`);
        console.log("========== REQUEST COMPLETE ==========\n");
    });

    next();
});