<template functional>
  <div id="nav">
    <router-link to="/users/robert">Robert</router-link> |
    <router-link to="/users/carrow">Carrow</router-link> |
    <router-link to="/about">About</router-link>
  </div>
</template>

<script>
export default {
}
</script>

<style>

#nav {
  text-align: center;
  padding: 30px;
}

#nav a {
  font-weight: bold;
  color: #2c3e50;
}

#nav a.router-link-exact-active {
  color: #42b983;
}
</style>
