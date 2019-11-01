import browser from 'webextension-polyfill'
import Vue from 'vue'
import Vuex from 'vuex'
import VuexPersistence from 'vuex-persist'

Vue.use(Vuex)

const vuexPersist = new VuexPersistence({
  storage: browser.storage.local,
  asyncStorage: true,
  restoreState: async (key, storage) => {
    const result = await storage.get(key)
    const json = result[key]

    let state = {}
    try {
      state = JSON.parse(json)
    } catch (e) {} // eslint-disable-line no-empty

    return {
      ...state,
      __storageReady: true
    }
  },
  saveState: async (key, state, storage) => {
    const json = JSON.stringify(state)
    await storage.set({ [key]: json })
  }
})

const config = {
  state: {
    history: {
      baseRepository: [],
      baseBranch: [],
      owner: [],
      branch: []
    },
    inputs: {
      baseRepository: '',
      baseBranch: 'develop',
      owner: '',
      branch: 'feature/$$ISSUE_ID$$',
      title: '[$$ISSUE_ID$$] $$ISSUE_HEADING$$',
      body: ''
    }
  },
  mutations: {
    setInputs(state, { inputs }) {
      state.inputs = inputs
    },
    addHistory(
      state,
      {
        history: { baseRepository, baseBranch, owner, branch }
      }
    ) {
      state.history = {
        baseRepository: [
          ...state.history.baseRepository
            .slice()
            .filter((item) => item !== baseRepository),
          baseRepository
        ],
        baseBranch: [
          ...state.history.baseBranch
            .slice()
            .filter((item) => item !== baseBranch),
          baseBranch
        ],
        owner: [
          ...state.history.owner.slice().filter((item) => item !== owner),
          owner
        ],
        branch: [
          ...state.history.branch.slice().filter((item) => item !== branch),
          branch
        ]
      }
    },
    setTitle(state, { title }) {
      state.title = title
    },
    setBody(state, { body }) {
      state.body = body
    }
  },
  plugins: [
    vuexPersist.plugin,
    (store) => {
      store.subscribe(() => {
        browser.runtime.sendMessage({ id: 'settingsChanged' })
      })
    }
  ]
}

export default function createStore(waitStorageReady = false) {
  return new Promise((resolve) => {
    const store = new Vuex.Store(config)
    if (!waitStorageReady) {
      resolve(store)
      return
    }
    // wait for async storage restore
    // @see https://github.com/championswimmer/vuex-persist/issues/15
    const timeout = Date.now() + 1000
    const timer = setInterval(() => {
      if (store.state.__storageReady || Date.now() > timeout) {
        clearInterval(timer)
        resolve(store)
      }
    }, 100)
  })
}
