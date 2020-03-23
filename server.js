const koa = require('koa')
const koaBody = require('koa-body')
const fs = require('fs')

const app = new koa()

// 使用koaBody托管上传文件，koaBody会自动把文件上传到upload文件夹里，并且以一个自己字符串命名
app.use(koaBody({
    multipart: true,
    formLimit: 15,
    formidable: {
      uploadDir: __dirname + '/upload'
    }
  })
)

app.use(async (ctx, next) => {
    // 解决跨域
    ctx.set('Access-Control-Allow-Origin', '*');
    ctx.set('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild');
    ctx.set('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
    await next();
});

app.use(async (ctx, next) => {
    if(ctx.path === '/upload') {
        // 上传到后端的文件名重新命名下， 合并时才找得到
        let fd = ctx.request.body
        let filePath = ctx.request.files.file.path
        let newFileName = `${fd.fileName}-${fd.index}-${fd.uuid}`
        let newFilePath = filePath.substr(0, filePath.lastIndexOf('\\') + 1) + newFileName
        fs.renameSync(filePath, newFilePath)
        ctx.body='upload success'
    }
    else if(ctx.path === '/merge') {
        let {uuid, count, fileName} = ctx.request.body
        let ws, rs
        function merge(index) {
            if(index >= count) {
                ws && ws.close()
                // read流默认autoclose
                return
            }
            rs = fs.createReadStream(__dirname +  '/upload/' + `${fileName}-${index}-${uuid}`)
            ws = fs.createWriteStream(__dirname +  '/upload/' + `${uuid}-${fileName}`, { flags: 'a' }) // 以追加的方式插入数据
           
            rs.pipe(ws, {end: false}) // 需要合并多次，不关闭ws，
            rs.on('end', () => { // 读完之后在合并下一个片段
                merge(index + 1)
            })
        }
        merge(0)
        ctx.body='merge success'
    }
    await next()
})

app.listen(8081, () => {
    console.log('on')
})