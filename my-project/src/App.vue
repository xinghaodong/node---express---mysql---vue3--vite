<template>
    <div id="app">
        <router-view></router-view>
    </div>
</template>
<script setup></script>

<style>
html,
body,
#app {
    margin: 0;
    padding: 0;
    height: 100%;
}

#app {
    display: flex;
    flex-direction: column;
    
}
.mb-4 {
    margin-bottom: 16px;
}
</style>
