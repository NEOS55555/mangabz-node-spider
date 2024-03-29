/*
 * @author: neos55555
 */
const superagent = require('superagent')
const cheerio = require('cheerio')
const api = require('./function.js')
// const fs = require('fs');
const path = require('path')
const store = require('./store')

const timeout = 15000 // 响应超时的时间
const HOST = 'https://www.mangabz.com'
const log = api.log

var d

api.mkdir(`../static`)
api.mkdir(`../static/manga`)

/*var storage = store('http://www.mangabz.com/54bz/');
console.log(storage.setMgIndex(21, true))
// console.log(storage.getMgIndex())*/

// api.mkdir(`../static/manga/${params.MANGABZ_CURL.replace(/\//ig, '')}`)
// api.mkdir(`../static/manga/123`)

class Download {
  // url =
  constructor(url) {
    this.url = url
    this.storage = store(this.url)
    let nameArr = url.split('/').filter((it) => it)
    const name = nameArr.pop()
    this.dirpath = `../static/manga/${name}`
    api.mkdir(this.dirpath)
  }

  isAllDownload() {
    for (let i = 0, len = this.list.length; i < len; i++) {
      if (!this.list[i].isOver) {
        return false
      }
    }
    return true
  }
  // 强制检查所有文件
  forceCheckAll(startPageIndex = 0) {
    const that = this

    if (that.isAllDownload()) {
      log.success('-----------------------------')
      log.success('该漫画已经全部下载完毕')
      log.success('-----------------------------')
      return
    }

    ;(function intor(pageIndex = 0) {
      if (pageIndex >= that.list.length) {
        console.log('已经检查完一遍')
        that.forceCheckAll()
        return
      }
      that.findLack(pageIndex).then((lackArr) => {
        if (lackArr.length) {
          console.log('查询到第' + pageIndex + '话有缺失图片，开始下载')
        }
        that.downLackMgByList(pageIndex, lackArr).then((v) => {
          intor(pageIndex + 1)
        })
      })
    })(startPageIndex)
  }
  // 递归查询该漫画的所有文件夹是否下载完成，已完成就会关闭
  forceCheckAllLoop(startPageIndex) {
    const that = this
    this.getList(this.url).then((list) => {
      this.forceCheckAll(startPageIndex)
    })
  }

  forceCheck(pageIndex) {
    const that = this
    this.getList(this.url).then((list) => {
      this.findLack(pageIndex).then((lackArr) => {
        if (lackArr.length) {
          console.log('查询到第' + pageIndex + '话有缺失图片，开始下载')
          that.downLackMgByList(pageIndex, lackArr)
        }
      })
    })
  }

  findLack(pageIndex) {
    const item = this.list[pageIndex]

    return new Promise((resolve, reject) => {
      if (!item) {
        console.log('不存在')
        resolve([])
        return
      }

      const { url, maxPageCount, isOver } = item
      api.mkdir(`${this.dirpath}/${url.replace(/\//gi, '')}`)

      if (isOver) {
        resolve([])
        log.success('第' + pageIndex + '话已经下载完毕')
        return
      }

      api
        .readAllFiles(path.resolve(__dirname, `${this.dirpath}${url}`))
        .then((res) => {
          res = res.map((it) => parseInt(it.split('.')[0]))
          res.sort((a, b) => a - b)

          var lackArr = []
          var a = 1,
            b = 0
          while (a <= maxPageCount) {
            if (res[b] === a) {
              b++
            } else {
              lackArr.push(a)
            }
            a++
          }
          if (lackArr.length === 0) {
            this.storage.setListOverPage(pageIndex, true)
          }
          resolve(lackArr)
        })
    })
  }

  downLackMgByList(pageIndex, lackArr) {
    const that = this
    return new Promise((resolve, reject) => {
      ;(function intor(lackIndex) {
        // that.storage.setLackArrIndex(lackIndex)
        // console.log(lackArr)
        if (lackIndex >= lackArr.length) {
          log.success('已过滤完第' + pageIndex + '话缺页')
          resolve('ok')
          return
        }

        that.getImgByMgIndex(pageIndex, lackArr[lackIndex], true).then((v) => {
          intor(lackIndex + 1)
        })
      })(0)
    })
  }

  getList(url) {
    const that = this
    return new Promise((resolve, reject) => {
      const tempList = this.storage.getList()
      // return;
      if (tempList.length > 0) {
        console.log('---tempList---')
        that.list = tempList
        resolve(tempList)
        return
      } else {
        console.log('---getList---')
        ;(function intor() {
          superagent
            .get(url)
            .timeout(25000)
            .end((err, res) => {
              if (err) {
                log.error('获取列表失败，网站响应超时，即将再次获取！')

                setTimeout(function () {
                  intor()
                }, 1099)
                return
              }
              log.info('列表已获取')

              // console.log(res.text)
              const $ = cheerio.load(res.text)
              const arr = []
              const $as = $('#chapterlistload').find('a')
              for (let i = $as.length; i--; ) {
                arr.push({
                  url: $as.eq(i).attr('href'),
                  maxPageCount: parseInt(
                    $as.eq(i).find('span').text().replace(/（|）/gi, '')
                  ),
                })
              }
              that.list = arr
              that.storage.setList(arr, true)
              resolve(arr)
            })
        })()

        /* .then(res => {
						
					})
					.catch(err => {
						// that.getList(url)
						log.error('获取列表失败，网站响应超时，建议过会重启！')
						// intor()
					}) */
      }
    })
  }
  async getCurrentChapter(pageIndex, startMgIndex) {
    const that = this
    return new Promise((resolve) => {
      console.log('获取第' + pageIndex + '话，列表长度', this.list.length)
      if (pageIndex >= this.list.length) {
        resolve('ok')
        return
      }
      const { url, maxPageCount } = this.list[pageIndex]
      const mgIndex = startMgIndex
      ;(function intor(mgIndex) {
        // console.log('asdfasdf')
        if (mgIndex > maxPageCount) {
          resolve('ok')
          return
        }
        that.getImgByMgIndex(pageIndex, mgIndex).then((v) => {
          intor(mgIndex + 1)
        })
      })(mgIndex)
    })
  }
  // 获取第几话中，第几页的漫画
  getImgByMgIndex(pageIndex, mgIndex, isLackType) {
    const that = this
    const { url, maxPageCount } = this.list[pageIndex]
    if (!isLackType) {
      that.storage.setMgIndex(mgIndex)
    } /* else {
			// that.storage.setLackMgIndex(mgIndex)
		}*/
    console.log(`开始下载第${pageIndex}话，第${mgIndex}页漫画`)
    return new Promise((resolve) => {
      var murl = that.getShowUrl(mgIndex, url, maxPageCount)
      if (mgIndex > maxPageCount) {
        resolve('ok')
        return
      }

      that
        .getParams(murl)
        .then((params) => {
          // that.maxMg = that.maxMg || params.MANGABZ_IMAGE_COUNT
          that.endMg = params.MANGABZ_CURL_END
          // let maxMg = maxPageCount;
          // console.log('maxMg', that.maxMg)
          // params = {...params, MANGABZ_PAGE: mgIndex}

          api.setRandTimeout(
            () => {
              saveImg(murl, params, that.dirpath)
                .then((res) => {
                  // console.log('--------------------------------')
                  console.log('continue，继续下一次获取图片')
                  isLackType && that.storage.delLack(pageIndex, mgIndex)
                  resolve('ok')
                })
                .catch((err) => {
                  that.storage.pushLack(pageIndex, mgIndex)
                  resolve('ok')
                })
            },
            1000,
            5000
          )
        })
        .catch((err) => {
          log.error('获取第' + pageIndex + '话' + mgIndex + '图参数失败')
          log.info('如果看到一大堆失败，不要慌，网站抽了，让程序慢慢跑吧！')
          that.storage.pushLack(pageIndex, mgIndex)
          resolve('ok')
        })
    })
  }

  getShowUrl(cpg, defaultCurl, maxPageCount) {
    var _url
    if (cpg == 1) {
      _url = defaultCurl
    } /* else if (cpg == maxPageCount) {
	    	_url = this.endMg
	    }*/ else {
      var croot = defaultCurl.substring(0, defaultCurl.length - 1) + '-p'
      _url = croot + cpg + '/'
    }
    return HOST + _url
  }

  getParams(url) {
    return new Promise((resolve, reject) => {
      var mm = url.split('?')[0]
      var re = /m\d+-p(\d+)\/?/
      var mat = mm.match(re) || [0, 1]
      console.log('开始获取图片所需要的参数')
      log.tip(url)
      superagent
        .get(url)
        .timeout(timeout)
        .then((res) => {
          // log.success('图片所需要的参数获取成功')
          const params = this.execParams(res.text)
          params.MANGABZ_PAGE = parseInt(mat[1])
          resolve(params)
        })
        .catch(reject)
    })
  }

  execParams(text) {
    const $ = cheerio.load(text)
    const headText = $('head').html()
    const $ss = $('head').find('script')
    let phtml = ''
    for (var i = 0; i < $ss.length; i++) {
      var $s = $ss.eq(i)
      var html = $s.html()
      if (html.indexOf('var MANGABZ_CID') != -1) {
        phtml = html
        // return
        break
      }
    }

    const map = {}
    const parstrStr = phtml
      .replace(
        'reseturl(window.location.href, MANGABZ_CURL.substring(0, MANGABZ_CURL.length - 1));',
        ''
      )
      .split('var ')
      .filter((it) => (it || '').trim())
      .map((it) => it.replace(/(\"|;|')/gi, ''))
      // .split('=')
      // .map(it => it.trim()))
      .forEach((it) => {
        const [key, val] = it.split('=').map((it) => it.trim())
        map[key] = val.replace(/(\"|;|')/gi, '')
      })
    console.log('map', map)

    return map
  }
}

function trans(map) {
  var s = ''
  for (var i in map) {
    s += i + '=' + encodeURIComponent(map[i]) + '&'
  }
  return s.slice(0, s.length - 1)
}

function saveImg(url, params, dirpath) {
  return new Promise((resolve, reject) => {
    // var url =
    const prs = {
      cid: params.MANGABZ_CID,
      page: params.MANGABZ_PAGE,
      key: '',
      _cid: params.MANGABZ_CID,
      _mid: params.MANGABZ_MID,
      _dt: params.MANGABZ_VIEWSIGN_DT.split(' ').join('+'),
      _sign: params.MANGABZ_VIEWSIGN,
    }

    api.mkdir(`${dirpath}/${params.MANGABZ_CURL.replace(/\//gi, '')}`)
    console.log('开始获取图片地址')
    // console.log(url+'chapterimage.ashx?'+trans(prs))

    superagent
      .get(url + 'chapterimage.ashx?' + trans(prs))
      .timeout(timeout)
      .set('Referer', url)
      .end(function (err, res) {
        if (err) {
          log.error('获取图片地址失败！')
          reject('error')
          return
        }

        eval(res.text)
        if (!res.text) {
          reject('error')
          log.error('获取图片地址失败！')
          return
        }
        // console.log(res.text)
        console.log('图片地址如下：')
        console.log(d)
        // console.log(dirpath)
        // console.log(path.resolve(__dirname, `${dirpath}/${params.MANGABZ_CURL.replace(/\//ig, '')}`))
        // return;
        api
          .saveFile(
            encodeURI(d[0]),
            path.resolve(
              __dirname,
              `${dirpath}/${params.MANGABZ_CURL.replace(/\//gi, '')}`
            ),
            // `manga/${params.MANGABZ_CURL.replace(/\//ig, '')}/${params.MANGABZ_CTITLE.replace(/\s/ig, '')}`,
            params.MANGABZ_PAGE,
            'jpg',
            url
          )
          .then((res) => {
            log.success('图片保存成功！')
            resolve()
          })
          .catch((err) => {
            log.error('保存图片失败')
            console.log(err)
            reject('error')
          })
      })
    // .query(prs)
    // .set('Cookie', cookie)
    // .set('User-Agent', ' Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.111 Safari/537.36 Aoyou/UWw7YQlYOVZ9M3haXXN2OLgCJxZ_UrUY8V3G22OqBgD13uvfV4p6DDBNbA==')
  })
}

module.exports = Download
