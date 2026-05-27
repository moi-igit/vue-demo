<script setup lang="ts">
import { ref } from 'vue';
import { $t } from '@/locales';
import { useAuthStore } from '@/store/modules/auth';
import { fetchGetUserInfo, fetchUpdateNickname, fetchUpdatePassword } from '@/service/api';
import { useFormRules } from '@/hooks/common/form';

defineOptions({ name: 'UserCenter' });

const authStore = useAuthStore();
const { formRules } = useFormRules();

const loading = ref(false);
const nickname = ref(authStore.userInfo.userName);
const passwordForm = ref({ old: '', newPwd: '', confirm: '' });

async function refreshUserInfo() {
  const { data, error } = await fetchGetUserInfo();
  if (!error && data) {
    Object.assign(authStore.userInfo, data);
    nickname.value = data.userName;
  }
}

async function handleUpdateNickname() {
  if (!nickname.value) return;
  loading.value = true;
  const { error } = await fetchUpdateNickname(nickname.value);
  loading.value = false;
  if (error) return;
  await refreshUserInfo();
  window.$message?.success($t('common.modifySuccess'));
}

async function handleUpdatePassword() {
  if (!passwordForm.value.old || !passwordForm.value.newPwd || !passwordForm.value.confirm) {
    window.$message?.warning($t('common.pleaseCheckValue'));
    return;
  }
  if (passwordForm.value.newPwd !== passwordForm.value.confirm) {
    window.$message?.warning($t('userCenter.passwordNotMatch'));
    return;
  }
  loading.value = true;
  const { error } = await fetchUpdatePassword(
    passwordForm.value.old,
    passwordForm.value.newPwd,
    passwordForm.value.confirm
  );
  loading.value = false;
  if (error) return;
  window.$message?.success($t('common.modifySuccess'));
  passwordForm.value = { old: '', newPwd: '', confirm: '' };
}
</script>

<template>
  <div class="p-24px max-w-600px">
    <ACard :title="$t('userCenter.title')" :bordered="false">
      <ADescriptions :column="1" size="middle" bordered>
        <ADescriptionsItem :label="$t('userCenter.userName')">
          {{ authStore.userInfo.userName }}
        </ADescriptionsItem>
        <ADescriptionsItem :label="$t('userCenter.userId')">
          {{ authStore.userInfo.userId }}
        </ADescriptionsItem>
        <ADescriptionsItem :label="$t('userCenter.roles')">
          <ATag v-for="role in authStore.userInfo.roles" :key="role" color="blue">{{ role }}</ATag>
        </ADescriptionsItem>
      </ADescriptions>

      <ADivider />

      <AForm layout="vertical">
        <AFormItem :label="$t('userCenter.nickname')">
          <AInput v-model:value="nickname" style="max-width:300px" />
          <AButton type="primary" class="ml-8px" :loading="loading" @click="handleUpdateNickname">
            {{ $t('common.modify') }}
          </AButton>
        </AFormItem>
      </AForm>

      <ADivider />

      <AForm layout="vertical" style="max-width:300px">
        <AFormItem :label="$t('userCenter.oldPassword')">
          <AInputPassword v-model:value="passwordForm.old" />
        </AFormItem>
        <AFormItem :label="$t('userCenter.newPassword')">
          <AInputPassword v-model:value="passwordForm.newPwd" />
        </AFormItem>
        <AFormItem :label="$t('userCenter.confirmPassword')">
          <AInputPassword v-model:value="passwordForm.confirm" />
        </AFormItem>
        <AButton type="primary" :loading="loading" @click="handleUpdatePassword">
          {{ $t('userCenter.updatePassword') }}
        </AButton>
      </AForm>
    </ACard>
  </div>
</template>
