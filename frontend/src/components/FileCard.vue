<template>
  <div
    class="file-item"
    :class="{ selected: !!selected, readonly: !!readonly }"
    @click="handleCardClick"
  >
    <!-- чекбокс выбора (только не readonly) -->
    <div v-if="!readonly" class="file-select" @click.stop>
      <QCheckbox
        dense
        :model-value="!!selected"
        @update:model-value="emitToggle"
      />
    </div>

    <!-- кнопка удалить (только не readonly) -->
    <div v-if="!readonly" class="file-actions" @click.stop>
      <QBtn
        flat
        round
        icon="delete"
        color="negative"
        size="sm"
        @click.stop="emitDelete"
      />
    </div>

    <div class="file-icon">
      <QIcon :name="iconName" size="48px" color="blue-grey-7" />
    </div>

    <div class="file-name">
      {{ file?.name }}
    </div>

    <div class="file-info">
      <small class="text-grey-6">{{ dateText }}</small>
      <small class="text-grey-6">{{ sizeText }}</small>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  file: { type: Object, required: true },
  readonly: { type: Boolean, default: false },
  selected: { type: Boolean, default: false },
})

const emit = defineEmits(['toggle-select', 'delete'])

function emitToggle() {
  emit('toggle-select', props.file.id)
}
function emitDelete() {
  emit('delete', props.file.id)
}

function handleCardClick() {
  // кликом по карточке тоже можно выбирать (как в проводнике)
  if (!props.readonly) emitToggle()
}

const iconName = computed(() => {
  const filename = props.file?.name || ''
  const ext = filename.includes('.') ? filename.split('.').pop().toLowerCase() : ''

  const map = {
    pdf: 'picture_as_pdf',
    doc: 'description',
    docx: 'description',
    txt: 'article',
    rtf: 'article',
    xls: 'grid_on',
    xlsx: 'grid_on',
    csv: 'table_chart',
    ppt: 'slideshow',
    pptx: 'slideshow',
    jpg: 'image',
    jpeg: 'image',
    png: 'image',
    gif: 'image',
    webp: 'image',
    zip: 'folder_zip',
    rar: 'folder_zip',
    '7z': 'folder_zip',
    mp3: 'audiotrack',
    wav: 'audiotrack',
    mp4: 'movie',
    mov: 'movie',
  }

  return map[ext] || 'insert_drive_file'
})

const sizeText = computed(() => formatBytes(props.file?.size))
const dateText = computed(() => formatDate(props.file?.cdate))

function formatBytes(bytes) {
  if (bytes == null) return '-'
  const units = ['Б', 'КБ', 'МБ', 'ГБ', 'ТБ']
  let b = Number(bytes)
  let i = 0
  while (b >= 1024 && i < units.length - 1) {
    b /= 1024
    i++
  }
  const value = i === 0 ? Math.round(b) : Math.round(b * 10) / 10
  return `${value} ${units[i]}`
}

function formatDate(raw) {
  if (!raw) return '-'
  const d = new Date(String(raw).replace(' ', 'T'))
  if (Number.isNaN(d.getTime())) return String(raw)

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}
</script>

<style scoped>
/* стиль/поведение как у папки */
.file-item {
  min-height: 160px;
  padding: 20px 16px;
  border-radius: 12px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;

  position: relative;
}

.file-item:hover {
  border-color: var(--q-primary);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

/* выбранный */
.file-item.selected {
  border-color: var(--q-primary);
  box-shadow: 0 6px 18px rgba(74, 123, 255, 0.20);
}

/* если readonly — курсор обычный, hover можно чуть спокойнее */
.file-item.readonly {
  cursor: default;
}
.file-item.readonly:hover {
  transform: none;
}

/* чекбокс слева сверху */
.file-select {
  position: absolute;
  top: 8px;
  left: 8px;
}

/* кнопка удалить справа сверху */
.file-actions {
  position: absolute;
  top: 6px;
  right: 6px;
}

.file-icon {
  margin-bottom: 12px;
  position: relative;
}

.file-icon::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 8px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  filter: blur(2px);
}

.file-name {
  font-weight: 500;
  text-align: center;
  margin-bottom: 6px;
  word-break: break-word;
  max-width: 100%;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 34px;
}

.file-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: center;
}
</style>
