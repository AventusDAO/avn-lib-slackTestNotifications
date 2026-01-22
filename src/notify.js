'use strict';

const fs = require('fs');
const path = require('path');
const SlackNotify = require('slack-notify');

function getPercentage(target, total) {
  if (!total) return 0;
  const percentage = (target * 100) / total;
  return Math.round(percentage * 100) / 100;
}

async function sendSlackReport(opts) {
  const {
    webhookUrl,
    reportJsonPath,
    suite,     // "functional" or "gateway"
    chain,     // "dev", "public_testnet", etc.
  } = opts || {};

  if (!webhookUrl) throw new Error('Missing webhookUrl (or set SLACK_WEBHOOK_URL env var)');
  if (!reportJsonPath) throw new Error('Missing reportJsonPath');
  if (!suite) throw new Error('Missing suite');
  if (!chain) throw new Error('Missing chain');

  const resolvedPath = path.resolve(process.cwd(), reportJsonPath);
  const jsonString = fs.readFileSync(resolvedPath, 'utf8');
  const reportConfig = JSON.parse(jsonString);

  const failures = reportConfig?.stats?.failures || 0;
  const tests = reportConfig?.stats?.tests || 0;
  const skipped = reportConfig?.stats?.skipped || 0;
  const passes = reportConfig?.stats?.passes || 0;

  const isFailure = failures > 0;
  const alertColor = isFailure ? '#bd2020' : '#2eb886';
  const resultMessage = isFailure ? 'FAILURE' : 'SUCCESS';

  const startDate = new Date(reportConfig.stats.start);
  const endDate = new Date(reportConfig.stats.end);

  const stringStartDate = String(reportConfig.stats.start).split('T').pop().replace('Z', '');
  const stringEndDate = String(reportConfig.stats.end).split('T').pop().replace('Z', '');

  const diffTime = endDate.getTime() - startDate.getTime();
  const duration = new Date(null);
  duration.setMilliseconds(Math.max(0, diffTime));
  const hhmmss = duration.toISOString().substr(11, 8);

  const reportsUrl = `https://aventusdao.github.io/avn-test-reports/${suite}/${chain}/`;

  const slack = SlackNotify(webhookUrl);

  // slack-notify supports callback-style; wrap in a Promise
  await new Promise((resolve, reject) => {
    slack.alert(
      {
        attachments: [
          {
            color: alertColor,
            blocks: [
              {
                type: 'header',
                text: { type: 'plain_text', text: `${chain.toUpperCase()} ${suite} Test results - ${resultMessage}` }
              },
              {
                type: 'section',
                fields: [
                  { type: 'mrkdwn', text: `*Date:*\n${startDate.getDate()}/${startDate.getMonth() + 1}/${startDate.getFullYear()}` },
                  { type: 'mrkdwn', text: `*Duration:*\n${hhmmss}s` }
                ]
              },
              {
                type: 'section',
                fields: [
                  { type: 'mrkdwn', text: `*Start_time:*\n${stringStartDate}` },
                  { type: 'mrkdwn', text: `*End_time:*\n${stringEndDate}` }
                ]
              }
            ]
          },
          {
            color: alertColor,
            fields: [
              { title: 'Total Test count', value: `${tests}/${tests} - ${getPercentage(tests, tests)}%`, short: true },
              { title: 'Skipped', value: `${skipped}/${tests} - ${getPercentage(skipped, tests)}%`, short: true },
              { title: 'Passes', value: `${passes}/${tests} - ${getPercentage(passes, tests)}%`, short: true },
              { title: 'Failures', value: `${failures}/${tests} - ${getPercentage(failures, tests)}%`, short: true },
              { title: `Test Reports for ${chain}`, value: reportsUrl }
            ]
          }
        ]
      },
      (err) => (err ? reject(err) : resolve())
    );
  });

  return { reportsUrl, resultMessage, failures, tests };
}

module.exports = { sendSlackReport };
