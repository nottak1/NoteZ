const jwt = require("jsonwebtoken");

const config = process.env;



const verifyToken = (req, res, next) => {
    console.log('got to verify part!');
  // console.log(req);
  const token = req.headers["x-access-token"];
  if (!token) {
    console.log("line 8 of auth.js");
    return res.status(403).send();
  }
  try {
    console.log(token);
    const decoded =
    jwt.verify(token, config.TOKEN_KEY);
       
    console.log("line 14");
    req.user = decoded;
    console.log("decoded token")
    console.log(decoded);
  } catch (err) {
    console.log("the token is invalid??????? line 18 of auth.js")
    return res.status(401).send();
  }
  return next();
};

module.exports = verifyToken;
