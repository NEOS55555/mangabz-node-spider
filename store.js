const fs = require('fs');
const path = require('path');
const api = require('./api/function.js')

const pageUrl = path.resolve(__dirname, './data/page.js')	// { url: { pageIndex: 0, mgIndex: 1 } } 一些基础的参数配置
const listUrl = path.resolve(__dirname, './data/list.js')	// { url: [] } 列表，不用每次都获取
const lackUrl = path.resolve(__dirname, './data/lack.js')	// { url: { pageIndex: [mgIndex], pageIndex: [mgIndex] } }	// 缺少的图片第几张

const data = url => fs.readFileSync(url).toString() || '{}'

const writeFile = (url, text) => fs.writeFile(url, text, err => {
	if (err) {
		console.log('数据保存失败')
		return err
	}
})

/*
data: {
	url: {
		list: []		// 列表
		pageIndex: 0	// 第几页，也就是列表的下表（第几话）
		mgIndex: 1		// 第几话中的第几张图，默认1
		lackMgIndex: { pageIndex: [mgIndex], pageIndex: [mgIndex] }	// 缺少的图片第几张
	}
}

*/

function definePro (obj, key, url) {
	// let prevData = null, hasSet
	Object.defineProperty(obj, key, {
		get () {
			let d = {};
			try {
				d = JSON.parse(data(url))
			} catch (e) {
			 	console.log('获取数据失败', url)
			}
			return d
		},
		set (value) {
			try {
				writeFile(url, JSON.stringify(value, null, '\t'))
			} catch (e) {
				console.log(e)
			}
		}
	})
}

module.exports = () => {
	const obj = {
		time: 0,
		maxTime: 10
	};
	definePro(obj, 'list', listUrl)
	definePro(obj, 'page', pageUrl)
	definePro(obj, 'lack', lackUrl)
	

	obj.setHost = function (url) {
		if (this.url) {return;}
		this.url = url;
	}
	obj.pushLack = function (pageIndex, mgIndex, url) {
		const { lack } = this
		const murl = url || this.url
		lack[murl] = lack[murl] || {};
		const currLack = lack[murl]
		const lackArr = currLack[pageIndex] || []
		if (lackArr.find(it => it == mgIndex)) {
			return;
		}
		lackArr.push(mgIndex);
		currLack[pageIndex] = lackArr;
		lack[murl] = currLack
		this.lack = lack
		// this.setData(lackUrl, lack)
	}
	obj.setList = function (data, url) {
		const { list } = this
		const murl = url || this.url
		list[murl] = data;
		// this.setData(listUrl, list)
		this.list = list
	}
	obj.setPage = function (key, value, url) {
		const { page } = this
		const murl = url || this.url
		page[murl] = page[murl] || {};
		page[murl][key] = value

		// this.setData(pageUrl, page)
		this.page = page
	}
	obj.setPageIndex = function (value) {
		this.setPage('pageIndex', value)
	}
	obj.setMgIndex = function (value) {
		this.setPage('mgIndex', value)
	}

	/*obj.setData = function (dataUrl, data) {
		try {
			writeFile(dataUrl, JSON.stringify(data, null, '\t'))
		} catch (e) {
			console.log(e)
		}
	}*/
	obj.setDataByTimes = function (...args) {
		if (this.time++ > this.maxTime) {
			this.time = 0;
			this.setData(...args)
		}
	}
	obj.getList = function (url) {
		const murl = url || this.url
		// console.log(this.list, murl)
		return this.list[murl] || []
	}
	
	obj.getLack = function (pageIndex) {
		const murl = url || this.url
		return this.page[murl][pageIndex]
	}
	obj.getPage = function (key, url) {
		const murl = url || this.url
		return (this.page[murl] || {})[key]
	}
	obj.getPageIndex = function (url) {
		return this.getPage('pageIndex', url) || 0
	}
	obj.getMgIndex = function (url) {
		return this.getPage('mgIndex', url) || 1
	}

	/*obj.getData = function (key, url) {
		const murl = url || this.url
		console.log(murl)
		return (this[murl] || {})[key]
	}*/
	return obj;
}
// console.log(Object.defineProperty)

/*fs.writeFile(dataUrl, text, err => {
	if (err) {
		return console.error(err)
	}
	
})*/