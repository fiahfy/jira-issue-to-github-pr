# jira-issue-to-github-pr

[![Build Status](https://travis-ci.com/fiahfy/jira-issue-to-github-pr.svg?branch=master)](https://travis-ci.com/fiahfy/jira-issue-to-github-pr)

> Chrome Extension for Creating GitHub Pull Request from JIRA Issues

## Features

- Create GitHub pull reqests from JIRA issue pages
- The branch name, title and body can be set automatically by using the issue values

## Screenshots

![screenshot](.github/img/screenshot1.png)
![screenshot](.github/img/screenshot2.png)

## Installation

1. Download `archive.zip` from [releases page](https://github.com/fiahfy/jira-issue-to-github-pr/releases) and unzip this file.
2. Open the Extension Management page by navigating to `chrome://extensions`.
3. Enable Developer Mode by clicking the toggle switch next to **Developer mode**.
4. Click the **LOAD UNPACKED** button and select the unpacked directory named `app`.

## Development

```bash
# install dependencies
yarn

# watch files changed and reload extension
yarn dev
```
