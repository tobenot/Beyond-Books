<template>
  <div class="game-interaction">
    <input 
      type="text" 
      v-model="userInput"
      @keyup.enter="handleUserInput"
      :disabled="isSubmitting || isCooldown"
    />
    <button 
      @click="handleUserInput"
      :disabled="isSubmitting || isCooldown"
    >
      提交
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'

const store = useStore()

const isSubmitting = computed(() => store.state.game.isSubmitting)
const isCooldown = computed(() => store.state.game.isCooldown)
const userInput = computed(() => store.state.game.userInput)

const handleUserInput = () => {
  store.dispatch('interaction/handleUserInput')
}
</script>
