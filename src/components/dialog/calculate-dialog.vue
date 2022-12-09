<template>
  <a-modal
    v-model:visible="visible"
    title="资源兑换计算"
    cancelText="继续选择"
    okText="关闭"
    :width="950"
    :closable="false"
    :maskClosable="false"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    粮食：<a-input-number v-model:value="resObj.food" :min="0" /> 木头：<a-input-number
      v-model:value="resObj.wood"
      :min="0"
    />
    铁矿：<a-input-number v-model:value="resObj.steel" :min="0" /> 汽油：<a-input-number
      v-model:value="resObj.gas"
      :min="0"
    />
    <span class="ml12">税率：</span>
    <a-input-number
      v-model:value="resObj.tax"
      :formatter="(v: any) => `${v}%`"
      :parser="(v: string) => v.replace('%', '')"
      :min="0"
      :max="100"
    />
    <a-button class="ml12" type="primary" @click="handleCalculate">计算</a-button>
    <a-table
      key="account"
      class="mt12"
      :scroll="{ x: true, y: '500px' }"
      :dataSource="tableData"
      :columns="columns"
      :pagination="false"
    />
  </a-modal>
</template>
<script lang="ts">
import { defineComponent, ref, toRaw, reactive, watch } from "vue";
export default defineComponent({
  props: {
    value: {
      type: Boolean,
      default: false,
    },
    selectedRows: {
      type: Array,
      default: () => [],
    },
  },
  setup(props, ctx) {
    let selectDataList: any = [];
    const visible = ref<boolean>(props.value);
    const tableData: any = ref([]);
    const columns = ref();
    const resObj = reactive({
      food: 0,
      wood: 0,
      steel: 0,
      gas: 0,
      tax: 25,
    });
    const fieldMap = {
      food: "粮食",
      wood: "木头",
      steel: "铁矿",
      gas: "金币",
    };
    const exchangeRate = {
      food: 10,
      wood: 10,
      steel: 2,
      gas: 0.5,
    };

    watch(
      () => props.value,
      (v) => {
        visible.value = v;
        if (v) {
          selectDataList = [];
          props.selectedRows.forEach((item) => {
            // 把稀土比例化
            let rowData: any = JSON.parse(JSON.stringify(toRaw(item)));
            rowData["稀土"] = rowData["稀土"] * 200;
            // 取出源数据
            selectDataList.push(rowData);
          });
        }
      }
    );

    /**
     * 均衡策略算法
     * 为每个窗口分发平均的资源数量
     */
    const handleCalculate = () => {
      // 先计算扣税前的数值
      const totalObj = {}; // 选中的账号的所有资源数量
      const exchangeObj = {}; // 各个账号兑换资源的数量
      const targetResObj = {}; // 各个资源需要兑换的数量
      const resRawData = toRaw(resObj);

      // 计算各个资源需要兑换的数量
      const keyList = Object.keys(resRawData).slice(0, 4);
      for (let key of keyList) {
        // 小数向上保留
        targetResObj[key] = Math.ceil((resRawData[key] / (100 - resRawData["tax"])) * 100);
      }

      // 计算选中的所有资源数量
      keyList.forEach((k) => {
        totalObj[k] = 0;
      });
      selectDataList.reduce((cur: any, next: any) => {
        keyList.forEach((k) => {
          cur[k] = Number((cur[k] + next[fieldMap[k]]).toFixed(2));
        });
        return cur;
      }, totalObj);

      // 对选中的数据根据稀土进行排序
      selectDataList.sort((cur: Object, next: Object) => cur["稀土"] - next["稀土"]);

      // 计算每个账号需要兑换的资源
      for (let key in targetResObj) {
        if (totalObj[key] < targetResObj[key]) {
          selectDataList.forEach((item: Object, index: number) => {
            // 计算低于平均分摊资源的账号数目
            const targetAvg = (targetResObj[key] / (selectDataList.length - index)).toFixed(2);
            let count = 0;
            selectDataList.slice(index).forEach((item: Object) => {
              if (item[fieldMap[key]] < targetAvg) {
                count++;
              }
            });
            // 均摊到每个少于平均值的账号上
            const exchangeAvg = ((targetResObj[key] - totalObj[key]) / count).toFixed(2);
            const targetExchangeNumber = Math.ceil((200 * Number(exchangeAvg)) / exchangeRate[key]);
            // 超出稀土资源的逻辑处理
            const actualExchangeNumber = item["稀土"] >= targetExchangeNumber ? targetExchangeNumber : item["稀土"];
            exchangeObj[item["账号"]] = exchangeObj[item["账号"]] ?? {};
            exchangeObj[item["账号"]][fieldMap[key] == "金币" ? "汽油" : fieldMap[key]] = actualExchangeNumber;
            // 选中的账号的资源数量对应修改
            item["稀土"] -= actualExchangeNumber;
            item[fieldMap[key]] = Number(
              (item[fieldMap[key]] + (actualExchangeNumber * exchangeRate[key]) / 200).toFixed(2)
            );
            // 总数对应修改
            totalObj[key] = Number((totalObj[key] + (actualExchangeNumber * exchangeRate[key]) / 200).toFixed(2));
          });
        } else {
          selectDataList.forEach((item: Object) => {
            exchangeObj[item["账号"]] = exchangeObj[item["账号"]] ?? {};
            exchangeObj[item["账号"]][fieldMap[key] == "金币" ? "汽油" : fieldMap[key]] = "-";
          });
        }
      }

      // 初始化表格数据
      const accountList = Object.keys(exchangeObj);
      tableData.value = accountList.map((account) => ({
        账号: account,
        ...exchangeObj[account],
      }));
      // 总计
      const total = { 账号: "总计" };
      for (let key in fieldMap) {
        total[fieldMap[key] == "金币" ? "汽油" : fieldMap[key]] = `${totalObj[key]}(${
          totalObj[key] >= targetResObj[key]
            ? `足够,仅需${targetResObj[key]}`
            : `还需${(targetResObj[key] - totalObj[key]).toFixed(2)}`
        })`;
      }
      tableData.value.push(total);

      const columnList = Object.keys(tableData.value[0]);
      columns.value = columnList.map((v: any) => ({
        title: v,
        dataIndex: v,
        width: 120,
        resizable: true,
      }));

      console.log(accountList, tableData.value, exchangeObj);
    };

    const handleOk = () => {
      ctx.emit("update:value", false);
    };

    const handleCancel = () => {
      ctx.emit("update:value", false);
    };
    return {
      resObj,
      visible,
      columns,
      tableData,
      handleOk,
      handleCancel,
      handleCalculate
    };
  },
});
</script>
<style>
.ml12 {
  margin-left: 12px;
}
.mt12 {
  margin-top: 12px;
}
</style>
