<template>
  <div style="display: flex; justify-content: center" class="pb-1">
    <v-btn-toggle
        mandatory
        v-model="model"
        divided
        variant="plain"
        class="text-right"
        style="height: 24px"
    >
      <v-btn size="small" color="primary" style="min-width: 30px" :value=-1>All</v-btn>
      <v-btn size="small" color="primary" style="min-width: 30px" :value="5">5d</v-btn>
      <v-btn size="small" color="primary" style="min-width: 30px" :value="14">2w</v-btn>
      <v-btn size="small" color="primary" style="min-width: 30px" :value="30">1m</v-btn>
    </v-btn-toggle>
  </div>
</template>

<script setup>
const model = defineModel()
</script>
