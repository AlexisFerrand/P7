const jwt = require('jsonwebtoken');
const UserModel = require('../models/user.model');

// permet de valider que la personne est bien connecté et identifié via ce token unique de jwt
module.exports.checkUser = (req, res, next) => {
  const token = req.cookies.jwt;
  if (token) {
    jwt.verify(token, process.env.TOKEN_SECRET, async (err, decodedToken) => {
      if (err) {
        // si utilisateur pas de token on ne veut pas voir ces informations donc null
        res.locals.user = null;
        res.cookie('jwt', '', { maxAge: 1 });
        next();
      } else {
        let user = await UserModel.findById(decodedToken.id);
        res.locals.user = user;
        //console.log(res.locals.user);
        next();
      }
    });
  } else {
    // si utilisateur pas de token on ne veut pas voir ces informations donc null
    res.locals.user = null;
    next();
  }
};

module.exports.requireAuth = (req, res, next) => {
  const token = req.cookies.jwt;
  if (token) {
    jwt.verify(token, process.env.TOKEN_SECRET, async (err, decodedToken) => {
      if (err) {
        console.log(err);
      } else {
        console.log(decodedToken.id);
        next();
      }
    });
  } else {
    console.log('No token');
  }
};
