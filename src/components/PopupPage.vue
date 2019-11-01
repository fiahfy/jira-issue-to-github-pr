<template>
  <v-app>
    <v-content>
      <v-container fluid pa-0>
        <div
          class="caption pt-1 pb-0 px-3 d-flex align-center"
          :style="{ marginBottom: '2px' }"
        >
          <v-icon small class="mr-1" color="primary">mdi-source-pull</v-icon>
          <span>JIRA Issue to GitHub Pull Request</span>
        </div>
        <v-divider />
        <div class="pa-3 mt-3">
          <div class="d-flex">
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
          <v-text-field
            v-model="titleTemplate"
            label="TITLE TEMPLATE"
            placeholder="[$$ISSUE_ID$$] $$ISSUE_HEADING$$"
            hint="`$$ISSUE_ID$$`, `$$ISSUE_HEADING$$` are replaced with this issue entry"
            persistent-hint
          />
          <v-textarea
            v-model="bodyTemplate"
            class="mt-5"
            label="BODY TEMPLATE"
            placeholder="Leave a comment"
            hint="`$$ISSUE_ID$$`, `$$ISSUE_URL$$`, `$$ISSUE_HEADING$$`, `$$ISSUE_DESCRIPTION$$` are replaced with this issue entry"
            persistent-hint
          />
          <v-switch
            v-model="useBodyTemplate"
            label="Use Body Template"
            hide-details
          />
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
        </div>
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
    titleTemplate: {
      get() {
        return this.inputs.titleTemplate
      },
      set(value) {
        this.setInputs({
          inputs: {
            ...this.inputs,
            titleTemplate: value
          }
        })
      }
    },
    bodyTemplate: {
      get() {
        return this.inputs.bodyTemplate
      },
      set(value) {
        this.setInputs({
          inputs: {
            ...this.inputs,
            bodyTemplate: value
          }
        })
      }
    },
    useBodyTemplate: {
      get() {
        return this.inputs.useBodyTemplate
      },
      set(value) {
        this.setInputs({
          inputs: {
            ...this.inputs,
            useBodyTemplate: value
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
            titleTemplate: this.titleTemplate,
            bodyTemplate: this.bodyTemplate,
            useBodyTemplate: this.useBodyTemplate
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
.v-input >>> .v-label {
  font-size: 0.8rem;
}
</style>
