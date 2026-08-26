const fs = require('fs');
const path = require('path');

const readmePath = path.resolve(__dirname, '../README.md');
const coveragePath = path.resolve(__dirname, '../coverage/coverage-summary.json');

// 1. Read coverage summary
let coverageData;
try {
    const raw = fs.readFileSync(coveragePath, 'utf8');
    coverageData = JSON.parse(raw);
} catch (e) {
    console.error('Error reading coverage summary:', e.message);
    process.exit(1);
}

const total = coverageData.total;
const linesPct = total.lines.pct;
const statementsPct = total.statements.pct;
const functionsPct = total.functions.pct;
const branchesPct = total.branches.pct;

// 2. Format metrics markdown table
const badgeColor = linesPct >= 95 ? 'brightgreen' : linesPct >= 80 ? 'yellow' : 'red';
const coverageBadge = `![Coverage](https://img.shields.io/badge/Coverage-${linesPct}%25-${badgeColor})`;

const coverageTable = `
${coverageBadge}

| Metric | Total | Covered | Percentage |
| :--- | :---: | :---: | :---: |
| **Lines** | ${total.lines.total} | ${total.lines.covered} | ${linesPct}% |
| **Statements** | ${total.statements.total} | ${total.statements.covered} | ${statementsPct}% |
| **Functions** | ${total.functions.total} | ${total.functions.covered} | ${functionsPct}% |
| **Branches** | ${total.branches.total} | ${total.branches.covered} | ${branchesPct}% |
`;

// 3. Format Build status markdown
const buildBadge = `![Build Status](https://github.com/charles2ke/basa/actions/workflows/ci.yml/badge.svg)`;
const buildTimestamp = `**Last Automated Update:** ${new Date().toUTCString()}`;

const buildStatusSnippet = `
${buildBadge}

${buildTimestamp}
`;

// 4. Format live demo / deployment run links
const serverUrl = process.env.GITHUB_SERVER_URL || 'https://github.com';
const repository = process.env.GITHUB_REPOSITORY || 'charles2ke/basa';
const [repoOwner, repoName] = repository.split('/');
const pagesUrl = process.env.PAGES_URL || `https://${repoOwner}.github.io/${repoName}/`;
const runUrl = process.env.GITHUB_RUN_ID
    ? `${serverUrl}/${repository}/actions/runs/${process.env.GITHUB_RUN_ID}`
    : `${serverUrl}/${repository}/actions/workflows/ci.yml`;

const liveDemoSnippet = `
🚀 **Live site:** ${pagesUrl}

**Latest deployment run:** ${runUrl}
`;

// 5. Update README.md
let readmeContent = fs.readFileSync(readmePath, 'utf8');

const buildRegex = /(<!-- BUILD_STATUS_START -->)([\s\S]*?)(<!-- BUILD_STATUS_END -->)/g;
readmeContent = readmeContent.replace(buildRegex, `$1\n${buildStatusSnippet.trim()}\n$3`);

const coverageRegex = /(<!-- COVERAGE_START -->)([\s\S]*?)(<!-- COVERAGE_END -->)/g;
readmeContent = readmeContent.replace(coverageRegex, `$1\n${coverageTable.trim()}\n$3`);

const liveDemoRegex = /(<!-- LIVE_DEMO_START -->)([\s\S]*?)(<!-- LIVE_DEMO_END -->)/g;
readmeContent = readmeContent.replace(liveDemoRegex, `$1\n${liveDemoSnippet.trim()}\n$3`);

fs.writeFileSync(readmePath, readmeContent, 'utf8');
console.log('Successfully updated README.md with build, coverage and deployment metrics!');
