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

<script>
import { mapState, mapActions } from 'vuex'

export default {
  name: 'GameInteraction',
  computed: {
    ...mapState('game', ['isSubmitting', 'isCooldown', 'userInput'])
  },
  methods: {
    ...mapActions('interaction', ['handleUserInput'])
  }
}
</script>
