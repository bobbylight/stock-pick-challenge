<template>
  <div id="app">
    <v-app>
      <v-main>
        <v-container class="main-container">
          <nav-banner />

          <router-view v-slot="{ Component, route }">
            <transition
              name="fade"
              mode="out-in"
            >
              <component
                :is="Component"
                :key="route.path"
              />
            </transition>
          </router-view>
        </v-container>
      </v-main>
    </v-app>
  </div>
</template>

<script setup>
import NavBanner from './nav-banner.vue'
</script>

<style>
.main-container {
  max-width: 1024px !important;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
