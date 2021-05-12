<template>
  <div>
    <v-app-bar
      app
      fixed
      dark
      color="primary"
    >
      <v-app-bar-nav-icon @click.stop="toggleMenu"></v-app-bar-nav-icon>

      <v-toolbar-title>Verify</v-toolbar-title>

    </v-app-bar>

  </div>
</template>

<script lang="ts">
  import { Component, Vue } from 'vue-property-decorator';
  @Component
  export default class TopToolbar extends Vue {
    showMenu: boolean = false;
    toggleMenu(): void {
      this.showMenu = !this.showMenu;
    }
    doNothing(): void {
    }
  }
</script>