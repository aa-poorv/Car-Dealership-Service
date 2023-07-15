const createError = require("http-errors");

const verifyRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req?.roles) return res.send(createError.Unauthorized());
    const rolesArray = [...allowedRoles];
    console.log(rolesArray);
    console.log(req.roles);
    const result = req.roles
      .map((role) => rolesArray.includes(role))
      .find((val) => val === true);
    if (!result) return res.send(createError.Unauthorized());
    next();
  };
};

module.exports = verifyRoles;
