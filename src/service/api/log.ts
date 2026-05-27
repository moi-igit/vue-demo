import type { FlatResponseData } from '@sa/axios';
import { request } from '../request';
import { toPageParams } from './_shared';

export type FbaPage<T> = {
  items: T[];
  total: number;
  page: number;
  size: number;
};

export type LoginLog = {
  id: number;
  user_uuid: string;
  username: string;
  status: number;
  ip: string;
  country: string | null;
  region: string | null;
  city: string | null;
  user_agent: string | null;
  browser: string | null;
  os: string | null;
  device: string | null;
  msg: string;
  login_time: string;
  created_time: string;
};

export type OperaLog = {
  id: number;
  trace_id: string;
  username: string | null;
  method: string;
  title: string;
  path: string;
  ip: string;
  country: string | null;
  region: string | null;
  city: string | null;
  user_agent: string | null;
  os: string | null;
  browser: string | null;
  device: string | null;
  status: number;
  code: string;
  msg: string | null;
  cost_time: number;
  opera_time: string;
  created_time: string;
};

export type PageData<T> = {
  current: number;
  size: number;
  total: number;
  records: T[];
};

function toPageData<T>(data: FbaPage<T> | null | undefined) {
  return {
    current: data?.page || 1,
    size: data?.size || 10,
    total: data?.total || 0,
    records: data?.items || []
  };
}

export async function fetchGetLoginLogs(
  params: { current?: number; size?: number; username?: string; status?: number } = {}
): Promise<FlatResponseData<PageData<LoginLog>>> {
  const result = await request<FbaPage<LoginLog>>({
    url: '/logs/login',
    params: { ...toPageParams(params), username: params.username, status: params.status }
  });

  if (result.error) return result as FlatResponseData<PageData<LoginLog>>;

  return {
    ...result,
    data: toPageData(result.data)
  };
}

export function fetchDeleteLoginLogs(pks: number[]) {
  return request({ url: '/logs/login', method: 'delete', data: { pks } });
}

export function fetchClearLoginLogs() {
  return request({ url: '/logs/login/all', method: 'delete' });
}

export async function fetchGetOperaLogs(
  params: { current?: number; size?: number; username?: string; status?: number } = {}
): Promise<FlatResponseData<PageData<OperaLog>>> {
  const result = await request<FbaPage<OperaLog>>({
    url: '/logs/opera',
    params: { ...toPageParams(params), username: params.username, status: params.status }
  });

  if (result.error) return result as FlatResponseData<PageData<OperaLog>>;

  return {
    ...result,
    data: toPageData(result.data)
  };
}

export function fetchDeleteOperaLogs(pks: number[]) {
  return request({ url: '/logs/opera', method: 'delete', data: { pks } });
}

export function fetchClearOperaLogs() {
  return request({ url: '/logs/opera/all', method: 'delete' });
}
