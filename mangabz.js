const Download = require('./api/mangabzDownload')

const url = 'http://www.mangabz.com/54bz/'

const a = new Download(url.trim())
// 正常下载，没什么太大的作用了
// a.start()

// 下载缺页
// a.downLack()



// 强行检查某一话是否有缺失的图片
// 0表示第一话，1表示第二话，等等。可以查看list.js，查看到对应的文件名称以及位置
// a.forceCheck(20)


// 强行检查所有文件，如果有缺失会自行更新。
// 如果这个文件没有下载过，那么也会下载。
// 循环遍历，只要有漏下载的就会一直下载，直到下载完毕才会停止。
// 效果很好！就是可能会出现，当时网络不好，然后在那里死磕的情况
// 个人建议使用这个
a.forceCheckAllLoop()



