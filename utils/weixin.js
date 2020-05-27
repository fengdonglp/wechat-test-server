const axios = require('axios');
const qs = require('qs');
const crypto = require('crypto');
const {
  APP_ID,
  APP_SECRET
} = require('../conf/weixin.json');

let access_token = null;
let jsapi_ticket = null;

exports.createNoncestr = function () {
  const randomArr = [
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
  ];
  let random = '';
  for (let index = 0; index < 16; index++) {
    random += randomArr[parseInt(Math.random() * 62)];
  }
  return random;
}

// 获取微信access_token
exports.getAccessToken = function () {
  if (access_token && access_token.expire > Date.now()) {
    return Promise.resolve(access_token.value);
  }
  return axios.get(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${APP_ID}&secret=${APP_SECRET}`)
    .then(res => {
      if (res.status === 200) {
        access_token = {
          value: res.data.access_token,
          expire: Date.now() + res.data.expires_in * 1000
        }
        return access_token.value;
      } else {
        return Promise.reject(res.data);
      }
    });
}

/**
 * @description jsapi_ticket是公众号用于调用微信JS接口的临时票据
 * @refer https://developers.weixin.qq.com/doc/offiaccount/OA_Web_Apps/JS-SDK.html#62
 * @param {String} accessToken
 * @returns
 */
exports.getTicket = function (accessToken) {
  if (jsapi_ticket && jsapi_ticket.expire > Date.now()) {
    return Promise.resolve(jsapi_ticket.value);
  }
  return axios.get(`https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${accessToken}&type=jsapi`)
    .then(res => {
      if (res.status === 200 && res.data.errcode === 0) {
        jsapi_ticket = {
          value: res.data.ticket,
          expire: Date.now() + res.data.expires_in * 1000
        }
        return jsapi_ticket.value;
      } else {
        return Promise.reject(res.data);
      }
    });
}

/**
 * @description 生成JS-SDK使用权限签名算法
 * @refer 微信官方提供的签名校验工具地址： http://mp.weixin.qq.com/debug/cgi-bin/sandbox?t=jsapisign
 * @param {Object} obj
 * @returns
 */
exports.createSignature = function (obj) {
  // Tip: 签名参数按照微信文档要求必须进行排序，这里在obj里约束顺序
  let signStr = qs.stringify(obj, {
    encode: false
  });

  const signature = crypto.createHash('sha1').update(signStr).digest('hex');

  return signature;
}