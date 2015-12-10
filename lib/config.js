'use strict';

/**
 * Parse a boolean from a string
 *
 * @param  {string} string A string to parse into a boolean
 * @return {mixed}         Either a boolean or the original value
 */
function parseBool(string) {
  if (typeof string === 'string') {
    return /^(true|1)$/i.test(string);
  }

  return string;
}

/**
 * Try to parse a string date into a timestamp.
 *
 * @param {string} string A string to parse into a boolean
 * @return {integer|null} The resulting timestamp or null
 */
function parseDate(string) {
  let retVal = null;

  if (parseInt(string, 10) === string) {
    // assume this is a timestamp already
    retVal = string;
  } else {
    retVal = (new Date(string)).getTime();
  }

  if (isNaN(retVal)) {
    retVal = null;
  }

  return retVal;
}

/**
 * Parses and enhances config object
 *
 * @param  {object} config the raw object from file
 * @return {object}        the paresed config object
 * @throws Error if it cannot parse object
 */
function parse(config) {
  if (typeof config !== 'object') {
    throw new Error('Config is not an object');
  }

  /**
   * Pull config from ENV if set
   */
  config.app.message = process.env.APP_MESSAGE || config.app.message;
  config.app.reminder = parseInt(process.env.APP_REMINDER, 10) || config.app.reminder;
  config.app.respond.dm = parseBool(process.env.APP_RESPOND_DM) || config.app.respond.dm;
  config.app.respond.channel = parseBool(process.env.APP_RESPOND_CHANNEL) || config.app.respond.channel;
  config.app.timebox.start = process.env.APP_TIMEBOX_START || config.app.timebox.start;
  config.app.timebox.end = process.env.APP_TIMEBOX_END || config.app.timebox.end;

  config.slack.token = process.env.SLACK_TOKEN || config.slack.token;
  config.slack.autoReconnect = parseBool(process.env.SLACK_AUTO_RECONNECT) || config.slack.autoReconnect;
  config.slack.autoMark = parseBool(process.env.SLACK_AUTO_MARK) || config.slack.autoMark;

  /**
   * Attempt to parse the dates
   */
  config.app.timebox.start = parseDate(config.app.timebox.start);
  if (config.app.timebox.start === null) {
    throw new Error('Could not parse timebox.start');
  }

  config.app.timebox.end = parseDate(config.app.timebox.end);
  if (config.app.timebox.end === null) {
    throw new Error('Could not parse timebox.end');
  }

  return config;
}

module.exports = {
  parse: parse,
  parseDate: parseDate,
  parseBool: parseBool
};