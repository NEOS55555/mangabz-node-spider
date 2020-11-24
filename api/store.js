const fs = require('fs');
const path = require('path');
const api = require('./function.js')

api.mkdir(`../data`)

// 一些基础的参数配置
const pageUrl = path.resolve(__dirname, '../data/page.js')	
const listUrl = path.resolve(__dirname, '../data/list.js')	// { url: [] } 列表，不用每次都获取
const lackUrl = path.resolve(__dirname, '../data/lack.js')	// { url: { pageIndex: [mgIndex], pageIndex: [mgIndex] } }	// 缺少的图片第几张

const getData = url => {
	var d = {};
	try {
		d = JSON.parse(fs.readFileSync(url).toString() || '{}')
	} catch (e) {

	}
	return d;
}


const setData = (url, text) => fs.writeFile(url, text, err => {
	if (err) {
		console.log('数据保存失败')
		return err
	}
})

/*
data: {
	url: {
		list: []		// 列表
		page: {
			pageIndex: 0	// 第几页，也就是列表的下标（第几话）
			mgIndex: 1		// 第几话中的第几张图，默认1
		}
		lack: {
			pageIndex: [mgIndex, mgIndex, mgIndex, mgIndex]	// 缺少的图片第几张
		}
		
	}
}

*/

/*function definePro (obj, key, url) {
	Object.defineProperty(obj, key, {
		get () {
			
			firstGot = true;
			let d = {};
			try {
				d = JSON.parse(getData(url))
			} catch (e) {
			 	console.log('获取数据失败', url)
			}
			// console.log(d)
			return d
		},
		set (value) {
			console.log('key:' + key, '-----setData:', value)
			prevData = val;
			val = value;
			try {
				// prevData = value;
				writeFile(url, JSON.stringify(value, null, '\t'))
			} catch (e) {
				console.log(e)
			}
		}
	})
}*/
var id = 0;
module.exports = (url) => {
	// console.log('-----------------------')
	
	class Store {
		constructor (url) {
			this.url = url;
			this.id = id++;
			this.timeCount = 0;
			this.maxTimeCount = 5;	// 写文件maxTimeCount次，才能保存
			this.list = getData(listUrl)
			this.page = getData(pageUrl)
			this.lack = getData(lackUrl)

			this.listTimmer = null;
		}
		setData (url, data, isRightNow) {

			setData(url, JSON.stringify(data, null, '\t'))
			/*if (++this.timeCount >= this.maxTimeCount || isRightNow) {
				this.timeCount = 0;
				// console.log(url, data)
				// return;
				setData(url, JSON.stringify(data, null, '\t'))
			}*/
		}
		// lack
		pushLack (pageIndex, mgIndex) {
			return;
			const murl = this.url
			this.lack[murl] = this.lack[murl] || {};
			this.lack[murl][pageIndex] = this.lack[murl][pageIndex] || [];

			const itemIdx = this.lack[murl][pageIndex].findIndex(it => it == mgIndex)
			if (itemIdx > -1) {
				// this.lack[murl][pageIndex].splice(itemIdx+1)
				return;
			}
			this.lack[murl][pageIndex].push(mgIndex);
			// this.lack[murl][pageIndex].sort();
			
			this.setData(lackUrl, this.lack, true);

		}
		delLack (pageIndex, mgIndex, isRightNow) {
			return;
			const murl = this.url
			this.lack[murl] = this.lack[murl] || {};
			this.lack[murl][pageIndex] = this.lack[murl][pageIndex] || [];

			const itemIdx = this.lack[murl][pageIndex].findIndex(it => it == mgIndex)
			this.lack[murl][pageIndex].splice(itemIdx, 1)
			if (this.lack[murl][pageIndex].length == 0) {
				delete this.lack[murl][pageIndex]
			}

			this.setData(lackUrl, this.lack, isRightNow);
			
		}
		getLack () {
			return this.lack[this.url]
		}
		// list
		setList (data, isRightNow) {
			this.list[this.url] = data;
			this.setData(listUrl, this.list, isRightNow);
		}
		setListOverPage (pageIndex, f) {
			this.list[this.url][pageIndex].isOver = f;

			clearTimeout(this.listTimmer);
			this.listTimmer = setTimeout(() => {
				// console.log(this.list)
				this.setData(listUrl, this.list);
			}, 1000)
		}
		getList () {
			return this.list[this.url] || []
		}
		// page
		setPage (key, value, isRightNow) {
			// console.log('setPage', page)
			// console.log(this.page)
			const murl = this.url
			this.page[murl] = this.page[murl] || {};
			this.page[murl][key] = value
			// console.log(this.page)
			this.setData(pageUrl, this.page, isRightNow);
		}
		setPageIndex (...args) {
			this.setPage('pageIndex', ...args)
		}
		setMgIndex (...args) {
			this.setPage('mgIndex', ...args)
		}
		setLackMapIndex (...args) {
			this.setPage('lackMapIndex', ...args)
		}
		setLackArrIndex (...args) {
			this.setPage('lackArrIndex', ...args)
		}

		getPage (key) {
			return (this.page[this.url] || {})[key]
		}
		getPageIndex () {
			return this.getPage('pageIndex') || 0
		}
		getMgIndex () {
			return this.getPage('mgIndex') || 1
		}
		getLackMapIndex () {
			return this.getPage('lackMapIndex') || 0
		}
		getLackArrIndex () {
			return this.getPage('lackArrIndex') || 0
		}


	}
	

	return new Store(url);
}
