const fs = require('fs');
const path = require('path');

const [reportsFolder = 'test-reports', bodyFile = 'email-body.html'] = process.argv.slice(2);

const OUTCOMES = {
    'pass'            : 'Passed',
    'below-threshold' : 'Low score',
    'http-error'      : 'HTTP error',
    'empty-response'  : 'Empty reply',
    'network-error'   : 'Network error',
};

const findResultFiles = (dir) => {
    if (!fs.existsSync(dir)) {
        return [];
    }
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            return findResultFiles(full);
        }
        return entry.name === 'results.jsonl' ? [full] : [];
    });
};

const escapeHtml = (text) => String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const percent = (part, total) => (total ? Math.round((part / total) * 100) : 0);

const resultsFile = findResultFiles(reportsFolder).sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0];
const results = resultsFile
    ? fs.readFileSync(resultsFile, 'utf8').split('\n').filter((line) => line.trim()).map((line) => JSON.parse(line))
    : [];

const runUrl = `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`;
const reportsUrl = process.env.REPORTS_URL || runUrl;
const testEnv = process.env.TEST_ENV || 'uat';
const jobResult = process.env.TEST_JOB_RESULT || 'unknown';

const byClient = new Map();
for (const result of results) {
    if (!byClient.has(result.client)) {
        byClient.set(result.client, Object.fromEntries(Object.keys(OUTCOMES).map((key) => [key, 0])));
    }
    byClient.get(result.client)[result.outcome] = (byClient.get(result.client)[result.outcome] ?? 0) + 1;
}

const total = results.length;
const passed = results.filter((r) => r.outcome === 'pass').length;
const passRate = percent(passed, total);

const cell = 'style="border:1px solid #ccc;padding:4px 8px;text-align:right"';
const headCell = 'style="border:1px solid #ccc;padding:4px 8px;background:#f0f0f0"';
const nameCell = 'style="border:1px solid #ccc;padding:4px 8px"';

const rows = [...byClient.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([client, counts]) => {
    const clientTotal = Object.values(counts).reduce((sum, n) => sum + n, 0);
    return `<tr><td ${nameCell}>${escapeHtml(client)}</td><td ${cell}>${clientTotal}</td>`
        + Object.keys(OUTCOMES).map((key) => `<td ${cell}>${counts[key]}</td>`).join('')
        + `<td ${cell}><b>${percent(counts.pass, clientTotal)}%</b></td></tr>`;
}).join('\n');

const totalsRow = `<tr><td ${nameCell}><b>Total</b></td><td ${cell}><b>${total}</b></td>`
    + Object.keys(OUTCOMES).map((key) => `<td ${cell}><b>${results.filter((r) => r.outcome === key).length}</b></td>`).join('')
    + `<td ${cell}><b>${passRate}%</b></td></tr>`;

const reportFolder = resultsFile ? path.relative(reportsFolder, path.dirname(resultsFile)).split(path.sep).join('/') : '';
const reportsLocation = JSON.parse(fs.readFileSync(path.join(__dirname, '../../tests/test.config.json'), 'utf8')).Reports?.Location ?? '';

const body = total === 0
    ? `<p>The ${escapeHtml(testEnv)} bot test run finished with status <b>${escapeHtml(jobResult)}</b>, but no test results were found.</p>
<p>See the run log: <a href="${runUrl}">${runUrl}</a></p>`
    : `<p>Bot test results for <b>${escapeHtml(testEnv)}</b> (${escapeHtml(reportFolder)}): <b>${passed} of ${total} passed (${passRate}%)</b>.</p>
<table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:13px">
<tr><th ${headCell}>Bot</th><th ${headCell}>Questions</th>${Object.values(OUTCOMES).map((label) => `<th ${headCell}>${label}</th>`).join('')}<th ${headCell}>Pass rate</th></tr>
${rows}
${totalsRow}
</table>
<p>The Excel report for each bot is attached. The full HTML report and the Excel files are also in S3 under
<code>${escapeHtml(reportsLocation)}/${escapeHtml(reportFolder)}</code>.</p>
<p>Download all reports (zip): <a href="${reportsUrl}">${reportsUrl}</a></p>`;

fs.writeFileSync(bodyFile, body);

const subject = total === 0
    ? `Bot tests (${testEnv}): no results (${jobResult})`
    : `Bot tests (${testEnv}) ${reportFolder.split('/').pop()}: ${passed}/${total} passed (${passRate}%)`;

if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `subject=${subject}\npass_rate=${passRate}\nreport_folder=${reportFolder}\n`);
}
console.log(subject);
