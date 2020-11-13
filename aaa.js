/*
* @author: neos55555
 */
const superagent = require('superagent')
const cheerio = require('cheerio')
const express = require('express')
const app = express();
const api = require('./api/function.js')
// const fs = require('fs');
// const path = require('path');
const store = require('./store')

const storage = store();

const timeout = 15000;		// 响应超时的时间
const HOST = 'http://www.mangabz.com';
const log = api.log;

var d;



class Download {
	// url = 
	constructor (cookie) {
		this.cookie = cookie;
	}
	start (url) {
		// this.url = url;
		storage.setHost(url)
		this.getList(url).then(list => {
			this.list = list;
			// this.pageIndex = 0;
			// this.mgIndex = 1;	// 当前第几张漫画
			const pageIndex = storage.getPageIndex() || 0
			this.getCurrentChapter(pageIndex)
		})
		
	}
	getList (url) {
		return new Promise((resolve, reject) => {
			const tempList = storage.getList()
			if (tempList.length > 0) {
				console.log('---tempList---')
				resolve(tempList)
				return 
			} else {
				console.log('---getList---')
				superagent.get(url)
					.timeout(timeout)
					.then(res => {
						const $ = cheerio.load(res.text)
						const arr = []
						const $as = $('#chapterlistload').find('a')
						for (let i = $as.length;i--;) {
							arr.push({
								url: $as.eq(i).attr('href'),
								maxPageCount: parseInt($as.eq(i).find('span').text().replace(/（|）/ig, ''))
							})
						}
						resolve(arr);
						storage.setList(arr)
						
					})
					.catch(err => {
						log.error('获取列表失败，网站响应超时，建议过会重新启动！')
					})
			}
		})
	}
	getCurrentChapter (pageIndex) {
		const that = this;
		console.log('获取第'+pageIndex+'话')
		if (pageIndex >= this.list.length) {
			return;
		}
		// const url = HOST + this.list[idx];
		const { url, maxPageCount } = this.list[pageIndex];
		// this.defaultCurl = url;
		// console.log(this.list, url)
		// console.log(that.getShowUrl(1))
		// return;
		const mgIndex = storage.getMgIndex() || 1;
		;(function intor (mgIndex) {
			var murl = that.getShowUrl(mgIndex, url, maxPageCount);
			if (mgIndex > maxPageCount) {
				console.log('开启下一话')
				storage.setPageIndex(pageIndex+1);	// 存当前第几页
				that.getCurrentChapter(pageIndex+1);
				return;
			}
			that.getParams(murl).then(params => {
				storage.setMgIndex(mgIndex)
				// that.maxMg = that.maxMg || params.MANGABZ_IMAGE_COUNT
				that.endMg = params.MANGABZ_CURL_END;
				// let maxMg = maxPageCount;
				// console.log('maxMg', that.maxMg)
					// params = {...params, MANGABZ_PAGE: mgIndex}

				api.setRandTimeout(() => {
					saveImg(murl, params, that.cookie).then(res => {
						console.log('--------------------------------')
						console.log('continue，继续下一次获取图片')
						intor(mgIndex+1)
					}).catch(err => {
						storage.pushLack(pageIndex, mgIndex)
						intor(mgIndex+1)
					})
				}, 1000, 15000)
				
			}).catch(err => {
				log.error('获取第'+pageIndex+'话'+mgIndex+'图参数失败')
				log.info('如果看到一大堆失败，不要慌，网站抽了，让程序慢慢跑吧！')
				storage.pushLack(pageIndex, mgIndex)
				intor(mgIndex+1)
			});
		})(mgIndex);
		

	}
	getShowUrl(cpg, defaultCurl, maxPageCount) {
	    var _url;
	    if (cpg == 1) {
	        _url = defaultCurl;
	    } else if (cpg == maxPageCount) {
	    	_url = this.endMg
	    } else {
	        var croot = defaultCurl.substring(0, defaultCurl.length - 1) + "-p";
	        _url = croot + cpg + "/";
	    }
	    return HOST + _url;
	}

	getParams (url) {
		return new Promise((resolve, reject) => {
			var mm = url.split("?")[0];
		    var re = /m\d+-p(\d+)\/?/;
		    var mat = mm.match(re) || [0, 1];
		    console.log('开始获取图片所需要的参数')
		    log.tip(url)
			superagent.get(url)
				.timeout(timeout)
				.then(res => {
					log.success('图片所需要的参数获取成功')
					const params = this.execParams(res.text)
				    params.MANGABZ_PAGE = parseInt(mat[1])
				    resolve(params)
				})
				.catch(reject)
		})
	}

	

	execParams (text) {
		const $ = cheerio.load(text)
		const headText = $('head').html()
		const $ss = $('head').find('script');
		const map = {};
		const parstrStr = $ss.eq(3).html()
			.replace('reseturl(window.location.href, MANGABZ_CURL.substring(0, MANGABZ_CURL.length - 1));', '')
			.split('var ')
			.filter(it => (it || '').trim())
			.map(it => it.replace(/(\"|;|')/gi, ''))
			// .split('=')
			// .map(it => it.trim()))
			.forEach(it => {
				const [key, val] = it.split('=').map(it => it.trim())
				map[key] = val.replace(/(\"|;|')/gi, '')
			})

		return map;
	}

}

function trans (map) {
	var s = '';
	for (var i in map) {
		s += i +'=' + encodeURIComponent(map[i]) + '&'
	}
	return s.slice(0, s.length - 1)
}






function saveImg (url, params, cookie) {
	return new Promise((resolve, reject) => {
		// var url = 
		const prs = {
			cid: params.MANGABZ_CID, 
        	page: params.MANGABZ_PAGE, 
        	key: '', 
        	_cid: params.MANGABZ_CID, 
        	_mid: params.MANGABZ_MID, 
        	_dt: params.MANGABZ_VIEWSIGN_DT.split(' ').join('+'), 
        	_sign: params.MANGABZ_VIEWSIGN 
		}

		
		// console.log(prs)		
		// return;
		api.mkdir(`static/manga/${params.MANGABZ_CURL.replace(/\//ig, '')}/${params.MANGABZ_CTITLE.replace(/\s/ig, '')}`)
		console.log('开始获取图片地址')
		console.log(url+'chapterimage.ashx?'+trans(prs))
		
		superagent.get(url+'chapterimage.ashx?'+trans(prs))
			.timeout(timeout)
			.set('Referer', url)	// 重点是这个，只有当前这个ref是本地址的才会成功，之后你的请求才会成功
			// .query(prs)
			// .set('Cookie', cookie)
			// .set('User-Agent', ' Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.111 Safari/537.36 Aoyou/UWw7YQlYOVZ9M3haXXN2OLgCJxZ_UrUY8V3G22OqBgD13uvfV4p6DDBNbA==')
			.then(function(res) {
				
				eval(res.text);
				if (!res.text) {
					reject('error')
					log.error('获取图片地址失败！')
					return;
				}
				// console.log(res.text)
				console.log('图片地址')
				console.log(d)

				api.saveFile(
					encodeURI(d[0]), 
					`manga/${params.MANGABZ_CURL.replace(/\//ig, '')}`,
					// `manga/${params.MANGABZ_CURL.replace(/\//ig, '')}/${params.MANGABZ_CTITLE.replace(/\s/ig, '')}`,
					params.MANGABZ_PAGE
				).then(res => {
					log.success('图片保存成功！')
					resolve()
				}).catch(err => {
					log.error('保存图片失败')
					reject('error')
				})

			}).catch(err => {
				log.error('saveImg-----timeout')
				reject('error')
			})
	})
}



const a = new Download()
a.start('http://www.mangabz.com/54bz/')




