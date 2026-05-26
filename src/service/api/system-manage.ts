import type { FlatResponseData } from '@sa/axios';
import { generatedRoutes } from '@/router/elegant/routes';
import { request } from '../request';

type UserUpsertModel = Pick<
  Api.SystemManage.User,
  'userName' | 'nickName' | 'userPhone' | 'userEmail' | 'userRoles' | 'deptId'
> & {
  password?: string;
};

type RoleUpsertModel = Pick<Api.SystemManage.Role, 'roleName' | 'roleDesc' | 'status'>;
/** 将请求成功结果中的 data 做一次类型转换 */
function mapFlatData<T, R>(result: FlatResponseData<T>, mapper: (data: T) => R): FlatResponseData<R> {
  if (result.error) {
    return result as FlatResponseData<R>;
  }

  return {
    ...result,
    data: mapper(result.data)
  };
}

/** 将后端数字状态转换为前端启停状态 */
function toEnableStatus(status?: number | string | null): Api.Common.EnableStatus {
  return Number(status) === 1 ? '1' : '2';
}

/** 将前端启停状态转换为后端数字状态 */
function fromEnableStatus(status?: Api.Common.EnableStatus | number | string) {
  if (status === undefined || status === null || status === '') return undefined;
  return String(status) === '1' ? 1 : 0;
}

/** 将前端分页参数转换为后端分页参数 */
function toPageParams(params?: { current?: number; size?: number }) {
  return {
    page: params?.current || 1,
    size: params?.size || 10
  };
}

/** 将后端分页结构转换为前端表格分页结构 */
function toPageData<T, R>(data: Api.SystemManage.FbaPage<T> | null | undefined, mapper: (item: T) => R) {
  return {
    current: data?.page || 1,
    size: data?.size || 10,
    total: data?.total || 0,
    records: (data?.items || []).map(mapper)
  };
}

/** 将后端角色数据转换为前端角色表格数据 */
function mapRole(item: Api.SystemManage.FbaRole): Api.SystemManage.Role {
  return {
    id: item.id,
    createBy: '',
    createTime: item.created_time || '',
    updateBy: '',
    updateTime: item.updated_time || '',
    status: toEnableStatus(item.status),
    roleName: item.name,
    roleCode: String(item.id),
    roleDesc: item.remark || ''
  };
}

/** 将后端用户数据转换为前端用户表格数据 */
function mapUser(item: Api.SystemManage.FbaUser): Api.SystemManage.User {
  return {
    id: item.id,
    createBy: '',
    createTime: item.created_time || item.join_time || '',
    updateBy: '',
    updateTime: item.updated_time || '',
    status: toEnableStatus(item.status),
    deptId: item.dept_id || 1,
    userName: item.username,
    userGender: '1',
    nickName: item.nickname,
    userPhone: item.phone || '',
    userEmail: item.email || '',
    userRoles: (item.roles || []).map(role => role.id).filter(Boolean)
  };
}

/** 将用户表单数据转换为后端创建参数 */
function toCreateUserPayload(model: UserUpsertModel) {
  return {
    username: model.userName,
    password: model.password || '123456',
    nickname: model.nickName || null,
    email: model.userEmail || null,
    phone: model.userPhone || null,
    dept_id: model.deptId || 1,
    roles: model.userRoles || []
  };
}

/** 将用户表单数据转换为后端更新参数 */
function toUpdateUserPayload(model: UserUpsertModel) {
  return {
    username: model.userName,
    nickname: model.nickName || null,
    email: model.userEmail || null,
    phone: model.userPhone || null,
    dept_id: model.deptId || 1,
    roles: model.userRoles || []
  };
}

/** 将角色表单数据转换为后端保存参数 */
function toRolePayload(model: RoleUpsertModel) {
  return {
    name: model.roleName,
    status: fromEnableStatus(model.status) || 0,
    is_filter_scopes: true,
    remark: model.roleDesc || null
  };
}

/** 将后端菜单类型转换为前端菜单类型 */
function toMenuType(type: number): Api.SystemManage.MenuType {
  return type === 0 ? '1' : '2';
}

/** 将后端菜单数据转换为前端菜单表格数据 */
function mapMenu(item: Api.SystemManage.FbaMenu): Api.SystemManage.Menu {
  return {
    id: item.id,
    createBy: '',
    createTime: item.created_time || '',
    updateBy: '',
    updateTime: item.updated_time || '',
    status: toEnableStatus(item.status),
    parentId: item.parent_id || 0,
    menuType: toMenuType(item.type),
    menuName: item.title,
    routeName: item.name,
    routePath: item.path || '',
    component: item.component || undefined,
    icon: item.icon || '',
    iconType: item.icon ? '1' : '2',
    buttons: item.perms ? [{ code: item.perms, desc: item.title }] : null,
    children: item.children?.map(mapMenu),
    i18nKey: item.title as App.I18n.I18nKey,
    keepAlive: item.cache === 1,
    constant: false,
    order: item.sort,
    href: item.link || undefined,
    hideInMenu: item.display === 0,
    activeMenu: undefined,
    multiTab: true,
    fixedIndexInTab: undefined,
    query: []
  };
}

/** 将树形菜单拍平成列表 */
function flattenMenus(items: Api.SystemManage.Menu[] = []): Api.SystemManage.Menu[] {
  return items.flatMap(item => [item, ...flattenMenus(item.children || [])]);
}
/** 按父级 ID 将菜单列表整理成树形结构 */
function buildMenuTree(items: Api.SystemManage.FbaMenu[]) {
  const itemMap = new Map<number, Api.SystemManage.FbaMenu>();
  const roots: Api.SystemManage.FbaMenu[] = [];

  items.forEach(item => {
    itemMap.set(item.id, {
      ...item,
      children: item.children || []
    });
  });

  itemMap.forEach(item => {
    if (item.parent_id && itemMap.has(item.parent_id)) {
      const parent = itemMap.get(item.parent_id)!;
      parent.children = [...(parent.children || []), item];
    } else {
      roots.push(item);
    }
  });

  return roots;
}

/** 递归收集本地生成路由的名称 */
function routeNames(routes: typeof generatedRoutes): string[] {
  return routes.flatMap(route => [
    String(route.name),
    ...routeNames(((route as any).children || []) as typeof generatedRoutes)
  ]);
}

/** 获取角色分页列表 */
export async function fetchGetRoleList(
  params: Api.SystemManage.RoleSearchParams = {}
): Promise<FlatResponseData<Api.SystemManage.RoleList>> {
  const result = await request<Api.SystemManage.FbaPage<Api.SystemManage.FbaRole>>({
    url: '/sys/roles',
    method: 'get',
    params: {
      ...toPageParams(params),
      name: params?.roleName || params?.roleCode,
      status: fromEnableStatus(params?.status)
    }
  });

  return mapFlatData(result, data => toPageData(data, mapRole));
}

/** 获取全部启用角色 */
export async function fetchGetAllRoles(): Promise<FlatResponseData<Api.SystemManage.AllRole[]>> {
  const result = await request<Api.SystemManage.FbaRole[]>({
    url: '/sys/roles/all',
    method: 'get'
  });

  return mapFlatData(result, data =>
    data
      .filter(item => item.status === 1)
      .map(item => ({
        id: item.id,
        roleName: item.name,
        roleCode: String(item.id)
      }))
  );
}

/** 新增角色 */
export function fetchCreateRole(data: RoleUpsertModel) {
  return request<null>({
    url: '/sys/roles',
    method: 'post',
    data: toRolePayload(data)
  });
}

/** 更新角色 */
export function fetchUpdateRole(id: number, data: RoleUpsertModel) {
  return request<null>({
    url: `/sys/roles/${id}`,
    method: 'put',
    data: toRolePayload(data)
  });
}

/** 删除一个或多个角色 */
export function fetchDeleteRoles(ids: number[]) {
  return request<null>({
    url: '/sys/roles',
    method: 'delete',
    data: {
      pks: ids
    }
  });
}

/** 获取用户分页列表 */
export async function fetchGetUserList(
  params: Api.SystemManage.UserSearchParams = {}
): Promise<FlatResponseData<Api.SystemManage.UserList>> {
  const result = await request<Api.SystemManage.FbaPage<Api.SystemManage.FbaUser>>({
    url: '/sys/users',
    method: 'get',
    params: {
      ...toPageParams(params),
      username: params?.userName,
      phone: params?.userPhone,
      status: fromEnableStatus(params?.status)
    }
  });

  return mapFlatData(result, data => toPageData(data, mapUser));
}

/** 新增用户 */
export async function fetchCreateUser(data: UserUpsertModel): Promise<FlatResponseData<Api.SystemManage.User>> {
  const result = await request<Api.SystemManage.FbaUser>({
    url: '/sys/users',
    method: 'post',
    data: toCreateUserPayload(data)
  });

  return mapFlatData(result, mapUser);
}

/** 更新用户基础信息和角色 */
export function fetchUpdateUser(id: number, data: UserUpsertModel) {
  return request<null>({
    url: `/sys/users/${id}`,
    method: 'put',
    data: toUpdateUserPayload(data)
  });
}

/** 切换用户启用状态 */
export function fetchToggleUserStatus(id: number) {
  return request<null>({
    url: `/sys/users/${id}/permissions`,
    method: 'put',
    params: {
      type: 'status'
    }
  });
}

/** 删除用户 */
export function fetchDeleteUser(id: number) {
  return request<null>({
    url: `/sys/users/${id}`,
    method: 'delete'
  });
}

/** 获取菜单分页列表 */
export async function fetchGetMenuList(): Promise<FlatResponseData<Api.SystemManage.MenuList>> {
  const result = await request<Api.SystemManage.FbaMenu[]>({
    url: '/sys/menus',
    method: 'get'
  });

  return mapFlatData(result, data => {
    const records = buildMenuTree(data).map(mapMenu);

    return {
      current: 1,
      size: records.length || 10,
      total: flattenMenus(records).length,
      records
    };
  });
}

/** 获取前端本地页面路由名称 */
export function fetchGetAllPages() {
  return Promise.resolve({ data: routeNames(generatedRoutes), error: null });
}

/** 获取菜单树 */
export async function fetchGetMenuTree(): Promise<FlatResponseData<Api.SystemManage.MenuTree[]>> {
  const result = await request<Api.SystemManage.FbaMenu[]>({
    url: '/sys/menus',
    method: 'get'
  });

  /** 将后端菜单节点转换为树选择节点 */
  const convert = (item: Api.SystemManage.FbaMenu): Api.SystemManage.MenuTree => ({
    id: item.id,
    label: item.title,
    pId: item.parent_id || 0,
    children: item.children?.map(convert)
  });

  return mapFlatData(result, data => buildMenuTree(data).map(convert));
}
