export function toEnableStatus(status?: number | string | null): Api.Common.EnableStatus {
  return Number(status) === 1 ? '1' : '2';
}

export function fromEnableStatus(status?: Api.Common.EnableStatus | number | string) {
  if (status === undefined || status === null || status === '') return undefined;
  return String(status) === '1' ? 1 : 0;
}

export function toPageParams(params?: { current?: number; size?: number }) {
  return {
    page: params?.current || 1,
    size: params?.size || 10
  };
}
