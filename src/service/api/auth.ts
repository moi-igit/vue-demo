import type { FlatResponseData } from '@sa/axios';
import { request } from '../request';

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

/** 登录并转换 FastAPI 返回的 token */
export async function fetchLogin(userName: string, password: string): Promise<FlatResponseData<Api.Auth.LoginToken>> {
  const result = await request<Api.Auth.FbaLoginToken>({
    url: '/auth/login',
    method: 'post',
    data: {
      username: userName,
      password
    }
  });

  return mapFlatData(result, data => ({
    token: data.access_token,
    refreshToken: data.session_uuid
  }));
}

/** 获取当前登录用户信息 */
export async function fetchGetUserInfo(): Promise<FlatResponseData<Api.Auth.UserInfo>> {
  const result = await request<Api.Auth.FbaUserInfo>({
    url: '/sys/users/me'
  });

  return mapFlatData(result, data => ({
    userId: String(data.id),
    userName: data.username,
    roles: data.is_superuser ? ['R_SUPER', ...(data.roles || [])] : data.roles || [],
    buttons: []
  }));
}

/** 刷新 token */
export async function fetchRefreshToken(refreshToken: string): Promise<FlatResponseData<Api.Auth.LoginToken>> {
  const result = await request<Api.Auth.FbaRefreshToken>({
    url: '/auth/refresh',
    method: 'post'
  });

  return mapFlatData(result, data => ({
    token: data.access_token,
    refreshToken: data.session_uuid || refreshToken
  }));
}

/** 返回自定义后端错误 */
export function fetchCustomBackendError(code: string, msg: string) {
  return request({ url: '/auth/error', params: { code, msg } });
}
