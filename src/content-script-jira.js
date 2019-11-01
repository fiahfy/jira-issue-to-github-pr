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

const getContents = async ({ lazyFindingId = false }) => {
  const headingEl = await querySelectorAsync(
    '[data-test-id="issue.views.issue-base.foundation.summary.heading"]'
  )
  if (!headingEl) {
    throw new Error('Heading is not found')
  }
  const heading = headingEl.textContent

  const descriptionEl = await querySelectorAsync('.ak-renderer-document')
  if (!descriptionEl) {
    throw new Error('Description is not found')
  }
  const description = td.turndown(descriptionEl.innerHTML)

  let id = null
  if (lazyFindingId) {
    const match = document.title.match(/^\[([^\]]+)\]/)
    if (match) {
      id = match[1]
    }
  }

  return { heading, description, id }
}

browser.runtime.onMessage.addListener(async ({ id, data }) => {
  switch (id) {
    case 'requestContents':
      return await getContents(data)
  }
})
