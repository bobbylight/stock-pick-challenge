<template>
  <div class="theme-toggle">
    <v-btn-toggle
      :model-value="isDark ? 'dark' : 'light'"
      mandatory
      density="compact"
      rounded="pill"
      variant="outlined"
      color="secondary"
      @update:model-value="setTheme"
    >
      <v-btn
        value="light"
        :icon="mdiWhiteBalanceSunny"
        size="small"
      />
      <v-btn
        value="dark"
        :icon="mdiWeatherNight"
        size="small"
      />
    </v-btn-toggle>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useTheme } from 'vuetify'
import { mdiWeatherNight, mdiWhiteBalanceSunny } from '@mdi/js'

const theme = useTheme()
const isDark = computed(() => theme.global.name.value === 'dark')

const setTheme = value => {
  theme.global.name.value = value
  localStorage.setItem('theme', value)
}
</script>

<style scoped>
.theme-toggle {
  position: absolute;
  top: 1rem;
  right: 1rem;

  .v-btn-toggle .v-btn {
    padding-inline: 1.5rem;
  }
}
</style>
