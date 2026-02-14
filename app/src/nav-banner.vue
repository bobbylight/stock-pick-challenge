<template>
  <div class="app-banner">
    <div>
      <img
        :src="isDark ? '/stock-pick-challenge-logo-dark-mode.png' : '/stock-pick-challenge-logo.png'"
        alt="logo"
      >
    </div>
    <div>
      <h1>
        <v-menu>
          <template #activator="{ props }">
            <a
              class="year-selector"
              v-bind="props"
            >{{ store.year }}</a>
          </template>
          <v-list>
            <v-list-item
              v-for="year in ['2026', '2025', '2024', '2023', '2022', '2021']"
              :key="year"
              @click="setYear(year)"
            >
              <v-list-item-title>{{ year }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
        Stock Market Challenge!
      </h1>
      <h6>Last updated: {{ lastUpdated }}</h6>
      <div class="nav">
        <router-link to="/head-to-head">
          Comparison
        </router-link> |
        <router-link to="/users/robert">
          Robert
        </router-link> |
        <router-link to="/users/carrow">
          Carrow
        </router-link> |
        <router-link to="/about">
          About
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useTheme } from 'vuetify'
import { useStore } from './store'

const store = useStore()
const theme = useTheme()
const lastUpdated = computed(() => store.lastUpdated)

const isDark = computed(() => theme.global.name.value === 'dark')

const setYear = year => store.setYear(year)
</script>

<style>
.app-banner {
  --active-link-color: #0ea5e9;
  --text-color: #1e293b;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  color: var(--text-color);

  .year-selector {
    cursor: pointer;
  }

  h1 {
    font-size: 48px;
    a {
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  }

  h6 {
    margin-top: -0.5rem;
    margin-bottom: 1rem;
  }

  img {
    width: 240px;
    margin-inline-end: 2rem;
  }

  @media only screen and (max-width: 960px) {
    display: inherit;

    h1 {
      font-size: 32px;
    }

    img {
      width: 120px;
      margin-inline-end: 2rem;
    }
  }

  a {
    color: var(--text-color);
    display: inline-block; /* Avoid issue with trailing space in anchor tag text after linting */
    transition: color 0.2s ease;
  }
  a:hover {
    color: var(--active-link-color);
  }

  .nav {
    font-size: larger;
    font-weight: bold;

    a.router-link-exact-active {
      color: var(--active-link-color);
    }
  }

  @media only screen and (max-width: 468px) {
    h1 {
      font-size: 26px;
    }
    .nav {
      font-size: initial;
    }
  }
}

.v-theme--dark .app-banner {
  --text-color: #e2e8f0;
  --active-link-color: #38bdf8;
}
</style>
