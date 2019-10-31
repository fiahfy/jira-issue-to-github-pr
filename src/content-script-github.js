import browser from 'webextension-polyfill'

const updateInputs = ({ title, body }) => {
  const textField = document.querySelector('#pull_request_title')
  if (textField) {
    textField.value = title
  }

  const textarea = document.querySelector('#pull_request_body')
  if (textarea) {
    textarea.textContent = body
  }
}

browser.runtime.onMessage.addListener(async ({ id, data }) => {
  switch (id) {
    case 'sendContents':
      updateInputs(data)
      break
  }
})
