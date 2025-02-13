// import jwt from "jsonwebtoken";
// import config from "../config/config.js";

// const authMiddleware = (req, res, next) => {
//   const token = req.headers["authorization"]?.split(" ")[1]; // Formato: "Bearer <token>"

//   if (!token) {
//     return res.status(401).json({
//       status: "error",
//       message: "Access denied. Token is missing.",
//     });
//   }

//   try {
//     const decoded = jwt.verify(token, config.JWT_SECRET);
//     req.userId = decoded.userId;
//     next();
//   } catch (err) {
//     return res.status(403).json({
//       status: "error",
//       message: "Invalid or expired token.",
//     });
//   }
// };

// export default authMiddleware;
