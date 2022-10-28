<template>
    <div class="common-card">
        <div class="header">
            <div>
              账号序号：<a-input-number id="inputNumber" v-model:value="count" :min="0" />
              <a-button style="margin-left: 16px" type="primary" @click="handleFilter">
                  筛选
              </a-button>
              <a-button style="margin-left: 16px" type="default" @click="handleReset">
                  重置
              </a-button>
            </div>
            <div>
              <input ref="fileRef" type="file" name="file" webkitdirectory @change.stop="handleBatchImport" />
              <a-button type="primary" style="margin-right: 16px" @click="resetData">
                  清空数据
              </a-button>
              <!-- <a-button type="primary" @click="exportExcelFromTable">
                  导出Excel
              </a-button> -->
            </div>
        </div>
        <a-table :scroll="{x: true, y: '600px'}" :dataSource="excelList" :columns="columns" />
    </div>
</template>
<script lang="ts">
import { defineComponent, ref } from 'vue'
import { importExcel, exportExcel, file2Excel } from '../utils/excel'

export default defineComponent({
    setup() {
        const count = ref(0);
        const fileRef = ref();
        const excelList = ref([])
        let pkgExcelList: any[] = []
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
            count.value = 0
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
                const keyLength = keyList.length
                columns.value = keyList.slice(0,keyLength - 1).map((v:any) => ({
                    title: v,
                    dataIndex: v,
                    key: v,
                    fixed: v === '用户名',
                    width: 120,
                    resizable: true
                }))
                pkgExcelList = [...list]
                list = handleCalcTotal(list)
                excelList.value = list
            })
        }
        /**
         * 统计
         */
        const handleCalcTotal: any = (list: Array<any>) => {
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
          return list
        }
        /**
         * 筛选账号
         */
        const handleFilter = () => {
          const list = pkgExcelList.filter((item: any) => {
            if (Number(count.value)) {
              return item.count == count.value
            }
            return true
          })
          if (list.length) {
            excelList.value = handleCalcTotal(list)
          }else {
            excelList.value = []
          }
        }
        /**
         * 重置账号数据
         */
        const handleReset = () => {
          count.value = 0
          handleFilter()
        }
        return {
          count,
          excelList,
          columns,
          fileRef,
          resetData,
          handleReset,
          handleFilter,
          handleBatchImport,
          exportExcelFromTable
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
    justify-content: space-between;
    height: 54px;
}
</style>