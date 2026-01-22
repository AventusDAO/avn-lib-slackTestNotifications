#!/usr/bin/env node
'use strict';

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { sendSlackReport } = require('../src/notify');

(async () => {
  const argv = yargs(hideBin(process.argv))
    .usage('Send Slack notification for mochawesome merged JSON')
    .option('suite', { type: 'string', demandOption: true, describe: 'functional or gateway' })
    .option('chain', { type: 'string', demandOption: true })
    .option('reportJsonPath', { type: 'string', demandOption: true, describe: 'Path to finalReport.json' })
    .option('webhookUrl', { type: 'string', default: process.env.SLACK_WEBHOOK_URL })
    .check((a) => {
      if (!a.webhookUrl) throw new Error('Missing --webhookUrl (or set SLACK_WEBHOOK_URL env var)');
      return true;
    })
    .help()
    .argv;

  try {
    await sendSlackReport(argv);
  } catch (e) {
    console.error(`❌ ${e?.message || e}`);
    process.exit(1);
  }
})();
