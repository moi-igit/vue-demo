<script setup lang="tsx">
import { ref } from 'vue';
import { Button, Popconfirm, Tabs, Tag } from 'ant-design-vue';
import { $t } from '@/locales';
import { useTable, useTableScroll } from '@/hooks/common/table';
import { fetchGetLoginLogs, fetchDeleteLoginLogs, fetchClearLoginLogs, fetchGetOperaLogs, fetchDeleteOperaLogs, fetchClearOperaLogs } from '@/service/api';
import type { LoginLog, OperaLog } from '@/service/api';

defineOptions({ name: 'ManageLog' });

const activeKey = ref('login');

// 登录日志
const { tableWrapperRef: loginWrapper, scrollConfig: loginScroll } = useTableScroll();
const {
  columns: loginColumns,
  data: loginData,
  loading: loginLoading,
  getData: getLoginData,
  getDataByPage: getLoginByPage,
  searchParams: loginSearch,
  resetSearchParams: resetLoginSearch
} = useTable({
  apiFn: fetchGetLoginLogs,
  apiParams: { current: 1, size: 10 },
  columns: () => [
    { key: 'index', title: $t('common.index'), width: 60, align: 'center' },
    { key: 'username', title: $t('page.manage.log.username'), dataIndex: 'username', width: 100 },
    { key: 'ip', title: $t('page.manage.log.ip'), dataIndex: 'ip', width: 130 },
    { key: 'browser', title: $t('page.manage.log.browser'), dataIndex: 'browser', width: 100 },
    { key: 'os', title: $t('page.manage.log.os'), dataIndex: 'os', width: 100 },
    {
      key: 'status', title: $t('page.manage.log.status'), dataIndex: 'status', width: 80, align: 'center',
      customRender: ({ record }: { record: LoginLog }) => (
        <Tag color={record.status === 1 ? 'success' : 'error'}>{record.status === 1 ? $t('page.manage.log.success') : $t('page.manage.log.fail')}</Tag>
      )
    },
    { key: 'msg', title: $t('page.manage.log.msg'), dataIndex: 'msg', minWidth: 120, ellipsis: true },
    { key: 'login_time', title: $t('page.manage.log.loginTime'), dataIndex: 'login_time', width: 170 }
  ]
});

const selectedLoginKeys = ref<number[]>([]);

async function deleteLoginLogs() {
  if (!selectedLoginKeys.value.length) return;
  const { error } = await fetchDeleteLoginLogs(selectedLoginKeys.value);
  if (error) return;
  window.$message?.success($t('common.deleteSuccess'));
  selectedLoginKeys.value = [];
  getLoginData();
}

async function clearAllLoginLogs() {
  const { error } = await fetchClearLoginLogs();
  if (error) return;
  window.$message?.success($t('common.deleteSuccess'));
  getLoginData();
}

// 操作日志
const { tableWrapperRef: operaWrapper, scrollConfig: operaScroll } = useTableScroll();
const {
  columns: operaColumns,
  data: operaData,
  loading: operaLloading,
  getData: getOperaData,
  getDataByPage: getOperaByPage,
  searchParams: operaSearch,
  resetSearchParams: resetOperaSearch
} = useTable({
  apiFn: fetchGetOperaLogs,
  apiParams: { current: 1, size: 10 },
  columns: () => [
    { key: 'index', title: $t('common.index'), width: 60, align: 'center' },
    { key: 'username', title: $t('page.manage.log.username'), dataIndex: 'username', width: 100 },
    { key: 'title', title: $t('page.manage.log.operaTitle'), dataIndex: 'title', width: 140 },
    { key: 'method', title: $t('page.manage.log.method'), dataIndex: 'method', width: 70, align: 'center' },
    { key: 'path', title: $t('page.manage.log.path'), dataIndex: 'path', minWidth: 160, ellipsis: true },
    { key: 'ip', title: $t('page.manage.log.ip'), dataIndex: 'ip', width: 130 },
    {
      key: 'status', title: $t('page.manage.log.status'), dataIndex: 'status', width: 80, align: 'center',
      customRender: ({ record }: { record: OperaLog }) => (
        <Tag color={record.status === 1 ? 'success' : 'error'}>{record.status === 1 ? $t('page.manage.log.success') : $t('page.manage.log.fail')}</Tag>
      )
    },
    { key: 'cost_time', title: $t('page.manage.log.costTime'), dataIndex: 'cost_time', width: 80 },
    { key: 'opera_time', title: $t('page.manage.log.operaTime'), dataIndex: 'opera_time', width: 170 }
  ]
});

const selectedOperaKeys = ref<number[]>([]);

async function deleteOperaLogs() {
  if (!selectedOperaKeys.value.length) return;
  const { error } = await fetchDeleteOperaLogs(selectedOperaKeys.value);
  if (error) return;
  window.$message?.success($t('common.deleteSuccess'));
  selectedOperaKeys.value = [];
  getOperaData();
}

async function clearAllOperaLogs() {
  const { error } = await fetchClearOperaLogs();
  if (error) return;
  window.$message?.success($t('common.deleteSuccess'));
  getOperaData();
}
</script>

<template>
  <ACard :title="$t('page.manage.log.title')" :bordered="false">
    <ATabs v-model:activeKey="activeKey">
      <ATabPane key="login" :tab="$t('page.manage.log.loginLog')">
        <div class="mb-16px flex gap-8px">
          <Button danger size="small" :disabled="!selectedLoginKeys.length" @click="deleteLoginLogs">
            {{ $t('common.batchDelete') }}
          </Button>
          <Popconfirm :title="$t('page.manage.log.clearConfirm')" @confirm="clearAllLoginLogs">
            <Button danger size="small">{{ $t('page.manage.log.clearAll') }}</Button>
          </Popconfirm>
          <Button size="small" @click="getLoginData">{{ $t('common.refresh') }}</Button>
        </div>
        <ATable
          ref="loginWrapper"
          :columns="loginColumns"
          :data-source="loginData"
          :loading="loginLoading"
          :row-selection="{ selectedRowKeys: selectedLoginKeys, onChange: (keys: (string | number)[]) => selectedLoginKeys = keys.map(Number) }"
          row-key="id"
          size="small"
          :scroll="loginScroll"
          :pagination="false"
        />
      </ATabPane>

      <ATabPane key="opera" :tab="$t('page.manage.log.operaLog')">
        <div class="mb-16px flex gap-8px">
          <Button danger size="small" :disabled="!selectedOperaKeys.length" @click="deleteOperaLogs">
            {{ $t('common.batchDelete') }}
          </Button>
          <Popconfirm :title="$t('page.manage.log.clearConfirm')" @confirm="clearAllOperaLogs">
            <Button danger size="small">{{ $t('page.manage.log.clearAll') }}</Button>
          </Popconfirm>
          <Button size="small" @click="getOperaData">{{ $t('common.refresh') }}</Button>
        </div>
        <ATable
          ref="operaWrapper"
          :columns="operaColumns"
          :data-source="operaData"
          :loading="operaLloading"
          :row-selection="{ selectedRowKeys: selectedOperaKeys, onChange: (keys: (string | number)[]) => selectedOperaKeys = keys.map(Number) }"
          row-key="id"
          size="small"
          :scroll="operaScroll"
          :pagination="false"
        />
      </ATabPane>
    </ATabs>
  </ACard>
</template>
