<template>
  <div class="space-y-3">
    <label class="font-bold text-sm text-gray-700">{{ label }}</label>
    <select 
      :value="modelValue" 
      @change="$emit('update:modelValue', $event.target.value)"
      class="w-full p-4 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none appearance-none"
    >
      <option v-for="opt in options" :key="opt" :value="opt">{{ opt }}</option>
    </select>
  </div>
</template>

<script setup>
defineProps({
  label: String,
  modelValue: String,
  options: Array
})
defineEmits(['update:modelValue'])
</script>
