<template>
    <div>
        <!--首页 -->
        <div class="mb-4">
            <el-button
                type="primary"
                @click="
                    dialogVisible = true;
                    resetForm(ruleFormRef);
                "
                >新增</el-button
            >
        </div>
        <!-- 生成一个菜单树表格 -->
        <el-table :data="treeData" style="width: 100%; margin-bottom: 20px" row-key="id" border default-expand-all>
            <el-table-column prop="name" label="菜单名" />
            <el-table-column prop="url" label="菜单名地址" />
            <el-table-column prop="id" label="id" />
            <el-table-column label="操作" width="140" align="left">
                <template #default="scope">
                    <el-button v-if="scope.row.id" type="text" size="small" @click="handleDelete(scope.row.id)">删除</el-button>
                    <el-button v-if="scope.row.id" type="text" size="small" @click="handleEdit(scope.row)">修改</el-button>
                </template>
            </el-table-column>
        </el-table>

        <el-dialog v-model="dialogVisible" :title="form.id ? '修改菜单' : '新增菜单'" width="500" :before-close="handleClose">
            <el-form :model="form" :label-width="formLabelWidth" :rules="rules" ref="ruleFormRef">
                <el-form-item label="菜单名称" prop="name">
                    <el-input v-model="form.name" autocomplete="off" />
                </el-form-item>
                <el-form-item label="上级菜单" prop="parent_id">
                    <el-tree-select
                        @change="val => handleUnitChange(val)"
                        v-model="form.parent_id"
                        node-key="id"
                        :data="treeData"
                        :props="treeProps"
                        check-strictly
                        :render-after-expand="false"
                        placeholder="请选择上级菜单"
                    />
                </el-form-item>
                <el-form-item label="菜单地址" prop="url">
                    <el-input v-model="form.url" autocomplete="off" />
                </el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="dialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="onSubmit(ruleFormRef)"> 确定 </el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue';
import useUserInfoStore from '@/stortes/user'; //引入仓库
import { storeToRefs } from 'pinia'; //引入pinia转换
const { proxy } = getCurrentInstance();
const dialogVisible = ref(false);
const userInfoStore = useUserInfoStore();

const { userInfo } = storeToRefs(userInfoStore); // 响应式
const formLabelWidth = '100px';
const ruleFormRef = ref();
const treeProps = {
    children: 'children',
    label: 'name',
};
const rules = {
    name: [{ required: true, message: '请输入菜单名字', trigger: 'blur' }],
    parent_id: [{ required: false, message: '请选择上级菜单', trigger: 'change' }],
    url: [{ required: false, message: '请输入菜单地址', trigger: 'blur' }],
};
const form = reactive({
    name: '',
    parent_id: 0,
    url: '',
});
const treeData = ref(null);
const handleClose = done => {
    done();
};
const handleUnitChange = val => {
    console.log(val);
};
// 重置表单
const resetForm = () => {
    if (ruleFormRef.value) ruleFormRef.value.resetFields();
};

const onSubmit = formEl => {
    formEl.validate(async valid => {
        if (!valid) {
            return false;
        }
        if (form.id) {
            // 更新菜单
            proxy.$api.post('/api/updatemenu', form).then(res => {
                if (res.code == 200) {
                    proxy.$message.success(res.message);
                    dialogVisible.value = false;
                    getTreeData();
                }
            });
        } else {
            // 新增菜单
            if (form.parent_id == 0) {
                form.parent_id = '';
            }
            const data = await proxy.$api.post('/api/addmenu', form);
            if (data.code == 200) {
                dialogVisible.value = false;
                proxy.$message.success(data.message);
                getTreeData();
            }
        }
    });
};
// 删除菜单
const handleDelete = async row => {
    const data = await proxy.$api.post('/api/deletemenu', { id: row });
    if (data.code == 200) {
        proxy.$message.success(data.message);
        getTreeData();
    }
};
// 修改菜单
const handleEdit = async row => {
    dialogVisible.value = true;
    Object.assign(form, row);
};

// 获取菜单
const getTreeData = async () => {
    const res = await proxy.$api.menus();
    const treedata = getParentMenuTree(res.data);
    treeData.value = treedata;
};

const getParentMenuTree = tableTreeDdata => {
    let parent = {
        parent_id: '',
        name: '顶级菜单',
        id: 0,
        children: tableTreeDdata,
    };
    return [parent];
};

onMounted(async () => {
    try {
        await getTreeData();
    } catch (error) {
        console.error('失败信息:', error);
    }
});
</script>
<style></style>
