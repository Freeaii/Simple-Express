const http=require('http')
const url=require('url')


/*
    express实质上构造的是Http.createServer的回调函数

中间件 use
    1.在执行路由之前(！important)，需要做一些处理工作，就可以采用中间件
    2.中间件可以扩展一些方法,一般express会封装一些中间件，所以req中可以添加很多方法比如path/query,这些方法需要我们自己封装，
      然后以app.use的方式使用，比如可以在req上添加某些属性，并且必须在路由之前使用。
*/

module.exports=function express() {
    //监听函数：此app就是http.createServer中的回调函数
    let app=(req,res)=>{
        //取出请求的method
        let m=req.method.toLowerCase()
        //获取请求路径
        let {pathname}=url.parse(req.url)
        //定义此时的步骤为任务数组第一步，后续会通过递归来将任务后移
        let index=0;
        function next(err) {
            //如果数组全部迭代完成还没找到，则说明路径不存在
            if(index===app.routes.length){
                return res.end('404 Not Found')
            }
            //取出当前任务的相关信息，每次调用next就应该取下一个
            let {method,path,handler}=app.routes[index++];

            if(err){//当发生错误，就会略过后面除了错误中间件的所有中间件。
                //如果有错误，再去找错误中间件，错误中间件有个特点，回调函数有4个参数
                if(handler.length===4){
                    handler(err,req,res,next)
                }else {
                    //如果没有匹配到，就将err继续往下传
                    next(err)
                }
            }else {
                //如果处理过程中遇到中间件，则执行中间件代码，且必须next之后，才会继续执行之后的任务。
                if(method==='middle'){
                    //对路由进行匹配，要么路径为'/',要么路由为当前请求路径
                    if(path==='/'||path===pathname||pathname.startsWith(path+'/')){
                        handler(req,res,next)//处理对应的handler
                    }else {
                        next()
                    }
                }else {
                    //处理普通路由，并且需要和请求路由一一对应，实在找不到就走all
                    if((m===method||method==='all')&&pathname===path||path==="*"){
                        handler(req,res)
                    }else {
                        next()
                    }
                }
            }
        }
        next();//调用next
    }
    //存放中间件、路由，并形成任务队列，后续会对此数组中的任务进行匹配执行。
    app.routes=[]
    //中间件处理：因为中间件可以传参地址，也可以省略地址，所以对第二个参数做判断，并且标注方法为middle，方便执行时识别
    app.use=function(path,handler){
        if(typeof handler==='undefined'){
            handler=path
            path='/'
        }
        let layer={
            method:'middle',//表示中间件
            path,
            handler
        }
        app.routes.push(layer)
    }
    //all的处理
    app.all=function(path,handler){
        let layer={
            method:'all',
            path,
            handler
        }
        app.routes.push(layer)
    }
    //生成所有http请求方式的方法数组
    http.METHODS.forEach(method=>{
        method=method.toLowerCase()
        //每当有一个app.get/post...就会利用此方法，生成一个layer对象，并且压入数组
        app[method]=function(path,handler){
            let layer={
                method,
                path,
                handler
            }
            app.routes.push(layer)
        }
    })
    //为app添加监听函数
    app.listen=function () {
        //开启一个服务器，并传入监听函数
       let server= http.createServer(app)
        server.listen(...arguments)
    }
    return app
}
