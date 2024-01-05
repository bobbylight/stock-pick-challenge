<template>
  <div class="app-banner">
    <div>
      <img src="/stock-pick-challenge-logo.png" alt="logo">
    </div>
    <div>
      <h1>Stock Market Challenge!</h1>
      <div id="nav">
        <router-link to="/head-to-head">Comparison</router-link> |
        <router-link to="/users/robert">Robert</router-link> |
        <router-link to="/users/carrow">Carrow</router-link> |
        <router-link to="/about">About</router-link>
      </div>
      <!--
      <div id="year">
        <button @click="setYear('2023')">2023</button> |
        <button @click="setYear('2022')">2022</button> |
        <button @click="setYear('2021')">2021</button>
      </div>
      -->
    </div>
  </div>
</template>

<script>
export default {
  methods: {
    setYear(year) {
      console.log('Setting year to: ' + year)
      this.$store.dispatch('setYear', year)
    },
  },
}
</script>

<style>
.app-banner {
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
}

h1 {
  font-size: 48px;
  color: #2c3e50;
}

.app-banner img {
  width: 240px;
  margin-inline-end: 2rem;
}

@media only screen and (max-width: 960px) {

  .app-banner {
    display: inherit;
  }
  h1 {
    font-size: 32px;
  }
  .app-banner img {
    width: 120px;
    margin-inline-end: 2rem;
  }
}

#nav {
  font-size: larger;
  font-weight: bold;
}

#nav a {
  color: #2c3e50;
}

#nav a.router-link-exact-active {
  color: #42b983;
}
</style>
