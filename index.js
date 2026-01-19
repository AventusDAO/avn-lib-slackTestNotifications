module.exports = SlackTestReportNotification;

const fs = require('fs');
const SlackNotify = require('slack-notify');
const path = require('path');
const oneSecondInMiliseconds = 1000;
function SlackTestReportNotification(slackUrl) {
  this.slack = SlackNotify(slackUrl);
}

SlackTestReportNotification.prototype.sendReportNotification = function (reportJsonFilePath, testType, chain) {
    const resolvedPath = path.resolve(__dirname, reportJsonFilePath);
    const jsonString = fs.readFileSync(resolvedPath);
    const reportConfig = JSON.parse(jsonString);

    const failures = reportConfig.stats.failures || 0;
    const isFailure = failures > 0;
    const alertColor = isFailure ? "#bd2020" : "#2eb886";
    const resultMessage = isFailure ? "FAILURE" : "SUCCESS";

    const startDate = new Date(reportConfig.stats.start);
    const endDate = new Date(reportConfig.stats.end);

    let stringStartDate = reportConfig.stats.start.split('T').pop().replace('Z','');
    let stringEndDate = reportConfig.stats.end.split('T').pop().replace('Z','');

    const diffTime = endDate.getTime() - startDate.getTime();

    let duration = new Date(null);
    duration.setMilliseconds(diffTime);
    let hhmmssDateFormat = duration.toISOString().substr(11, 8);

    this.slack.alert({
        attachments: [
        {
            color: alertColor,
            blocks: [
            {
                type: "header",
                text: {
                type: "plain_text",
                text: `${chain.toUpperCase()} ${testType} Test results - ${resultMessage}`,
                }
            },
            {
                type: "section",
                fields: [
                {
                    type: "mrkdwn",
                    text: `*Date:*\n${startDate.getDate()}/${startDate.getMonth() + 1}/${startDate.getFullYear()}`
                },
                {
                    type: "mrkdwn",
                    text: `*Duration:*\n${hhmmssDateFormat}s`
                }
                ]
            },
            {
                type: "section",
                fields: [
                {
                    type: "mrkdwn",
                    text: `*Start_time:*\n${stringStartDate}`
                },
                {
                    type: "mrkdwn",
                    text: `*End_time:*\n${stringEndDate}`
                }
                ]
            }
            ],
        },
        {
            color: alertColor,
            fields: [
            {
                title: 'Total Test count',
                value: `${reportConfig.stats.tests}/${reportConfig.stats.tests} - ${getPercentage(reportConfig.stats.tests, reportConfig.stats.tests)}%`,
                short: true
            },
            {
                title: 'Skipped',
                value: `${reportConfig.stats.skipped}/${reportConfig.stats.tests} - ${getPercentage(reportConfig.stats.skipped, reportConfig.stats.tests)}%`,
                short: true
            },
            {
                title: 'Passes',
                value: `${reportConfig.stats.passes}/${reportConfig.stats.tests} - ${getPercentage(reportConfig.stats.passes, reportConfig.stats.tests)}%`,
                short: true
            },
            {
                title: 'Failures',
                value: `${reportConfig.stats.failures}/${reportConfig.stats.tests} - ${getPercentage(reportConfig.stats.failures, reportConfig.stats.tests)}%`,
                short: true
            },
            {
                title: `Test Reports for ${chain}`,
                value: `https://https://aventusdao.github.io/avn-test-reports/${testType}/${chain}/`,
            }
            ],
        }
        ]
    });
}

function getPercentage(target, total) {
const percentage = (target * 100) / total;
return Math.round(percentage * 100) / 100;
}

