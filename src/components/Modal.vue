<template>
  <transition name="modal-fade">
    <div class="modal" v-if="show" @click.self="closeOnBackdrop && close()">
      <div class="modal-content" :class="{ 'modal-large': large }">
        <h2>{{ title }}</h2>
        <div class="modal-scroll" v-html="content"></div>
        <div class="button-container">
          <slot name="buttons">
            <button class="button" @click="close">{{ closeButtonText }}</button>
          </slot>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { watch, onBeforeUnmount } from 'vue'
import { defineProps, defineEmits } from 'vue'

// 重命名组件以符合多词命名规则
defineOptions({
  name: 'ModalDialog'
})

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    default: ''
  },
  content: {
    type: String,
    default: ''
  },
  closeButtonText: {
    type: String,
    default: '关闭'
  },
  closeOnBackdrop: {
    type: Boolean,
    default: true
  },
  large: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

const close = () => {
  emit('close')
}

watch(() => props.show, (newVal) => {
  if (newVal) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

onBeforeUnmount(() => {
  document.body.style.overflow = ''
})
</script>

<style scoped>
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-large {
  max-width: 800px;
}

.modal-scroll {
  overflow-y: auto;
  margin: 15px 0;
  padding: 10px;
  flex-grow: 1;
}

.button-container {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 15px;
}

/* 过渡动画 */
.modal-fade-enter-active, .modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter, .modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter .modal-content,
.modal-fade-leave-to .modal-content {
  transform: scale(0.9);
}

.modal-fade-enter-active .modal-content,
.modal-fade-leave-active .modal-content {
  transition: transform 0.3s ease;
}

.modal-fade-enter-to .modal-content,
.modal-fade-leave .modal-content {
  transform: scale(1);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    max-height: 95vh;
  }
}
</style>
