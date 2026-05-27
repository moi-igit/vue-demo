import type { FlatResponseData } from '@sa/axios';
import { request } from '../request';

export type ServerInfo = {
  cpu: {
    physical_num: number;
    logical_num: number;
    max_freq: number;
    min_freq: number;
    current_freq: number;
    usage: number;
  };
  mem: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  sys: {
    name: string;
    os: string;
    ip: string;
    arch: string;
  };
  disk: {
    dir: string;
    device: string;
    type: string;
    total: string;
    used: string;
    free: string;
    usage: string;
  }[];
  service: {
    name: string;
    version: string;
    home: string;
    startup: string;
    elapsed: string;
    cpu_usage: string;
    mem_vms: string;
    mem_rss: string;
    mem_free: string;
  };
};

export type RedisInfo = {
  info: {
    redis_version: string;
    redis_mode: string;
    role: string;
    tcp_port: string;
    uptime: string;
    connected_clients: string;
    blocked_clients: string;
    used_memory_human: string;
    used_memory_rss_human: string;
    maxmemory_human: string;
    mem_fragmentation_ratio: string;
    instantaneous_ops_per_sec: string;
    total_commands_processed: string;
    rejected_connections: string;
    keys_num: string;
  };
  stats: { name: string; value: string }[];
};

export type SessionInfo = {
  id: number;
  session_uuid: string;
  username: string;
  nickname: string;
  ip: string;
  os: string;
  browser: string;
  device: string;
  status: number;
  last_login_time: string;
  expire_time: string;
};

export async function fetchGetServerInfo(): Promise<FlatResponseData<ServerInfo>> {
  return request({ url: '/monitors/server' });
}

export async function fetchGetRedisInfo(): Promise<FlatResponseData<RedisInfo>> {
  return request({ url: '/monitors/redis' });
}

export async function fetchGetSessions(username?: string): Promise<FlatResponseData<SessionInfo[]>> {
  return request({ url: '/monitors/sessions', params: { username } });
}

export function fetchRevokeSession(sessionUuid: string) {
  return request({ url: `/monitors/sessions/${sessionUuid}`, method: 'delete' });
}
