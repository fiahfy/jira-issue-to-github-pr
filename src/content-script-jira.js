import browser from 'webextension-polyfill'
import turndown from 'turndown'

// TODO: bulletListMarker not working
const td = new turndown({ bulletListMarker: '-' })

let timer = null

const querySelectorAsync = (selector, interval = 100, timeout = 10000) => {
  return new Promise((resolve) => {
    const expireTime = Date.now() + timeout
    timer = setInterval(() => {
      const e = document.querySelector(selector)
      if (e || Date.now() > expireTime) {
        clearInterval(timer)
        resolve(e)
      }
    }, interval)
  })
}

const getContents = async () => {
  const headingEl = await querySelectorAsync(
    '[data-test-id="issue.views.issue-base.foundation.summary.heading"]'
  )
  if (!headingEl) {
    throw new Error('[jira-issue-to-github-pr] heading is not found')
  }
  const heading = headingEl.textContent

  const descriptionEl = await querySelectorAsync('.ak-renderer-document')
  if (!descriptionEl) {
    throw new Error('[jira-issue-to-github-pr] description is not found')
  }
  const description = td.turndown(descriptionEl.innerHTML)

  return { heading, description }
}

browser.runtime.onMessage.addListener(async ({ id }) => {
  switch (id) {
    case 'requestContents':
      return await getContents()
  }
})
