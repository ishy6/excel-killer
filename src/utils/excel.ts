import { utils, read, writeFile } from 'xlsx'
/**
 * @description: 处理文件
 * @param {Object} file 文件对象
 * @param {function} callback 回调函数
 * @return:
 */
 function dealfile(file: any, callback: any) {
    const makeCols = (refstr: any) =>
      Array(utils.decode_range(refstr).e.c + 1)
        .fill(0)
        .map((x, i) => ({
          name: utils.encode_col(i),
          key: i
        }))
  
    /* Boilerplate to set up FileReader */
    const reader = new FileReader()
    reader.onload = (e: any) => {
      /* Parse data */
      const bstr = e.target.result
      const wb = read(bstr, {
        type: 'binary'
      })
      /* Get first worksheet */
      const wsname = wb.SheetNames[0]
      const ws = wb.Sheets[wsname]
      /* Convert array of arrays */
      const data = utils.sheet_to_json(ws, {
        header: 1
      })
      /* Update state */
      callback(data, makeCols(ws['!ref']))
    }
    reader.readAsBinaryString(file)
  }
  /**
   * @description: 获取map的长度
   * @param {Object} obj map对象
   * @return: map的长度
   */
  function getLength(obj: any) {
    let count: number = 0
    for (const i in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, i)) {
        count += 1
      }
    }
  
    return count
  }
  
  /**
   * @description: 导入excel文件并返回数据
   * @param {function} 回调函数参数data,dataRef,一个是数据，一个是exce表单的索引
   * @return:
   */
  export function importExcel(callback: any) {
    const inputObj = document.createElement('input')
    inputObj.setAttribute('id', 'file')
    inputObj.setAttribute('type', 'file')
    inputObj.setAttribute('name', 'file')
    inputObj.setAttribute('style', 'visibility:hidden')
    inputObj.setAttribute('accept', '.xlsx,.xls,.csv')
    inputObj.addEventListener('change', (evt: any) => {
      const { files } = evt.target
      if (files && files[0]) {
        dealfile(files[0], (data: any, dataRef: any) => {
          callback(data, dataRef)
        })
      }
    })
    document.body.appendChild(inputObj)
    inputObj.click()
  }
  /**
   * @description:
   * @param {Object} json 服务端发过来的数据
   * @param {String} name 导出Excel文件名字
   * @return:
   */
  export function exportExcel(json: any, name: string) {
    /* convert state to workbook */
    const data = []
    const keyArray = []
    // eslint-disable-next-line no-restricted-syntax
    for (const key1 in json) {
      if (Object.prototype.hasOwnProperty.call(json, key1)) {
        const element = json[key1]
        const rowDataArray = []
        for (const key2 in element) {
          if (Object.prototype.hasOwnProperty.call(element, key2)) {
            const element2 = element[key2]
            rowDataArray.push(element2)
            if (keyArray.length < getLength(element)) {
              keyArray.push(key2)
            }
          }
        }
        data.push(rowDataArray)
      }
    }
  
    const ws = utils.aoa_to_sheet(data)
    const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, 'SheetJS')
    /* generate file and send to client */
    writeFile(wb, `${name}.xlsx`)
  }
  
  // -------------------------------------------------------------------
  /**
   * 导出 excel 文件
   * @param array JSON 数组
   * @param sheetName 第一张表名
   * @param fileName 文件名
   */
  export function exportExcelFile(array: any[], sheetName = '表1', fileName = 'example.xlsx') {
    const jsonWorkSheet = utils.json_to_sheet(array)
    const workBook: any = {
      SheetNames: [sheetName],
      Sheets: {
        [sheetName]: jsonWorkSheet
      }
    }
    return writeFile(workBook, fileName)
  }
  /**
   * 从 excel 文件读取数据
   * @param excelRcFileBuffer excel 文件
   */
  export function importExcelFromBuffer<Item = any>(excelRcFileBuffer: ArrayBuffer): Item[] {
    // 读取表格对象
    const workbook = read(excelRcFileBuffer, { type: 'buffer' })
    // 找到第一张表
    const sheetNames = workbook.SheetNames
    const sheet1 = workbook.Sheets[sheetNames[0]]
    // 读取内容
    return utils.sheet_to_json(sheet1)
  }
  
  /**
   *方法二
   * @param file
   * @returns
   */
  export function file2Excel(file: any) {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e: any) => {
        const data = e.target.result
        const workbook = read(data, {
          type: 'binary'
        })
        const result: any = []
        workbook.SheetNames.forEach(item => {
          const data = utils.sheet_to_json(workbook.Sheets[item]).map((item:any,index: number) => ({
            ...item,
            // 加上区号
            "区服": String(item["区服"]).split('-')[0],
            // 窗口号
            "窗口": file?.webkitRelativePath?.split('/')?.slice(-2)[0],
            "游戏昵称": String(item["区服"]).split('-')[1],
            count: index+1
          }))
          result.push({
            sheetName: item,
            data: data
          })
        })
        resolve(result)
      }
      // 解决中文乱码
      reader.readAsText(file,'UTF-8');
      // reader.readAsBinaryString(file)
    })
  }
  