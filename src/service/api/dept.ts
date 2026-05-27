import type { FlatResponseData } from '@sa/axios';
import { request } from '../request';
import { toPageParams, toEnableStatus } from './_shared';

export { toPageParams, toEnableStatus };

export type FbaDept = {
  id: number;
  name: string;
  parent_id: number | null;
  sort: number;
  leader: string | null;
  phone: string | null;
  email: string | null;
  status: number;
  del_flag: boolean;
  created_time: string;
  updated_time: string | null;
  children?: FbaDept[];
};

export type Dept = {
  id: number;
  name: string;
  parentId: number | null;
  sort: number;
  leader: string | null;
  phone: string | null;
  email: string | null;
  status: Api.Common.EnableStatus;
  createdTime: string;
  children?: Dept[];
};

function mapDept(item: FbaDept): Dept {
  return {
    id: item.id,
    name: item.name,
    parentId: item.parent_id,
    sort: item.sort,
    leader: item.leader,
    phone: item.phone,
    email: item.email,
    status: toEnableStatus(item.status),
    createdTime: item.created_time,
    children: item.children?.map(mapDept)
  };
}

export type DeptTree = Dept;

export type DeptUpsert = {
  name: string;
  parentId: number | null;
  sort: number;
  leader: string | null;
  phone: string | null;
  email: string | null;
  status: number;
};

function toDeptPayload(data: DeptUpsert) {
  return {
    name: data.name,
    parent_id: data.parentId,
    sort: data.sort,
    leader: data.leader,
    phone: data.phone,
    email: data.email,
    status: data.status
  };
}

export async function fetchGetDeptTree(): Promise<FlatResponseData<DeptTree[]>> {
  const result = await request<FbaDept[]>({ url: '/sys/depts' });

  if (result.error) return result as FlatResponseData<DeptTree[]>;

  return {
    ...result,
    data: (result.data || []).map(mapDept)
  };
}

export function fetchCreateDept(data: DeptUpsert) {
  return request({ url: '/sys/depts', method: 'post', data: toDeptPayload(data) });
}

export function fetchUpdateDept(id: number, data: DeptUpsert) {
  return request({ url: `/sys/depts/${id}`, method: 'put', data: toDeptPayload(data) });
}

export function fetchDeleteDept(id: number) {
  return request({ url: `/sys/depts/${id}`, method: 'delete' });
}
