const superagent = require('superagent')
var fs = require('fs');
const path = require('path')
// 读取该目录下所有文件
exports.readAllFiles = function (pathName) {
	return new Promise((resolve, reject) => {
		fs.readdir(pathName, function(err, files){
		  var dirs = [];
		  (function iterator(i){
		    if(i == files.length) {
		      resolve(dirs);
		      return ;
		    }
		    fs.stat(path.join(pathName, files[i]), function(err, data){     
		      if(data.isFile()){               
		          dirs.push(files[i]);
		      }
		      iterator(i+1);
		     });   
		  })(0);
			
		});
	})
}


// 同时执行最多 多少个函数，最多多少次
// 有个函数要执行max次，但是又堵塞问题，所以最多只有10个执行
exports.simuExec = (fn, max, each=10, isgetError) => {
	let startTime = new Date();
	return new Promise((resolve, reject) => {
		let count = 0;
		let ajaxCount = 0;
		let arr = [];
		let errorArr = [];

		for (let i =0; i < each; i++) {
			temp();
		}
		function temp () {
			count ++;
			if (count > max) {
				return;
			}

			fn(count).then((value) => {
				// console.log('s')
				arr.push(value)
				console.log(ajaxCount, 'r')
				if (++ajaxCount >= max) {
					console.log('共耗时' + (new Date() - startTime) + 'ms')
					if (isgetError) {
						resolve({
							over: arr,
							error: errorArr
						})
					} else {
						resolve(arr)
					}
				}
			  temp();
			}).catch(res => {
				errorArr.push(ajaxCount);
				console.log(ajaxCount, 'e')
				if (++ajaxCount >= max) {
					console.log('共耗时' + (new Date() - startTime) + 'ms')
					if (isgetError) {
						resolve({
							over: arr,
							error: errorArr
						})
					} else {
						resolve(arr)
					}
				}
			  temp();
			});
		}
	}) 
}
// 创建文件夹
const dirCache={};
function mkdir(filepath) {
    const arr=filepath.split('/');
    let dir='.';
    let f = false
    for(let i=0;i<arr.length;i++){
        dir += '/'+arr[i];
    		// console.log(dir,i,fs.existsSync(dir), dirCache[dir])
        if(!dirCache[dir]&&!fs.existsSync(dir)){
            dirCache[dir]=true;
            fs.mkdirSync(dir);
            // console.log(dir+'创建成功')
            f = true;
        }
    }
    return f;
}
exports.mkdir = mkdir;
// 将一个数组扁平化
function flatten(arr) {
    return arr.reduce(function(prev, next){
        return prev.concat(Array.isArray(next) ? flatten(next) : next)
    }, [])
}
exports.flatten = flatten;

// 保存文件到本地
// 这个非常容易卡住不动
/*exports.saveFile = function (url, dirname, fileName) {
	return new Promise((resolve, reject) => {
		superagent.head(url, (err, res, body) => {
			const ntm = url.slice(url.lastIndexOf('/')+1).split('[www.555x.org]')
			let name = decodeURI(ntm[ntm.length - 1])

			const fileType = name.slice(name.lastIndexOf('.'))
			name = name.slice(0, name.lastIndexOf('.'))

			const fileUrl = `/static/${dirname}/${(fileName)}.jpg`;
			// console.log(path.resolve(__dirname, fileUrl))
			// return;
		    try {
		        let startTime = new Date().getTime();
		        if (err) {
		        	console.log(err)
		        	reject(err)
		        	return;
		        }
		        // console.log(url)
		        !err && superagent(url).timeout(15000).on('response', () => {
		            resolve(fileUrl)
		        }).pipe(fs.createWriteStream(path.resolve(__dirname, '..'+fileUrl)));
		        // superagent.get(targetUrl).pipe(fs.createWriteStream(__dirname+'/compassedu/50850.html'));
		        
		    } catch (err) {
		    	console.log(err)
		    }
		});
	})
}*/

exports.saveFile = function (url, dirname, fileName) {
	return new Promise((resolve, reject) => {
	
		superagent
            .get(url)
            .timeout(15000)
            .then(res => {
            	const fileUrl = `../static/${dirname}/${(fileName)}.jpg`;
                fs.writeFile(path.resolve(__dirname, fileUrl), res.body, "binary", function(err) {
                    if (err) {
                    	return reject(err)
                    }
                    resolve('ok')
                });
            })
            .catch(reject);
		    
	})
}


function getRand (a, b) {
	return Math.floor(Math.random() * (b - a))
}

exports.setRandTimeout = (fn, minSec=100, maxSec=200) => {
	setTimeout(fn, getRand(minSec, maxSec))
}


var styles = {
    'bold'          : ['\x1B[1m',  '\x1B[22m'],
    'italic'        : ['\x1B[3m',  '\x1B[23m'],
    'underline'     : ['\x1B[4m',  '\x1B[24m'],
    'inverse'       : ['\x1B[7m',  '\x1B[27m'],
    'strikethrough' : ['\x1B[9m',  '\x1B[29m'],
    'white'         : ['\x1B[37m', '\x1B[39m'],
    'grey'          : ['\x1B[90m', '\x1B[39m'],
    'black'         : ['\x1B[30m', '\x1B[39m'],
    'blue'          : ['\x1B[34m', '\x1B[39m'],
    'cyan'          : ['\x1B[36m', '\x1B[39m'],
    'green'         : ['\x1B[32m', '\x1B[39m'],
    'magenta'       : ['\x1B[35m', '\x1B[39m'],
    'red'           : ['\x1B[31m', '\x1B[39m'],
    'yellow'        : ['\x1B[33m', '\x1B[39m'],
    'whiteBG'       : ['\x1B[47m', '\x1B[49m'],
    'greyBG'        : ['\x1B[49;5;8m', '\x1B[49m'],
    'blackBG'       : ['\x1B[40m', '\x1B[49m'],
    'blueBG'        : ['\x1B[44m', '\x1B[49m'],
    'cyanBG'        : ['\x1B[46m', '\x1B[49m'],
    'greenBG'       : ['\x1B[42m', '\x1B[49m'],
    'magentaBG'     : ['\x1B[45m', '\x1B[49m'],
    'redBG'         : ['\x1B[41m', '\x1B[49m'],
    'yellowBG'      : ['\x1B[43m', '\x1B[49m']
}

function log (key, obj) {
    if (typeof obj === 'string') {
        console.log(styles[key][0] + '%s' + styles[key][1], obj)
    } else if (typeof obj === 'object') {
        console.log(styles[key][0] + '%o' + styles[key][1], obj)
    } else {
        console.log(styles[key][0] + '%s' + styles[key][1], obj)
    }
}


exports.log = {
	success: txt => log('green', txt),
	error: txt => log('red', txt),
	tip: txt => log('yellow', txt),
}