<script setup lang="tsx">
import { ref } from 'vue';
import { Button, Descriptions, Popconfirm, Tag, Tabs } from 'ant-design-vue';
import { $t } from '@/locales';
import { fetchGetServerInfo, fetchGetRedisInfo, fetchGetSessions, fetchRevokeSession } from '@/service/api';
import type { ServerInfo, RedisInfo, SessionInfo } from '@/service/api';

defineOptions({ name: 'ManageMonitor' });

const activeKey = ref('server');
const loading = ref(false);

const serverInfo = ref<ServerInfo | null>(null);
const redisInfo = ref<RedisInfo | null>(null);
const sessions = ref<SessionInfo[]>([]);

async function loadServer() {
  loading.value = true;
  const { data } = await fetchGetServerInfo();
  serverInfo.value = data || null;
  loading.value = false;
}

async function loadRedis() {
  loading.value = true;
  const { data } = await fetchGetRedisInfo();
  redisInfo.value = data || null;
  loading.value = false;
}

async function loadSessions() {
  loading.value = true;
  const { data } = await fetchGetSessions();
  sessions.value = data || [];
  loading.value = false;
}

async function handleRevoke(sessionUuid: string) {
  const { error } = await fetchRevokeSession(sessionUuid);
  if (error) return;
  window.$message?.success($t('common.deleteSuccess'));
  await loadSessions();
}

function onTabChange(key: string) {
  activeKey.value = key;
  if (key === 'server' && !serverInfo.value) loadServer();
  if (key === 'redis' && !redisInfo.value) loadRedis();
  if (key === 'sessions' && !sessions.value.length) loadSessions();
}

loadServer();
</script>

<template>
  <ACard :title="$t('page.manage.monitor.title')" :bordered="false">
    <ATabs v-model:activeKey="activeKey" @change="onTabChange">
      <ATabPane key="server" :tab="$t('page.manage.monitor.server')">
        <ASpin :spinning="loading && activeKey === 'server'">
          <template v-if="serverInfo">
            <ACard size="small" :title="$t('page.manage.monitor.cpu')" class="mb-16px">
              <ADescriptions size="small" :column="3" bordered>
                <ADescriptionsItem :label="$t('page.manage.monitor.cpuPhysical')">{{ serverInfo.cpu.physical_num }}</ADescriptionsItem>
                <ADescriptionsItem :label="$t('page.manage.monitor.cpuLogical')">{{ serverInfo.cpu.logical_num }}</ADescriptionsItem>
                <ADescriptionsItem :label="$t('page.manage.monitor.cpuUsage')">
                  <AProgress :percent="serverInfo.cpu.usage" :size="20" />
                </ADescriptionsItem>
              </ADescriptions>
            </ACard>
            <ACard size="small" :title="$t('page.manage.monitor.memory')" class="mb-16px">
              <ADescriptions size="small" :column="3" bordered>
                <ADescriptionsItem :label="$t('page.manage.monitor.memTotal')">{{ serverInfo.mem.total }} GB</ADescriptionsItem>
                <ADescriptionsItem :label="$t('page.manage.monitor.memUsed')">{{ serverInfo.mem.used }} GB</ADescriptionsItem>
                <ADescriptionsItem :label="$t('page.manage.monitor.memUsage')">
                  <AProgress :percent="serverInfo.mem.usage" :size="20" />
                </ADescriptionsItem>
              </ADescriptions>
            </ACard>
            <ACard size="small" :title="$t('page.manage.monitor.sysInfo')" class="mb-16px">
              <ADescriptions size="small" :column="2" bordered>
                <ADescriptionsItem :label="$t('page.manage.monitor.sysHostname')">{{ serverInfo.sys.name }}</ADescriptionsItem>
                <ADescriptionsItem :label="$t('page.manage.monitor.sysOs')">{{ serverInfo.sys.os }}</ADescriptionsItem>
                <ADescriptionsItem :label="$t('page.manage.monitor.sysIp')">{{ serverInfo.sys.ip }}</ADescriptionsItem>
                <ADescriptionsItem :label="$t('page.manage.monitor.sysArch')">{{ serverInfo.sys.arch }}</ADescriptionsItem>
              </ADescriptions>
            </ACard>
            <ACard size="small" :title="$t('page.manage.monitor.service')">
              <ADescriptions size="small" :column="2" bordered>
                <ADescriptionsItem :label="$t('page.manage.monitor.svcName')">{{ serverInfo.service.name }}</ADescriptionsItem>
                <ADescriptionsItem :label="$t('page.manage.monitor.svcVersion')">{{ serverInfo.service.version }}</ADescriptionsItem>
                <ADescriptionsItem :label="$t('page.manage.monitor.svcElapsed')">{{ serverInfo.service.elapsed }}</ADescriptionsItem>
              </ADescriptions>
            </ACard>
          </template>
          <AEmpty v-else-if="!loading" />
        </ASpin>
      </ATabPane>

      <ATabPane key="redis" :tab="$t('page.manage.monitor.redis')">
        <ASpin :spinning="loading && activeKey === 'redis'">
          <template v-if="redisInfo">
            <ADescriptions size="small" :column="2" bordered>
              <ADescriptionsItem :label="$t('page.manage.monitor.redisVersion')">{{ redisInfo.info.redis_version }}</ADescriptionsItem>
              <ADescriptionsItem :label="$t('page.manage.monitor.redisMode')">{{ redisInfo.info.redis_mode }}</ADescriptionsItem>
              <ADescriptionsItem :label="$t('page.manage.monitor.redisPort')">{{ redisInfo.info.tcp_port }}</ADescriptionsItem>
              <ADescriptionsItem :label="$t('page.manage.monitor.redisClients')">{{ redisInfo.info.connected_clients }}</ADescriptionsItem>
              <ADescriptionsItem :label="$t('page.manage.monitor.redisMemory')">{{ redisInfo.info.used_memory_human }}</ADescriptionsItem>
              <ADescriptionsItem :label="$t('page.manage.monitor.redisMaxMemory')">{{ redisInfo.info.maxmemory_human }}</ADescriptionsItem>
              <ADescriptionsItem :label="$t('page.manage.monitor.redisKeys')">{{ redisInfo.info.keys_num }}</ADescriptionsItem>
              <ADescriptionsItem :label="$t('page.manage.monitor.redisOps')">{{ redisInfo.info.instantaneous_ops_per_sec }}</ADescriptionsItem>
            </ADescriptions>
          </template>
          <AEmpty v-else-if="!loading" />
        </ASpin>
      </ATabPane>

      <ATabPane key="sessions" :tab="$t('page.manage.monitor.sessions')">
        <ASpin :spinning="loading && activeKey === 'sessions'">
          <ATable row-key="session_uuid" :data-source="sessions" :pagination="false" size="small">
            <ATableColumn key="username" :title="$t('page.manage.monitor.sessUsername')" data-index="username" />
            <ATableColumn key="nickname" :title="$t('page.manage.monitor.sessNickname')" data-index="nickname" />
            <ATableColumn key="ip" :title="$t('page.manage.monitor.sessIp')" data-index="ip" />
            <ATableColumn key="browser" :title="$t('page.manage.monitor.sessBrowser')" data-index="browser" />
            <ATableColumn key="os" :title="$t('page.manage.monitor.sessOs')" data-index="os" />
            <ATableColumn key="status" :title="$t('page.manage.monitor.sessStatus')" data-index="status">
              <template #default="{ record }: { record: SessionInfo }">
                <Tag :color="record.status === 1 ? 'success' : 'default'">
                  {{ record.status === 1 ? $t('page.manage.monitor.sessOnline') : $t('page.manage.monitor.sessOffline') }}
                </Tag>
              </template>
            </ATableColumn>
            <ATableColumn key="action" :title="$t('common.operate')">
              <template #default="{ record }: { record: SessionInfo }">
                <Popconfirm :title="$t('page.manage.monitor.revokeConfirm')" @confirm="handleRevoke(record.session_uuid)">
                  <Button danger size="small">{{ $t('page.manage.monitor.revoke') }}</Button>
                </Popconfirm>
              </template>
            </ATableColumn>
          </ATable>
        </ASpin>
      </ATabPane>
    </ATabs>
  </ACard>
</template>
