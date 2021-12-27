const express=require('./express.js')

//监听函数
let app=express()
app.use(function (req,res,next) {
    console.log(123)
    next("123")//中间件发生错误
})

app.get('/name',(req,res)=>{
    res.end('name')
})

app.post('/name',(req,res)=>{
    res.end('name-post')
})

//匹配所有的方法，*匹配所有的路径
app.all('*',(req,res)=>{
    res.end('404 Not Found')
})

//错误中间件放在路由底部，4个参数
app.use(function (err,req,res,next) {
    console.log('错误中间件收尾')
    next()
})

//在8888端口上开启服务
app.listen(8888,function () {
    console.log('server start 8888')
});
