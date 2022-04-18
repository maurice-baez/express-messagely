"use strict";

const db = require("../db");
const { NotFoundError } = require("../expressError");

/** User of the site. */

class User {

  /** Register new user. Returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {
    const timestamp = new Date()
    const result = await db.query(
      `INSERT INTO users (username, password, first_name, last_name, phone, join_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING username, password, first_name, last_name, phone`,
      [username, password, first_name, last_name, phone, timestamp]);

    return result.rows[0];
  }

  /** Authenticate: is username/password valid? Returns boolean. */

  static async authenticate(username, password) {

    const result = await db.query(
      `SELECT password
         FROM users
         WHERE username=$1`,
      [username]);
    const user = result.rows[0];

    return password === user.password;
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {

    const timestamp = new Date()

    await db.query(
      `UPDATE users
        SET last_login_at=$1
        WHERE username=$2`,
      [timestamp, username]);
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
      `SELECT id, to_username, body, sent_at, read_at
        FROM messages
        WHERE from_username=$1`, [username]);

    return result.rows;
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
      `SELECT id, from_username, body, sent_at, read_at
        FROM messages
        WHERE to_username = $1`, [username]);

    return result.rows;
  }
}


module.exports = User;
