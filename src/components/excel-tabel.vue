<template>
  <div class="common-card">
    <div class="header">
      <div>
        账号序号：<a-input-number id="inputNumber" v-model:value="count" :min="0" />
        <a-input v-model:value="account" style="width: 200px; margin-left: 16px" placeholder="请输入账号或游戏昵称"></a-input>
        <a-button class="ml16" type="primary" @click="handleFilter"> 筛选 </a-button>
        <a-button class="ml16" type="default" @click="handleReset"> 重置 </a-button>
        <a-button class="ml16" type="primary" @click="handleCalculate">
          {{ btnName }}
        </a-button>
      </div>
      <div>
        <input ref="fileRef" type="file" name="file" webkitdirectory @change.stop="handleBatchImport" />
        <a-button type="primary" style="margin-right: 16px" @click="resetData"> 清空数据 </a-button>
        <!-- <a-button type="primary" @click="exportExcelFromTable">
                  导出Excel
              </a-button> -->
      </div>
    </div>
    <a-table
      key="账号"
      :scroll="{ x: true, y: '600px' }"
      :dataSource="excelList"
      :columns="columns"
      :pagination="pagination"
      :row-selection="rowSelection"
      @change="handlePageChange"
    />
  </div>
  <CalculateDialog v-model:value="visible" :selectedRows="state.selectedRows" />
</template>
<script lang="ts">
import { defineComponent, ref, reactive, computed } from "vue";
import { exportExcel, file2Excel } from "../utils/excel";

import CalculateDialog from "./dialog/calculate-dialog.vue";

export default defineComponent({
  components: {
    CalculateDialog,
  },
  setup() {
    const count = ref(0);
    const account = ref();
    const fileRef = ref();
    const visible = ref(false);
    const excelList = ref([]);
    let pkgExcelList: any[] = [];
    let promiseList: Array<any> = [];
    let exportData: (String[] | null)[] = [];
    const columns = ref();
    const btnName = ref("资源计算器");
    const state = reactive({
      selectedRowKeys: [],
      selectedRows: [],
    });
    const pagination = ref({
      current: 1,
      pageSize: 20,
    });

    // 计算属性

    // 多选配置选项
    const rowSelection = computed(() => {
      if (btnName.value !== "资源计算器") {
        return {
          onChange: (selectedRowKeys: any, selectedRows: any) => {
            state.selectedRowKeys = selectedRowKeys;
            state.selectedRows = selectedRows;
          },
        };
      }
      return null;
    });

    // 方法

    /**
     * 导出
     */
    const exportExcelFromTable = () => {
      exportExcel(exportData, "sheet");
    };
    /**
     * 清空数据
     */
    const resetData = () => {
      count.value = 0;
      account.value = "";
      excelList.value = [];
      promiseList = [];
      // 清除input选择的file
      fileRef.value.value = "";
    };
    /**
     * 批量导入
     */
    const handleBatchImport = () => {
      const files = fileRef.value?.files;
      for (let file of files) {
        if (file.name.includes("统计")) {
          promiseList.push(file2Excel(file));
        }
      }
      Promise.all(promiseList).then((fileList) => {
        let list: any = [];
        fileList.forEach((item) => {
          const length = item[0]?.data?.length;
          list = list.concat(item[0]?.data?.slice(0, length - 1));
        });
        const keyList = Object.keys(list[0]);
        const keyLength = keyList.length;
        columns.value = keyList.slice(0, keyLength - 1).map((v: any) => ({
          title: v == "金币" ? "汽油" : v,
          dataIndex: v,
          fixed: v === "用户名",
          width: 120,
          resizable: true,
          sorter: (a: any, b: any) => a[v] - b[v],
          sortDirections: ["ascend", "descend"],
        }));
        // 列表需要key
        list.forEach((item: Object, index: Number) => {
          item["key"] = "" + index;
        });
        pkgExcelList = [...list];
        list = handleCalcTotal(list);
        excelList.value = list;
      });
    };
    /**
     * 统计
     */
    const handleCalcTotal: any = (list: Array<any>) => {
      const keys = Object.keys(list[0]).slice(2, 9);
      const totalObj = {};

      keys.forEach((k) => {
        totalObj[k] = k === "等级" ? "总计" : 0;
      });
      list.reduce((cur: any, next: any) => {
        keys.slice(1).forEach((k) => {
          cur[k] = (Number(cur[k]) + next[k]).toFixed(2);
        });
        return cur;
      }, totalObj);
      list.unshift(totalObj);
      return list;
    };
    /**
     * 筛选账号
     */
    const handleFilter = () => {
      const list = pkgExcelList
        .filter((item: any) => {
          if (Number(count.value)) {
            return item.count == count.value;
          }
          return true;
        })
        .filter((item: any) => {
          if (account.value) {
            return item["账号"] === account.value || item["游戏昵称"] === account.value;
          }
          return true;
        });
      if (list.length) {
        excelList.value = handleCalcTotal(list);
      } else {
        excelList.value = [];
      }
    };
    /**
     * 重置账号数据
     */
    const handleReset = () => {
      count.value = 0;
      account.value = "";
      handleFilter();
    };
    /**
     * 选择分页
     */
    const handlePageChange = (val: any) => {
      pagination.value = val;
    };
    /**
     * 资源计算器
     */
    const handleCalculate = () => {
      if (btnName.value == "资源计算器") {
        btnName.value = "选择完毕";
      } else {
        visible.value = true;
      }
    };
    return {
      count,
      state,
      account,
      excelList,
      columns,
      fileRef,
      btnName,
      visible,
      pagination,
      rowSelection,
      resetData,
      handleReset,
      handleFilter,
      handleCalculate,
      handlePageChange,
      handleBatchImport,
      exportExcelFromTable,
    };
  },
});
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
.ml16 {
  margin-left: 16px;
}
</style>
