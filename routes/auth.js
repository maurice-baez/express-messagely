"use strict";

const User = require("../models/user");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError } = require("../expressError");
const jwt = require("jsonwebtoken");

const Router = require("express").Router;
const router = new Router();

/** POST /login: {username, password} => {token} */

router.post("/login", async function (req, res, next) {
  const { username, password } = req.body;
  const validUser = await User.authenticate(username, password);

  if (!validUser) throw new UnauthorizedError("Invalid user/password");

  const token = jwt.sign({ username }, SECRET_KEY);
  return res.json({ token });
});


/** POST /register: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 */

router.post("/register", async function (req, res, next) {
  const user = await User.register(req.body);
  const username = user.username;

  const token = jwt.sign({ username }, SECRET_KEY);
  return res.json({ token });
});

module.exports = router;