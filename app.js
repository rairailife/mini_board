const http = require('http');
const fs   = require('fs');
const ejs  = require('ejs');
const url  = require('url');
const qs   = require('querystring');

const index_page = fs.readFileSync('./index.ejs', 'utf-8');
const login_page = fs.readFileSync('./login.ejs', 'utf-8');
const style_css  = fs.readFileSync('./css/style.css', 'utf-8');

const max_num  = 10; // 最大保管数
const filename = 'mydata.txt'; // データファイル名

var message_data; // ★データ
readFromFile(filename);

var server = http.createServer(getFromClient);
server.listen(3000);
console.log('Server start!');
// ここまでメインプログラム================

/**
 * createServerの処理
 * @param {*} request
 * @param {*} response
 */
function getFromClient(request, response) {
  var url_parts = url.parse(request.url, true);

  console.log('url_parts.pathname', url_parts.pathname);
  switch(url_parts.pathname) {
    case '/': // トップページ（掲示板）
      response_index(request, response);
      break;

    case '/login': // ログインページ
    response_login(request, response);
      break;

    case '/css/style.css':
      response.writeHead(200, {'Content-Type': 'text/css'});
      response.write(style_css);
      response.end();
      break;

    default:
      response.writeHead(200, {'Content-Type': 'text/plain'});
      response.write('no page...');
      break;
  }
}

/**
 * loginのアクセス処理
 * @param {*} request
 * @param {*} response
 */
function response_login(request, response) {
  var content = ejs.render(login_page, {});
  response.writeHead(200, {'Content-Type': 'text/html'});
  response.write(content);
  response.end();
}

/**
 * indexのアクセス処理
 * @param {*} request
 * @param {*} response
 */
function response_index(request, response) {
  // POSTアクセス時の処理
  if(request.method === 'POST') {
    var body = '';

    // データ受信のイベント処理
    request.on('data', function(data) {
      body += data;
    });

    // データ受信終了のイベント処理
    request.on('end', function() {
      data = qs.parse(body);
      addToData(data.id, data.msg, filename, request);
      write_index(request, response);
    });

  } else {
    write_index(request, response);
  }
}

/**
 * indexのページ作成
 * @param {*} request
 * @param {*} response
 */
function  write_index(request, response) {
  var msg = '※なにかメッセージを書いてください。';
  var content = ejs.render(index_page, {
    title:    'Index'
    ,content:  msg
    ,data:     message_data
    ,filename: 'data_item'
  });

  response.writeHead(200, {'Content-Type': 'text/html'});
  response.write(content);
  response.end();
}

/**
 * テキストファイルをロード
 * @param {string} fname
 */
function readFromFile(fname) {
  fs.readFile(fname, 'utf8', (err, data) => {
    message_data = data.split('\n');
  })
}

/**
 *  データを更新
 * @param {string} id
 * @param {string} msg
 * @param {string} fname
 * @param {*} request
 */
function addToData(id, msg, fname, request) {
  var obj = { 'id': id, 'msg': msg };
  var obj_str = JSON.stringify(obj);
  console.log('add data', obj_str);
  message_data.unshift(obj_str);
  if(message_data.length > max_num) {
    message_data.pop();
  }

  saveToFile(fname);
}

/**
 *  データを保存
 * @param {string} fname
 */
function saveToFile(fname) {
  var data_str = message_data.join('\n');
  fs.writeFile(fname, data_str, (err) => {
    if(err) { throw err; }
  });
}