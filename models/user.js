"use strict";

const db = require("../db");
const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR } = require("../config");
const { NotFoundError, BadRequestError, UnauthorizedError } = require("../expressError");

/** User of the site. */

class User {

  /** Register new user. Returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {
    const hashedPw = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    const result = await db.query(
      `INSERT INTO users (username, password, first_name, last_name, phone, join_at, last_login_at)
         VALUES ($1, $2, $3, $4, $5, now(), current_timestamp)
         RETURNING username, password, first_name, last_name, phone`,
      [username, hashedPw, first_name, last_name, phone]);

    const user = result.rows[0];

    if (!user) throw new BadRequestError("Invald input.");

    return result.rows[0];
  }

  /** Authenticate: is username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    try {
      const result = await db.query(
        `SELECT password
         FROM users
         WHERE username=$1`,
        [username]);
      const dbPassword = result.rows[0].password;
      return bcrypt.compare(password, dbPassword);
    }
    catch (err) {
      throw new UnauthorizedError("Username not found.");
    }

  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {

    await db.query(
      `UPDATE users
        SET last_login_at= current_timestamp
        WHERE username=$1`,
      [username]);
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name}, ...] */

  static async all() {

    const results = await db.query(
      `SELECT username, first_name, last_name
        FROM users`);

    return results.rows;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {

    const result = await db.query(
      `SELECT username, first_name, last_name, phone, join_at, last_login_at
        FROM users
        WHERE username=$1`, [username]);
    const user = result.rows[0];
    if (!user) throw new NotFoundError(`No such user: ${username}`);

    return user;
  }

  /** Return messages from this user.
*
* [{id, to_username, body, sent_at, read_at}]
*
* where to_user is
*   {username, first_name, last_name, phone}
*/

  static async messagesFrom(username) {
    const result = await db.query(
      `SELECT m.id,
              m.to_username,
              m.body,
              m.sent_at,
              m.read_at,
              u.username,
              u.first_name,
              u.last_name,
              u.phone
        FROM messages AS m
              LEFT OUTER JOIN users AS u ON m.to_username = u.username
        WHERE m.from_username = $1`, [username]);

    const msgs = result.rows.map(m => {
      return {
        id: m.id,
        body: m.body,
        sent_at: m.sent_at,
        read_at: m.read_at,
        to_user: {
          username: m.username,
          first_name: m.first_name,
          last_name: m.last_name,
          phone: m.phone,
        }
      };
    });
    return msgs;
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */

  static async messagesTo(username) {

    const result = await db.query(
      `SELECT m.id,
              m.from_username,
              m.body,
              m.sent_at,
              m.read_at,
              u.username,
              u.first_name,
              u.last_name,
              u.phone
        FROM messages AS m
              LEFT OUTER JOIN users AS u ON m.from_username = u.username
        WHERE m.to_username = $1`, [username]);

    const msgs = result.rows.map(m => {
      return {
        id: m.id,
        body: m.body,
        sent_at: m.sent_at,
        read_at: m.read_at,
        from_user: {
          username: m.username,
          first_name: m.first_name,
          last_name: m.last_name,
          phone: m.phone,
        }
      };
    });
    return msgs;
  }
};


module.exports = User;
