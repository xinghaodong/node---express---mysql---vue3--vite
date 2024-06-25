<template>
    <el-sub-menu v-if="hasChildren" :index="props.item.id.toString()">
        <template #title>
            <el-icon>
                <component :is="props.item.icon ? props.item.icon : Folder" />
            </el-icon>
            <span>{{ props.item.name }}</span>
        </template>
        <MenuItem v-for="(child, indexs) in props.item.children" :key="indexs" :item="child"> </MenuItem>
    </el-sub-menu>
    <template v-else>
        <el-menu-item v-if="props.item.url != '/index'" :index="props.item.url">
            <template #title>
                <el-icon>
                    <component :is="props.item.icon ? props.item.icon : Document" />
                </el-icon>
                <span>{{ props.item.name }}</span>
            </template>
        </el-menu-item>
    </template>
</template>
<script setup>
import { computed } from 'vue';
const props = defineProps({
    item: {
        type: Object,
        required: true,
    },
    isCollapse: {
        type: Boolean,
        default: false,
    },
});
const hasChildren = computed(() => Array.isArray(props.item.children) && props.item.children.length > 0);
const Document = 'Document';
const Folder = 'Folder';
</script>
