<script setup lang="ts">
import { ref } from 'vue';
import { useQuery } from '../graphql/gqty';
const { query, isLoading } = useQuery();

const log = (message: any) => {
  console.log(message);
};
</script>

<template>
  <span v-if="isLoading">Loading....</span>
  <span v-else>Not Loading</span>

  <div v-for="dog in query.dogs" :key="dog.id">
    {{ dog.name }}
  </div>
  <!--  <span>{{ // test }}</span>-->
</template>
