const Koa = require('koa');
const koaBody = require('koa-body');
const router = require('koa-router')();
const app = new Koa();
const staticPath = require('koa-static');
const path = require('path');
const {
  APP_ID,
  request_url
} = require('./conf/weixin.json');

const {
  createNoncestr,
  getAccessToken,
  getTicket,
  createSignature
} = require('./utils/weixin');

router.get(request_url, async (ctx, next) => {
  try {
    const accessToken = await getAccessToken();
    const ticket = await getTicket(accessToken);
    const obj = {
      jsapi_ticket: ticket,
      noncestr: createNoncestr(),
      timestamp: parseInt(Date.now() / 1000), // 注意时间戳到秒
      url: ctx.request.href.replace(/\#.*/, '')
    }
  
    const signature = createSignature(obj);

    ctx.response.body = JSON.stringify({
      success: true,
      data: {
        appId: APP_ID, // 必填，公众号的唯一标识
        timestamp: obj.timestamp, // 必填，生成签名的时间戳
        noncestr: obj.noncestr, // 必填，生成签名的随机串
        signature // 必填，签名
      }
    });
  } catch (error) {
    ctx.response.body = JSON.stringify(error);
  }
  
  await next();
})

app.use(koaBody());

app.use(router.routes());

app.use(staticPath(
  path.join(__dirname, './www')
));

app.listen(8081);