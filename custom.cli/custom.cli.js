#!/usr/bin/env node
"use strict";

var _yargs = _interopRequireDefault(require("sequelize-cli/lib/core/yargs"));

var _migrate = _interopRequireDefault(require("./custom.migrate"));

var _index = _interopRequireDefault(require("sequelize-cli/lib/helpers"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const yargs = (0, _yargs.default)();

_index.default.view.teaser();

// yargs.help().version().command('db:migrate', 'Run pending migrations', _migrate.default).wrap(yargs.terminalWidth()).demandCommand(1, 'Please specify a command').help().strict().recommendCommands().argv;