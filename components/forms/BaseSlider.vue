<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <label class="font-bold text-sm text-gray-700">{{ label }}</label>
      <span class="text-2xl font-bold text-primary">{{ formatValue(modelValue) }}</span>
    </div>
    <input 
      type="range" 
      :min="min" 
      :max="max" 
      :step="step" 
      :value="modelValue"
      @input="$emit('update:modelValue', Number($event.target.value))"
      class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
    />
    <div class="flex justify-between text-xs font-medium text-gray-400">
      <span>{{ formatValue(min) }}</span>
      <span>{{ formatValue(max) }}</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  label: String,
  modelValue: Number,
  min: Number,
  max: Number,
  step: Number,
  formatValue: { type: Function, default: (v) => v }
})
defineEmits(['update:modelValue'])
</script>
