<template>
  <div id="app">
    <v-app>
      <v-main>

        <v-container class="main-container">

          <nav-banner/>

          <transition name="fade">
            <keep-alive>
              <router-view :key="$route.path"/>
            </keep-alive>
          </transition>
        </v-container>
      </v-main>
    </v-app>
  </div>
</template>

<script>
import NavBanner from './nav-banner'

export default {

  components: {
    NavBanner,
  }
}
</script>

<style>
.main-container {
  max-width: 1024px !important;
}
</style>
