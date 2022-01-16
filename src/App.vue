<template>  <v-app>
    <v-app-bar
      app
      color="primary"
      dark
    >
      <div class="d-flex align-center">
        <v-img
          alt="Bermuda Coat Of Arms"
          class="shrink mr-2"
          contain
          src="@/assets/logo.png"
          transition="scale-transition"
          width="30"
        />

     </div>

      <v-spacer></v-spacer>
      <span class="mr-2 text-uppercase">verify.gov.bm</span>
    </v-app-bar>

    <v-main>
      <router-view/>
      <v-snackbar bottom right :value="updateExists" :timeout="0" color="primary">
        An update is available
        <v-btn text @click="refreshApp">
          Update
        </v-btn>
      </v-snackbar>
    </v-main>
    <v-footer>
      Version: {{ appVersion }}
    </v-footer>

  </v-app>
</template>

<script lang="ts">
import Vue from 'vue';
import packageJson from '../package.json';
import update from './mixins/update';

export default Vue.extend({
  name: 'App',

  data: () => ({
    appVersion: packageJson.version
  }),
  mixins:[update]
});
</script>
