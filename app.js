"use strict";

const logger = require("./lib/logger")();
const redact = require("redact-object");
const Bot = require("./lib/bot");
const Config = require("./lib/config");
const ON_DEATH = require("death");
const moment = require("moment-timezone");

let bot;
let config;

// Close the bot gracefully
ON_DEATH(signal => {
  if (bot instanceof Bot) {
    bot.stop();
  }

  // You need to actually kill the process if you overwrite the signal response
  switch (signal) {
    case "SIGINT":
    case "SIGTERM":
      // give the last message a chance to send
      setTimeout(process.exit, 1000);
      break;
    default:
  }
});

/**
 * Load config
 */
const rawConfig = (() => {
  let retVal;
  try {
    retVal = require("./config");
  } catch (exception) {
    retVal = require("./config.default");
  }

  return retVal;
})();

try {
  config = Config.parse(rawConfig);
} catch (error) {
  logger.error("Could not parse config", error);
  process.exit(1);
}

logger.info("Using the following configuration:", redact(config, ["token"]));
logger.info("America/New_York");
const now = moment().tz("America/New_York");
const dayOfTheWeek = moment()
  .tz("America/New_York")
  .day();
const isWeekendDay = dayOfTheWeek === 0 || dayOfTheWeek === 6;

const startOfOOO = moment()
  .tz("America/New_York")
  .hours(config.app.timebox.start)
  .minutes(0); // 5 PM
const endOfOOO = moment()
  .tz("America/New_York")
  .hours(config.app.timebox.end)
  .minutes(0);

function end() {
  logger.info("Ending out of office...");
  if (bot instanceof Bot) {
    bot.stop();
  }
  process.exit();
}

function start() {
  logger.info("Starting bot...");
  bot = new Bot(config);
  setTimeout(() => {
    bot.start();
  }, 1000);
}

// Check if then end is later than now or not set (no end in sight)

if (!isWeekendDay) {
  // Check if we are past the start time
  if (now.isAfter(startOfOOO) || now.isBefore(endOfOOO)) {
    start();
  } else {
    logger.info(`Waiting until ${startOfOOO}th hour to start bot...`);
    setTimeout(start, config.app.timebox.start - now);
  }
} else {
  logger.error(`It is the weekend`);
}
