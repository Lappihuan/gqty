<script setup lang="ts">
import { ref } from 'vue';
import { useQuery } from '../graphql/gqty';
import useTestComposable from '../testComposable';
const test = ref({ test: 'test' });
const { query, isLoading } = useQuery();

const { bla, myCrazyObjectRef, testLoading } = useTestComposable(false);

const log = (message: any) => {
  console.log(message);
};
</script>

<template>
  <span v-if="testLoading">Loading....</span>
  <span v-else>Not Loading</span>
  {{ query.dogs }}
  {{ log(query) }}
  {{ log(isLoading) }}
  {{ log(test) }}

  {{ log(bla) }}
  {{ log(myCrazyObjectRef) }}
  {{ log(testLoading) }}

  {{ myCrazyObjectRef }}

  <div v-for="dog in query.value.dogs" :key="dog.id">
    {{ dog.name + ' tessssssssst' }}
  </div>
  <!--  <span>{{ // test }}</span>-->
</template>
