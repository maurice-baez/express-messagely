"use strict";

const { UnauthorizedError } = require("../expressError");
const Message = require("../models/message");
const { ensureLoggedIn } = require("../middleware/auth");

const Router = require("express").Router;
const router = new Router();


router.use(ensureLoggedIn);

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Makes sure that the currently-logged-in users is either the to or from user.
 *
 **/

router.get("/:id", async function (req, res, next) {

  const msg = await Message.get(req.params.id);

  const username = res.locals.user.username;

  if (username === msg.from_user.username || username === msg.to_user.username) {
    return res.json({ msg });
  }
  throw new UnauthorizedError("Unauthorized");
});

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/

router.post("/", async function (req, res, next) {

  const { to_username, body } = req.body;
  const from_username = res.locals.user.username;

  const msg = await Message.create({ from_username, to_username, body });

  return res.json({ msg });
});


/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Makes sure that only the intended recipient can mark as read.
 *
 **/

router.post("/:id/read", async function (req, res, next) {

  const user = res.locals.user.username;

  const msg = await Message.get(req.params.id);

  if (user === msg.to_user) {
    const readMsg = await Message.markRead(req.params.id);
    return res.json({ readMsg });
  }

  throw new UnauthorizedError("Unauthorized.");
});


module.exports = router;