<template>
  <v-app>
    <v-content>
      <v-container fluid pa-5>
        <div class="d-flex mt-1">
          <!-- TODO: https://github.com/vuetifyjs/vuetify/issues/4679 -->
          <v-combobox
            v-model="baseRepository"
            label="BASE REPOSITORY"
            class=" mr-2"
            :items="history.baseRepository.slice().reverse()"
            :error-messages="baseRepositoryErrors"
            placeholder="owner/repository-name"
            dense
            required
            @input.native="baseRepository = $event.srcElement.value"
          />
          <v-combobox
            v-model="baseBranch"
            label="BASE BRANCH"
            class=" mr-2"
            :items="history.baseBranch.slice().reverse()"
            :error-messages="baseBranchErrors"
            placeholder="develop"
            dense
            required
            :style="{ width: '72px' }"
            @input.native="baseBranch = $event.srcElement.value"
          />
          <v-icon class="pb-3 pr-1">mdi-arrow-left-bold</v-icon>
          <v-combobox
            v-model="owner"
            label="HEAD OWNER"
            class=" ml-2"
            :items="history.owner.slice().reverse()"
            :error-messages="ownerErrors"
            placeholder="owner"
            dense
            required
            :style="{ width: '72px' }"
            @input.native="owner = $event.srcElement.value"
          />
          <v-combobox
            v-model="branch"
            label="HEAD BRANCH"
            class=" ml-2"
            :items="history.branch.slice().reverse()"
            :error-messages="branchErrors"
            placeholder="feature/$$ISSUE_ID$$"
            dense
            required
            persistent-hint
            @input.native="branch = $event.srcElement.value"
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
          :color="error ? 'error' : 'primary'"
          class="mt-5"
          :loading="loading"
          @click="onClick"
        >
          {{ error ? 'Error Occurred' : 'Create Pull Request' }}
        </v-btn>
      </v-container>
    </v-content>
  </v-app>
</template>

<script>
import browser from 'webextension-polyfill'
import { mapMutations, mapState } from 'vuex'
import { validationMixin } from 'vuelidate'
import { required } from 'vuelidate/lib/validators'

const ownerAndRepository = (value) => !!value.match(/^[^/]+\/[^/]+$/)

export default {
  mixins: [validationMixin],
  validations: {
    baseRepository: { required, ownerAndRepository },
    baseBranch: { required },
    owner: { required },
    branch: { required }
  },
  data() {
    return {
      error: false,
      loading: false
    }
  },
  computed: {
    baseRepository: {
      get() {
        return this.inputs.baseRepository
      },
      set(value) {
        this.setInputs({
          inputs: {
            ...this.inputs,
            baseRepository: value
          }
        })
      }
    },
    baseBranch: {
      get() {
        return this.inputs.baseBranch
      },
      set(value) {
        this.setInputs({
          inputs: {
            ...this.inputs,
            baseBranch: value
          }
        })
      }
    },
    owner: {
      get() {
        return this.inputs.owner
      },
      set(value) {
        this.setInputs({
          inputs: {
            ...this.inputs,
            owner: value
          }
        })
      }
    },
    branch: {
      get() {
        return this.inputs.branch
      },
      set(value) {
        this.setInputs({
          inputs: {
            ...this.inputs,
            branch: value
          }
        })
      }
    },
    title: {
      get() {
        return this.inputs.title
      },
      set(value) {
        this.setInputs({
          inputs: {
            ...this.inputs,
            title: value
          }
        })
      }
    },
    body: {
      get() {
        return this.inputs.body
      },
      set(value) {
        this.setInputs({
          inputs: {
            ...this.inputs,
            body: value
          }
        })
      }
    },
    baseRepositoryErrors() {
      if (!this.$v.baseRepository.$dirty) {
        return []
      }
      if (!this.$v.baseRepository.required) {
        return ['Repository is required']
      }
      if (!this.$v.baseRepository.ownerAndRepository) {
        return ['Invalid repository']
      }
      return []
    },
    baseBranchErrors() {
      if (!this.$v.baseBranch.$dirty) {
        return []
      }
      if (!this.$v.baseBranch.required) {
        return ['Branch is required']
      }
      return []
    },
    ownerErrors() {
      if (!this.$v.owner.$dirty) {
        return []
      }
      if (!this.$v.owner.required) {
        return ['Owner is required']
      }
      return []
    },
    branchErrors() {
      if (!this.$v.branch.$dirty) {
        return []
      }
      if (!this.$v.branch.required) {
        return ['Branch is required']
      }
      return []
    },
    ...mapState(['inputs', 'history'])
  },
  methods: {
    async onClick() {
      this.error = false
      this.$v.$touch()
      if (this.$v.$error) {
        return
      }
      this.loading = true
      try {
        await browser.runtime.sendMessage({
          id: 'createPullRequest',
          data: {
            baseRepository: this.baseRepository,
            baseBranch: this.baseBranch,
            owner: this.owner,
            branch: this.branch,
            title: this.title,
            body: this.body
          }
        })
        this.addHistory({
          history: {
            baseRepository: this.baseRepository,
            baseBranch: this.baseBranch,
            owner: this.owner,
            branch: this.branch
          }
        })
      } catch (e) {
        console.error(e)
        this.loading = false
        this.error = true
      }
    },
    ...mapMutations(['setInputs', 'addHistory'])
  }
}
</script>

<style scoped>
.v-application {
  min-width: 600px;
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
