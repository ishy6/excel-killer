<template>
    <div class="common-card">
        <div class="header">
            <input ref="fileRef" type="file" name="file" webkitdirectory @change.stop="handleBatchImport" />
            <a-button type="primary" style="margin-right: 16px" @click="resetData">
                清空数据
            </a-button>
            <!-- <a-button type="primary" @click="exportExcelFromTable">
                导出Excel
            </a-button> -->
        </div>
        <a-table :scroll="{x: true, y: '600px'}" :dataSource="excelList" :columns="columns" />
    </div>
</template>
<script lang="ts">
import { defineComponent, ref } from 'vue'
import { importExcel, exportExcel, file2Excel } from '../utils/excel'

export default defineComponent({
    setup() {
        const fileRef = ref();
        const excelList = ref([])
        let promiseList: Array<any> = []
        let exportData: (String[] | null)[] = []
        const columns = ref();
        /**
         * 导出
         */
        const exportExcelFromTable = () => {
            exportExcel(exportData, 'sheet')
        }
        /**
         * 清空数据
         */
        const resetData = () => {
            excelList.value = []
            promiseList = []
            // 清除input选择的file
            fileRef.value.value = ''
        }
        /**
         * 批量导入
         */
        const handleBatchImport = () => {
            const files = fileRef.value?.files
            for(let file of files) {
                if (file.name.includes('统计')) {
                    promiseList.push(file2Excel(file))
                }
            }
            Promise.all(promiseList).then(fileList => {
                let list:any = []
                fileList.forEach(item => {
                    const length = item[0]?.data?.length
                    list = list.concat(item[0]?.data?.slice(0,length-1))
                })
                const keyList = Object.keys(list[0])
                columns.value = keyList.map((v:any) => ({
                    title: v,
                    dataIndex: v,
                    key: v,
                    fixed: v === '用户名',
                    width: 120,
                    resizable: true
                }))
                const keys = Object.keys(list[0]).slice(2, 9)
                const totalObj = {}
                keys.forEach(k => {
                    totalObj[k] = k === '等级' ? '总计' : 0
                }) 
                list.reduce((cur: any,next: any) => {
                    keys.slice(1).forEach(k => {
                        cur[k] = (Number(cur[k]) + next[k]).toFixed(2)
                    })
                    return cur
                },totalObj)
                list.unshift(totalObj)
                excelList.value = list
            })
        }
        return {
            exportExcelFromTable,
            excelList,
            columns,
            fileRef,
            resetData,
            handleBatchImport
        }
    },
})
</script>
<style>
.common-card {
    width: 100%;
    padding: 24px;
    border-radius: 12px;
}
.header {
    display: flex;
    justify-content: flex-end;
    height: 54px;
}
</style>