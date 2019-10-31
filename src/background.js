import browser from 'webextension-polyfill'
import icon from './assets/icon.png'
import iconOn from './assets/icon-on.png'

let lazyPr = {}

const getActiveTab = async () => {
  const tabs = await browser.tabs.query({
    active: true,
    currentWindow: true
  })
  return tabs[0]
}

const updateIcon = async (tabId, disabled = false) => {
  if (disabled) {
    await browser.pageAction.setIcon({ tabId, path: icon })
    await browser.pageAction.hide(tabId)
  } else {
    await browser.pageAction.setIcon({ tabId, path: iconOn })
    await browser.pageAction.show(tabId)
  }
}

const showIcon = async (tabId) => {
  await updateIcon(tabId, false)
}

const hideIcon = async (tabId) => {
  await updateIcon(tabId, true)
}

const extractIssueIdFromRapidBoardUrl = (url) => {
  if (!url.match(/^https:\/\/.*\.atlassian\.net\/secure\/RapidBoard.jspa/)) {
    return null
  }
  if (!url.includes('modal=detail')) {
    return null
  }
  const match = url.match(/(?:\?|&)selectedIssue=([^/?&=]+)/)
  if (!match) {
    return null
  }
  return match[1]
}

const extractIssueIdfromUrl = (url) => {
  let match
  // issue page
  match = url.match(/^https:\/\/.*\.atlassian\.net\/browse\/([^?/]+)/)
  if (match) {
    return match[1]
  }
  // project issue page
  match = url.match(
    /^https:\/\/.*\.atlassian\.net\/projects\/[^/]+\/issues\/([^?/]+)/
  )
  // rapid view
  const issueId = extractIssueIdFromRapidBoardUrl(url)
  if (issueId) {
    return issueId
  }
  // not match
  return null
}

const buildIssueUrlFromCurrentUrl = (issueId, url) => {
  const u = new URL(url)
  const origin = u.origin
  return `${origin}/browse/${issueId}`
}

const getIssue = async (tab) => {
  const issueId = extractIssueIdfromUrl(tab.url)
  const { heading, description } = await browser.tabs.sendMessage(tab.id, {
    id: 'requestContents'
  })
  return {
    id: issueId,
    url: buildIssueUrlFromCurrentUrl(issueId, tab.url),
    heading,
    description
  }
}

const buildPr = (params, issue) => {
  const branch = params.branch.replace(/\$\$ISSUE_ID\$\$/, issue.id)
  const url = `https://github.com/${params.upstream}/${params.repository}/compare/develop...${params.origin}:${branch}?expand=1`

  const title = params.title
    .replace(/\$\$ISSUE_ID\$\$/, issue.id)
    .replace(/\$\$ISSUE_URL\$\$/, issue.url)
    .replace(/\$\$ISSUE_HEADING\$\$/, issue.heading)
    .replace(/\$\$ISSUE_DESCRIPTION\$\$/, issue.description)

  const body = params.body
    .replace(/\$\$ISSUE_ID\$\$/, issue.id)
    .replace(/\$\$ISSUE_URL\$\$/, issue.url)
    .replace(/\$\$ISSUE_HEADING\$\$/, issue.heading)
    .replace(/\$\$ISSUE_DESCRIPTION\$\$/, issue.description)

  return { url, title, body }
}

const findOrCreateTab = async (url) => {
  const tabs = await browser.tabs.query({})
  const tab = tabs.find((tab) => tab.url === url)
  if (tab) {
    await browser.tabs.update(tab.id, { active: true })
    return tab
  }
  return await browser.tabs.create({ url })
}

const createPullRequest = async (tab, params) => {
  const issue = await getIssue(tab)

  const pr = buildPr(params, issue)

  const distTab = await findOrCreateTab(pr.url)

  try {
    await browser.tabs.sendMessage(distTab.id, {
      id: 'sendContents',
      data: pr
    })
  } catch (e) {
    // wait until document is loaded
    lazyPr[distTab.id] = pr
  }
}

browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // jira issue page
  const match = !!extractIssueIdfromUrl(tab.url)
  if (match) {
    await showIcon(tabId)
  } else {
    await hideIcon(tabId)
  }

  if (changeInfo.status === 'complete') {
    // opened github pr page
    const pr = lazyPr[tabId]
    if (pr) {
      await browser.tabs.sendMessage(tabId, {
        id: 'sendContents',
        data: pr
      })
      delete lazyPr[tabId]
      return
    }
  }
})

browser.runtime.onMessage.addListener(async (message) => {
  const { id, data } = message
  switch (id) {
    case 'createPullRequest': {
      const tab = await getActiveTab()
      await createPullRequest(tab, data)
      break
    }
  }
})
