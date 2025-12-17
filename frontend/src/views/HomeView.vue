<template>
  <PageLayout>
    <template #buttons>
      <QBtn v-if="!isReadOnly" label="Загрузить" rounded color="amber" icon="cloud_upload"/>
      <QBtn v-if="!isReadOnly" label="Создать папку" rounded color="primary" icon="create_new_folder" @click="createFolder"/>
    </template>
    <template #content>
  <QBreadcrumbs v-if="breadcrumbs?.length" class="q-mb-md breadcrumbs">
    <QBreadcrumbsEl
      v-for="(item, index) in breadcrumbs"
      :key="item.id"
      :label="item.name"
      icon="folder"
      :clickable="index !== breadcrumbs.length - 1"
      @click="index !== breadcrumbs.length - 1 && goToFolder(item)"
    />
  </QBreadcrumbs>


      <div v-if="childFolders?.length" class="section">
        <div class="text-h6 q-mb-md">Папки</div>
        <div class="folders-grid">
          <Folder
            v-for="folder in childFolders"
            :key="folder.id"
            :folder="folder"
            @click="openFolder(folder)"
            @contextmenu.prevent="showContextMenu(folder, $event)"
          />
        </div>
      </div>

      <div
        v-if="!folderData?.files?.length && !childFolders?.length"
        class="empty-state flex flex-center"
      >

        <div class="text-center">
          <div class="text-h6 text-grey-8">Пусто</div>
        </div>
      </div>

      <QMenu
        v-model="showMenu"
        context-menu
        :offset="[10, 10]"
      >
        <QList style="min-width: 160px">
          <QItem clickable v-close-popup @click="openSelectedFolder">
            <QItemSection avatar>
              <QIcon name="folder_open" />
            </QItemSection>
            <QItemSection>Открыть</QItemSection>
          </QItem>

          <QSeparator />

          <QItem
            v-if="selectedFolder && !selectedFolder.code && !isReadOnly"
            clickable
            v-close-popup
            @click="shareFolderByCode"
          >
            <QItemSection avatar>
              <QIcon name="share" />
            </QItemSection>
            <QItemSection>Поделиться папкой</QItemSection>
          </QItem>

          <QItem
            v-if="selectedFolder && selectedFolder.code"
            clickable
            v-close-popup
            @click="showShareCode()"
          >
            <QItemSection avatar>
              <QIcon name="vpn_key" />
            </QItemSection>
            <QItemSection v-if="!isReadOnly">Показать ссылку доступа</QItemSection>
          </QItem>

          <QItem
            v-if="selectedFolder && selectedFolder.code"
            clickable
            v-close-popup
            @click="stopShareFolder"
          >
            <QItemSection avatar>
              <QIcon name="link_off" />
            </QItemSection>
            <QItemSection v-if="!isReadOnly">Перестать делиться</QItemSection>
          </QItem>

          <QSeparator />


          <!--        TODO в будущем, когда появятся еще другие папки, в которые присоединится-->
  <!--        пользователь по коду, сделать так, чтобы удалять и переименовывать папку мог только владелец-->

          <QItem v-if="!isReadOnly" clickable v-close-popup @click="renameFolder">
            <QItemSection avatar>
              <QIcon name="edit" />
            </QItemSection>
            <QItemSection>Переименовать</QItemSection>
          </QItem>

          <QSeparator />

          <QItem v-if="!isReadOnly" clickable v-close-popup @click="deleteFolder" class="text-negative">
            <QItemSection avatar>
              <QIcon name="delete" color="negative" />
            </QItemSection>
            <QItemSection>Удалить</QItemSection>
          </QItem>
        </QList>
      </QMenu>
    </template>
  </PageLayout>
</template>

<script setup>
import { ref, onMounted, watch, computed } from "vue";
import { API } from '../../index.js'
import { useQuasar } from "quasar";
import PageLayout from "@/layouts/PageLayout.vue";
import { useLoader } from '@/plugins/loader'
import Folder from "@/components/Folder.vue";
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const childFolders = ref([])
const folderData = ref(null);
const accessPath = ref([]);
const $q = useQuasar();

const loader = useLoader()
const showMenu = ref(false)
const selectedFolder = ref(null)

const isReadOnly = computed(() => !!route.query.code)

const breadcrumbs = computed(() => {
  if (accessPath.value?.length) return accessPath.value
  if (folderData.value) return [{ id: folderData.value.id, name: folderData.value.name }]
  return []
})

const createFolder = () => {
  $q.dialog({
    title: 'Создать папку',
    message: 'Введите название папки',
    prompt: {
      model: '',
      type: 'text',
      isValid: (val) => val.length > 0 && val.length <= 50
    },
    cancel: true,
    persistent: true
  }).onOk(async (folderName) => {
    try {
      loader.show('Создание папки')
      await API.createFolder(folderName, folderData.value?.id)
      loader.hide()
      await getData()

      $q.notify({
        message: `Папка "${folderName}" успешно создана`,
        type: 'positive',
        position: 'top-right',
        timeout: 3000,
        icon: 'check'
      })

    } catch (error) {
      console.error('Ошибка при создании папки:', error)
      $q.notify({
        message: 'Ошибка при создании папки',
        type: 'negative',
        position: 'top-right',
        timeout: 4000,
        icon: 'warning'
      })
    }
  })
}

function showContextMenu(folder, event) {
  selectedFolder.value = folder
  showMenu.value = true
}

function openFolder(folder) {
  router.push({
    name: 'Folder',
    params: { id: folder.id },
    query: authStore.accessCode ? { code: authStore.accessCode } : {},
  })
}

function goToFolder(item) {
  router.push({
    name: 'Folder',
    params: { id: item.id },
    query: authStore.accessCode ? { code: authStore.accessCode } : {},
  })
}

function openSelectedFolder() {
  if (!selectedFolder.value) return
  openFolder(selectedFolder.value)
}

function renameFolder() {
  if (!selectedFolder.value) return

  const folder = selectedFolder.value
  $q.dialog({
    title: 'Переименовать папку',
    message: 'Введите новое название папки',
    prompt: {
      model: folder.name,
      type: 'text',
      isValid: (val) => val && val.trim().length > 0 && val.length <= 50
    },
    cancel: true,
    persistent: true
  }).onOk(async (newName) => {
    try {
      loader.show('Переименование папки')
      await API.renameFolder(newName, folder.id)
      loader.hide()
      await getData()

      $q.notify({
        message: `Папка переименована в "${newName}"`,
        type: 'positive',
        position: 'top-right',
        timeout: 3000
      })
    } catch (error) {
      console.error('Ошибка при переименовании:', error)
      $q.notify({
        message: 'Ошибка при переименовании папки',
        type: 'negative',
        position: 'top-right',
        timeout: 4000
      })
    }
  })
}

function deleteFolder() {
  if (!selectedFolder.value) return

  const folder = selectedFolder.value
  $q.dialog({
    title: 'Удалить папку',
    message: `Вы уверены, что хотите удалить папку "${folder.name}"?`,
    cancel: true,
    persistent: true,
    ok: {
      label: 'Удалить',
      color: 'negative'
    }
  }).onOk(async () => {
    try {
      loader.show('Удаление папки')
      await API.deleteFolder(folder.id)
      loader.hide()
      await getData()

      $q.notify({
        message: `Папка "${folder.name}" удалена`,
        type: 'positive',
        position: 'top-right',
        timeout: 3000
      })
    } catch (error) {
      console.error('Ошибка при удалении:', error)
      $q.notify({
        message: 'Ошибка при удалении папки',
        type: 'negative',
        position: 'top-right',
        timeout: 4000
      })
    }
  })
}

async function shareFolderByCode() {
  if (!selectedFolder.value) return;

  const folder = selectedFolder.value;

  try {
    loader.show("Создание кода доступа");
    const { data } = await API.shareFolderByCode(folder.id);
    await getData();
    loader.hide();

    const code = data?.code;

    if (code) {
      const shareLink = `${window.location.origin}/folder/${folder.id}?code=${code}`;
      
      $q.dialog({
        title: "Доступ к папке по ссылке",
        message: "Передайте эту ссылку пользователю, чтобы он мог присоединиться к папке:",
        prompt: {
          model: shareLink,
          type: "text",
          isValid: () => true
        },
        ok: {
          label: "Готово"
        },
        cancel: false,
        persistent: true
      });
    }

    $q.notify({
      message: "Код доступа успешно сгенерирован",
      type: "positive",
      position: "top-right",
      timeout: 3000
    });
  } catch (e) {
    console.error("Ошибка при создании кода доступа:", e);
    loader.hide();
    $q.notify({
      message: e.response?.data?.message || "Не удалось создать код доступа",
      type: "negative",
      position: "top-right",
      timeout: 4000,
      icon: "warning"
    });
  }
}
function showShareCode(codeFromApi) {
  const folder = selectedFolder.value;
  const code = codeFromApi ?? folder?.code;

  if (!folder || !code) return;

  const shareLink = `${window.location.origin}/folder/${folder.id}?code=${code}`;

  $q.dialog({
    title: 'Ссылка доступа к папке',
    message: 'Передайте эту ссылку пользователю:',
    prompt: {
      model: shareLink,
      type: 'text',
      isValid: () => true
    },
    ok: {
      label: 'Закрыть',
      color: 'primary'
    },
    cancel: {
      label: 'Сгенерировать новую',
      flat: true
    },
    persistent: true,
  })
    .onOk(() => {
    })
    .onCancel(() => {
      shareFolderByCode();
    })
}

function stopShareFolder() {
  if (!selectedFolder.value) return;

  const folder = selectedFolder.value;

  $q.dialog({
    title: "Отключить доступ по коду",
    message: `Отключить доступ к папке "${folder.name}" по коду?`,
    persistent: true,
    ok: {
      label: "Отключить",
      color: "primary"
    },
    cancel: {
      label: "Отмена",
      flat: true
    }
  }).onOk(async () => {
    try {
      loader.show("Отключение доступа");
      await API.stopShareFolder(folder.id);
      await getData();
      loader.hide();

      $q.notify({
        message: "Доступ по коду отключён",
        type: "positive",
        position: "top-right",
        timeout: 3000
      });
    } catch (e) {
      console.error("Ошибка при отключении доступа по коду:", e);
      loader.hide();
      $q.notify({
        message: e.response?.data?.message || "Не удалось отключить доступ по коду",
        type: "negative",
        position: "top-right",
        timeout: 4000,
        icon: "warning"
      });
    }
  });
}

async function getData() {
  try {
    loader.show('Загрузка папки...')

    const folderId = route.params.id
    const codeFromUrl = route.query.code

    if (codeFromUrl) {
      authStore.setAccessCode(codeFromUrl)
    } else {
      authStore.clearAccessCode()
    }

  if (folderId) {
    const response = await API.getFolder(folderId, authStore.accessCode)
    folderData.value = response.data.folder
    childFolders.value = response.data.childFolders || []
    accessPath.value = response.data.accessPath || []
  } else {
    const response = await API.getRootFolder()
    folderData.value = response.data.root
    childFolders.value = response.data.content || []
    accessPath.value = []
  }

  } catch (e) {
    $q.notify({
      message: e.response?.data?.message || 'Ошибка загрузки',
      type: 'negative',
      position: 'top-right',
      timeout: 4000,
      icon: 'warning',
      actions: [{ icon: 'close', color: 'white' }]
    });
  } finally {
    loader.hide()
  }
}

onMounted(async () => {
  await getData()
});
watch(
  () => route.params.id,
  () => {
    getData()
  }
)
</script>

<style scoped>
.section {
  margin-bottom: 20px;
}

.empty-state {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.folders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
  padding: 8px 0;
}

</style>
