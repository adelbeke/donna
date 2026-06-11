# Security Policy

## Supported Versions

Only the latest commit on `main` is supported.

## Reporting a Vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Report privately by emailing the maintainer or using
[GitHub private vulnerability reporting](https://github.com/adelbeke/donna/security/advisories/new).

Include a description of the issue, steps to reproduce, and potential impact.
You will receive a response within 7 days.

## Note on credentials

donna never transmits your GitHub PAT to any server. The token is entered in the
browser, stored only in `localStorage`, and used exclusively for direct
client-to-GitHub GraphQL API calls. There is no backend.
