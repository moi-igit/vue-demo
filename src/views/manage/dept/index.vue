<script setup lang="tsx">
import { ref } from 'vue';
import { Button, Popconfirm, Tag, Tree, TreeSelect } from 'ant-design-vue';
import type { DataNode } from 'ant-design-vue/es/tree';
import { useBoolean } from '@sa/hooks';
import { $t } from '@/locales';
import { enableStatusRecord } from '@/constants/business';
import { fetchGetDeptTree, fetchCreateDept, fetchUpdateDept, fetchDeleteDept } from '@/service/api';
import type { Dept, DeptTree, DeptUpsert } from '@/service/api';

defineOptions({ name: 'ManageDept' });

const { bool: drawVisible, setTrue: openDrawer, setFalse: closeDrawer } = useBoolean();
const loading = ref(false);
const treeData = ref<DeptTree[]>([]);
const selectedRow = ref<Dept | null>(null);
const editingRow = ref<Dept | null>(null);

function toTreeNode(items: DeptTree[]): DataNode[] {
  return items.map(item => ({
    key: item.id,
    title: (
      <span>
        {item.name}
        <Tag class="ml-8px" color={item.status === '1' ? 'success' : 'warning'}>
          {$t(enableStatusRecord[item.status])}
        </Tag>
      </span>
    ),
    children: item.children?.length ? toTreeNode(item.children) : undefined
  }));
}

async function refresh() {
  loading.value = true;
  const { data } = await fetchGetDeptTree();
  treeData.value = data || [];
  loading.value = false;
}

function handleSelect(_keys: (string | number)[], info: any) {
  if (info?.node?.key) {
    selectedRow.value = treeData.value.flatMap(d => flattenDept(d)).find(item => item.id === info.node.key) || null;
  }
}

function flattenDept(item: DeptTree): Dept[] {
  return [item, ...(item.children || []).flatMap(flattenDept)];
}

function handleAdd(parentId?: number | null) {
  editingRow.value = { id: 0, name: '', parentId: parentId ?? null, sort: 0, leader: null, phone: null, email: null, status: '1', createdTime: '' };
  openDrawer();
}

function handleEdit(item: Dept) {
  editingRow.value = { ...item };
  openDrawer();
}

const parentOptions = ref<DataNode[]>([]);

function openDrawerAndBuildTree() {
  const all = treeData.value.flatMap(flattenDept);
  function buildOptions(items: DeptTree[]): DataNode[] {
    return items.map(item => ({
      value: item.id,
      title: item.name,
      children: item.children?.length ? buildOptions(item.children) : undefined
    }));
  }
  parentOptions.value = buildOptions(treeData.value);
  openDrawer();
}

async function handleSubmit(form: DeptUpsert) {
  const id = (editingRow.value?.id || 0);
  if (id > 0) {
    const { error } = await fetchUpdateDept(id, form);
    if (error) return;
  } else {
    const { error } = await fetchCreateDept(form);
    if (error) return;
  }
  closeDrawer();
  await refresh();
  window.$message?.success(id > 0 ? $t('common.updateSuccess') : $t('common.addSuccess'));
}

async function handleDelete(id: number) {
  const { error } = await fetchDeleteDept(id);
  if (error) return;
  selectedRow.value = null;
  await refresh();
  window.$message?.success($t('common.deleteSuccess'));
}

const formData = ref<DeptUpsert>({ name: '', parentId: null, sort: 0, leader: null, phone: null, email: null, status: 1 });

function openEditDrawer(item: Dept) {
  editingRow.value = item;
  formData.value = {
    name: item.name,
    parentId: item.parentId,
    sort: item.sort,
    leader: item.leader,
    phone: item.phone,
    email: item.email,
    status: item.status === '1' ? 1 : 0
  };
  openDrawerAndBuildTree();
}

function openAddDrawer(parentId?: number | null) {
  editingRow.value = null;
  formData.value = { name: '', parentId: parentId ?? null, sort: 0, leader: null, phone: null, email: null, status: 1 };
  openDrawerAndBuildTree();
}

refresh();
</script>

<template>
  <div class="min-h-500px flex gap-16px lt-sm:flex-col">
    <ACard :title="$t('page.manage.dept.title')" :bordered="false" class="w-300px flex-shrink-0 lt-sm:w-full">
      <template #extra>
        <Button type="primary" size="small" @click="openAddDrawer(null)">{{ $t('common.add') }}</Button>
      </template>
      <ASpin :spinning="loading">
        <Tree
          v-if="treeData.length"
          :tree-data="toTreeNode(treeData)"
          :selected-keys="selectedRow ? [selectedRow.id] : []"
          block-node
          @select="handleSelect"
        />
        <AEmpty v-else />
      </ASpin>
    </ACard>
    <ACard :title="$t('page.manage.dept.deptDetail')" :bordered="false" class="flex-1">
      <template v-if="selectedRow">
        <ADescriptions :column="2" bordered size="small">
          <ADescriptionsItem :label="$t('page.manage.dept.name')">{{ selectedRow.name }}</ADescriptionsItem>
          <ADescriptionsItem :label="$t('page.manage.dept.sort')">{{ selectedRow.sort }}</ADescriptionsItem>
          <ADescriptionsItem :label="$t('page.manage.dept.leader')">{{ selectedRow.leader || '-' }}</ADescriptionsItem>
          <ADescriptionsItem :label="$t('page.manage.dept.phone')">{{ selectedRow.phone || '-' }}</ADescriptionsItem>
          <ADescriptionsItem :label="$t('page.manage.dept.email')">{{ selectedRow.email || '-' }}</ADescriptionsItem>
          <ADescriptionsItem :label="$t('page.manage.dept.status')">
            <Tag :color="selectedRow.status === '1' ? 'success' : 'warning'">
              {{ $t(enableStatusRecord[selectedRow.status]) }}
            </Tag>
          </ADescriptionsItem>
        </ADescriptions>
        <div class="mt-16px flex gap-8px">
          <Button type="primary" size="small" @click="openEditDrawer(selectedRow)">{{ $t('common.edit') }}</Button>
          <Button size="small" @click="openAddDrawer(selectedRow.id)">{{ $t('page.manage.dept.addChild') }}</Button>
          <Popconfirm :title="$t('common.confirmDelete')" @confirm="handleDelete(selectedRow.id)">
            <Button danger size="small">{{ $t('common.delete') }}</Button>
          </Popconfirm>
        </div>
      </template>
      <AEmpty v-else :description="$t('page.manage.dept.selectTip')" />
    </ACard>

    <AModal
      :open="drawVisible"
      :title="editingRow?.id ? $t('page.manage.dept.editDept') : $t('page.manage.dept.addDept')"
      @cancel="closeDrawer"
      @ok="handleSubmit(formData)"
    >
      <AForm :model="formData" layout="vertical">
        <AFormItem :label="$t('page.manage.dept.parentDept')">
          <TreeSelect
            v-model:value="formData.parentId"
            :tree-data="parentOptions"
            :placeholder="$t('page.manage.dept.parentDeptPlaceholder')"
            allow-clear
            style="width:100%"
          />
        </AFormItem>
        <AFormItem :label="$t('page.manage.dept.name')" required>
          <AInput v-model:value="formData.name" />
        </AFormItem>
        <AFormItem :label="$t('page.manage.dept.sort')">
          <AInputNumber v-model:value="formData.sort" :min="0" style="width:100%" />
        </AFormItem>
        <AFormItem :label="$t('page.manage.dept.leader')">
          <AInput v-model:value="formData.leader" />
        </AFormItem>
        <AFormItem :label="$t('page.manage.dept.phone')">
          <AInput v-model:value="formData.phone" />
        </AFormItem>
        <AFormItem :label="$t('page.manage.dept.email')">
          <AInput v-model:value="formData.email" />
        </AFormItem>
        <AFormItem :label="$t('page.manage.dept.status')">
          <ASelect v-model:value="formData.status" style="width:100%">
            <ASelectOption :value="1">{{ $t('page.manage.common.status.enable') }}</ASelectOption>
            <ASelectOption :value="0">{{ $t('page.manage.common.status.disable') }}</ASelectOption>
          </ASelect>
        </AFormItem>
      </AForm>
    </AModal>
  </div>
</template>
