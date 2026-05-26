<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useAntdForm, useFormRules } from '@/hooks/common/form';
import { fetchCreateUser, fetchGetAllRoles, fetchToggleUserStatus, fetchUpdateUser } from '@/service/api';
import { $t } from '@/locales';
import { enableStatusOptions, userGenderOptions } from '@/constants/business';

defineOptions({
  name: 'UserOperateDrawer'
});

interface Props {
  /** the type of operation */
  operateType: AntDesign.TableOperateType;
  /** the edit row data */
  rowData?: Api.SystemManage.User | null;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const visible = defineModel<boolean>('visible', {
  default: false
});

const { formRef, validate, resetFields } = useAntdForm();
const { defaultRequiredRule, patternRules } = useFormRules();

const title = computed(() => {
  const titles: Record<AntDesign.TableOperateType, string> = {
    add: $t('page.manage.user.addUser'),
    edit: $t('page.manage.user.editUser')
  };
  return titles[props.operateType];
});

type Model = Pick<
  Api.SystemManage.User,
  'userName' | 'userGender' | 'nickName' | 'userPhone' | 'userEmail' | 'userRoles' | 'status' | 'deptId'
> & {
  password?: string;
};

const model = ref(createDefaultModel());

/** 创建用户表单默认数据 */
function createDefaultModel(): Model {
  return {
    userName: '',
    password: '123456',
    userGender: '1',
    nickName: '',
    userPhone: '',
    userEmail: '',
    userRoles: [],
    deptId: 1,
    status: '1'
  };
}

type RuleKey = Extract<keyof Model, 'userName' | 'password' | 'status' | 'deptId' | 'userRoles' | 'userPhone' | 'userEmail'>;

const rules = computed<Record<RuleKey, App.Global.FormRule | App.Global.FormRule[]>>(() => ({
  userName: defaultRequiredRule,
  password: props.operateType === 'add' ? defaultRequiredRule : {},
  status: defaultRequiredRule,
  deptId: defaultRequiredRule,
  userRoles: defaultRequiredRule,
  userPhone: patternRules.phone,
  userEmail: patternRules.email
}));

/** the enabled role options */
const roleOptions = ref<CommonType.Option<number>[]>([]);

/** 加载角色下拉选项 */
async function getRoleOptions() {
  const { error, data } = await fetchGetAllRoles();

  if (!error) {
    roleOptions.value = data.map(item => ({
      label: item.roleName,
      value: item.id
    }));
  }
}

/** 初始化抽屉表单数据 */
function handleInitModel() {
  model.value = createDefaultModel();

  if (props.operateType === 'edit' && props.rowData) {
    Object.assign(model.value, props.rowData);
    model.value.password = undefined;
  }
}

/** 关闭用户操作抽屉 */
function closeDrawer() {
  visible.value = false;
}

/** 提交新增或编辑用户 */
async function handleSubmit() {
  await validate();

  if (props.operateType === 'add') {
    const { error } = await fetchCreateUser(model.value);
    if (error) return;
  } else if (props.rowData) {
    const { error } = await fetchUpdateUser(props.rowData.id, model.value);
    if (error) return;

    if (props.rowData.status !== model.value.status) {
      const { error: statusError } = await fetchToggleUserStatus(props.rowData.id);
      if (statusError) return;
    }
  }

  window.$message?.success($t('common.updateSuccess'));
  closeDrawer();
  emit('submitted');
}

watch(visible, () => {
  if (visible.value) {
    handleInitModel();
    resetFields();
    getRoleOptions();
  }
});
</script>

<template>
  <ADrawer v-model:open="visible" :title="title" :width="360">
    <AForm ref="formRef" layout="vertical" :model="model" :rules="rules">
      <AFormItem :label="$t('page.manage.user.userName')" name="userName">
        <AInput v-model:value="model.userName" :placeholder="$t('page.manage.user.form.userName')" />
      </AFormItem>
      <AFormItem v-if="operateType === 'add'" :label="$t('page.manage.user.password')" name="password">
        <AInputPassword v-model:value="model.password" :placeholder="$t('page.manage.user.form.password')" />
      </AFormItem>
      <AFormItem :label="$t('page.manage.user.deptId')" name="deptId">
        <AInputNumber v-model:value="model.deptId" :min="1" class="w-full" :placeholder="$t('page.manage.user.form.deptId')" />
      </AFormItem>
      <AFormItem :label="$t('page.manage.user.userGender')" name="userGender">
        <ARadioGroup v-model:value="model.userGender">
          <ARadio v-for="item in userGenderOptions" :key="item.value" :value="item.value">
            {{ $t(item.label) }}
          </ARadio>
        </ARadioGroup>
      </AFormItem>
      <AFormItem :label="$t('page.manage.user.nickName')" name="nickName">
        <AInput v-model:value="model.nickName" :placeholder="$t('page.manage.user.form.nickName')" />
      </AFormItem>
      <AFormItem :label="$t('page.manage.user.userPhone')" name="userPhone">
        <AInput v-model:value="model.userPhone" :placeholder="$t('page.manage.user.form.userPhone')" />
      </AFormItem>
      <AFormItem :label="$t('page.manage.user.userEmail')" name="userEmail">
        <AInput v-model:value="model.userEmail" :placeholder="$t('page.manage.user.form.userEmail')" />
      </AFormItem>
      <AFormItem :label="$t('page.manage.user.userStatus')" name="status">
        <ARadioGroup v-model:value="model.status">
          <ARadio v-for="item in enableStatusOptions" :key="item.value" :value="item.value">
            {{ $t(item.label) }}
          </ARadio>
        </ARadioGroup>
      </AFormItem>
      <AFormItem :label="$t('page.manage.user.userRole')" name="userRoles">
        <ASelect
          v-model:value="model.userRoles"
          mode="multiple"
          :options="roleOptions"
          :placeholder="$t('page.manage.user.form.userRole')"
        />
      </AFormItem>
    </AForm>
    <template #footer>
      <ASpace :size="16">
        <AButton @click="closeDrawer">{{ $t('common.cancel') }}</AButton>
        <AButton type="primary" @click="handleSubmit">{{ $t('common.confirm') }}</AButton>
      </ASpace>
    </template>
  </ADrawer>
</template>

<style scoped></style>
