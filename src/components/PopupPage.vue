<template>
  <v-app>
    <v-content>
      <v-container fluid pa-5>
        <div class="d-flex">
          <v-text-field
            v-model="upstream"
            label="UPSTREAM"
            class="mr-2"
            :error-messages="upstreamErrors"
            required
            :style="{ width: '60px' }"
          />
          <v-text-field
            v-model="repository"
            label="REPOSITORY NAME"
            class=" mr-2"
            :error-messages="repositoryErrors"
            required
          />
          <v-icon>mdi-arrow-left-bold</v-icon>
          <v-text-field
            v-model="origin"
            label="ORIGIN"
            class=" ml-2"
            :error-messages="originErrors"
            required
            :style="{ width: '60px' }"
          />
          <v-text-field
            v-model="branch"
            label="BRANCH NAME"
            class=" ml-2"
            :error-messages="branchErrors"
            required
            persistent-hint
          />
        </div>
        <v-subheader class="pl-0">TEMPLATE</v-subheader>
        <v-text-field v-model="title" label="TITLE" class="" />
        <v-textarea v-model="body" label="BODY" class="" />

        <div class="caption">
          Placeholders (<span class="grey lighten-3 mx-1">$$ISSUE_ID$$</span>,
          <span class="grey lighten-3 mx-1">$$ISSUE_URL$$</span>,
          <span class="grey lighten-3 mx-1">$$ISSUE_HEADING$$</span>,
          <span class="grey lighten-3 mx-1">$$ISSUE_DESCRIPTION$$</span>) is
          replaced with this issue entry
        </div>

        <v-btn
          block
          small
          color="primary"
          class="mt-5"
          :loading="loading"
          @click="onClick"
          >Create Pull Request</v-btn
        >
      </v-container>
    </v-content>
  </v-app>
</template>

<script>
import browser from 'webextension-polyfill'
import { validationMixin } from 'vuelidate'
import { required } from 'vuelidate/lib/validators'

export default {
  mixins: [validationMixin],

  validations: {
    upstream: { required },
    origin: { required },
    repository: { required },
    branch: { required }
  },
  data() {
    return {
      loading: false
    }
  },
  computed: {
    upstream: {
      get() {
        return this.$store.state.upstream
      },
      set(value) {
        this.$store.commit('setUpstream', { upstream: value })
      }
    },
    origin: {
      get() {
        return this.$store.state.origin
      },
      set(value) {
        this.$store.commit('setOrigin', { origin: value })
      }
    },
    repository: {
      get() {
        return this.$store.state.repository
      },
      set(value) {
        this.$store.commit('setRepository', { repository: value })
      }
    },
    branch: {
      get() {
        return this.$store.state.branch
      },
      set(value) {
        this.$store.commit('setBranch', { branch: value })
      }
    },
    title: {
      get() {
        return this.$store.state.title
      },
      set(value) {
        this.$store.commit('setTitle', { title: value })
      }
    },
    body: {
      get() {
        return this.$store.state.body
      },
      set(value) {
        this.$store.commit('setBody', { body: value })
      }
    },
    upstreamErrors() {
      const errors = []
      if (!this.$v.upstream.$dirty) return errors
      !this.$v.upstream.required && errors.push('Upstream is required')
      return errors
    },
    repositoryErrors() {
      const errors = []
      if (!this.$v.repository.$dirty) return errors
      !this.$v.repository.required && errors.push('Repository is required')
      return errors
    },
    originErrors() {
      const errors = []
      if (!this.$v.origin.$dirty) return errors
      !this.$v.origin.required && errors.push('Origin is required')
      return errors
    },
    branchErrors() {
      const errors = []
      if (!this.$v.branch.$dirty) return errors
      !this.$v.branch.required && errors.push('Branch is required')
      return errors
    }
  },
  watch: {},
  async created() {},
  methods: {
    onClick() {
      this.$v.$touch()
      if (this.$v.$invalid) {
        return
      }
      this.loading = true
      browser.runtime.sendMessage({
        id: 'createPullRequest',
        data: {
          upstream: this.upstream,
          repository: this.repository,
          origin: this.origin,
          branch: this.branch,
          title: this.title,
          body: this.body
        }
      })
    }
  }
}
</script>

<style scoped>
.v-application {
  min-width: 512px;
}
.v-text-field >>> .v-label {
  font-size: 0.8rem;
}
.v-text-field >>> .v-messages {
  font-size: 0.6rem;
}
.v-text-field >>> input {
  font-size: 0.8rem;
}
.v-textarea >>> textarea {
  font-size: 0.8rem;
}
</style>
