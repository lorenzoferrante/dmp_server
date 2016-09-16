// Setup basic express server
var fs = require('fs')
var utils = require('./utils.js')
var ip = require('ip')
var moment = require('moment')
var csv = require('csv-parser')
var express = require('express')
var app = express()
var server = require('http').createServer(app)
var io = require('socket.io')(server)
var port = process.env.PORT || 3000
var id = 0
var op_cod = ''

// Global vars
global.idx = 0
global.COD = ''
global.UBIC = ''
global.DESC = ''

/* -------------- */

var stream = csv({
  raw: false,     // do not decode to utf-8 strings 
  separator: ';', // specify optional cell separator 
  quote: '"',     // specify optional quote character 
  escape: '"',    // specify optional escape character (defaults to quote value) 
  newline: '\n',  // specify a newline character 
  strict: true    // require column length match headers length 
})

server.listen(port, function () {
  console.log('Server listening at port %d', port)
})

// Routing
app.use(express.static(__dirname + '/public'))
app.get('/login', function (req, res) {
  res.sendFile(__dirname + '/public/login.html')
})
app.get('/tab', function (req, res) {
  res.sendFile(__dirname + '/public/tab.html')
})

// Get data from CSV
function sortUbic(ubi_1, ubi_2) {
    if (ubi_1.length == ubi_2.length) {
        for (var i = 0; i < ubi_1.length; i++) {
            if (ubi_1[i] < ubi_2[i])
                return ubi_1 
        }
        return ubi_2
    } else if (ubi_1.length > ubi_2.length)
        return ubi_2
    else
        return ubi_1
            
}

function findMin(data, v) {
    var n = data.length
    var index = -1
    var min = {
        id: '',
        prod: '',
        qnt: '',
        ubi: 'Z99999',
        desc: '',
        op: '',
        data: '',
        exe: ''
    }    
    
    for (var i = 0; i < n; i++) {
        if (v[i] == 0 && sortUbic(min.ubi, data[i].ubi) == data[i].ubi) {
            min = data[i]
            index = i
        }
    }
    
    v[index] = 1
    return min
}

function sortData(data_to_sort, cpy) {
    var out_data = []
    var n = data_to_sort.length
    var v = []
    
    for (var y = 0; y < n; y++)
        v.push(0)
    
        for (var i = 0; i < n; i++) {
            out_data.push(findMin(data_to_sort, v))
    }
     
    return out_data
}


function loadFromFile(file) {  
  var un_sorted_data = []    
    
  fs.createReadStream(file)
    .pipe(csv({separator: ';'}))
    .on('data', function (data) {
      var data_to_sort = {
          id: data.ID,
          prod: data.PRODOTTO,
          qnt: data.QUANTITA,
          ubi: data.UBICAZIONE,
          desc: data.DESCRIZIONE,
          op: data.OPERATORE,
          data: data.DATA_DISP,
          exe: data.EXE
      }
      un_sorted_data.push(data_to_sort)
    })
    .on('end', function () {  
      var sorted_data = utils.sortUBI(un_sorted_data)
      
      for (var i = 0; i < sorted_data.length; i++)
          io.emit('new element', 
                  sorted_data[i].id,
                  sorted_data[i].prod,
                  sorted_data[i].qnt,
                  sorted_data[i].ubi,
                  sorted_data[i].desc,
                  sorted_data[i].op,
                  sorted_data[i].data,
                  sorted_data[i].exe)

      console.log('Loaded from %s succesfully.', file)
  })
  
}

function searchDB(file, cod, quant, op, idx, exe) {
    var cod, des, ubi
    
  fs.createReadStream(file)
    .pipe(csv({separator: ';'}))
    .on('data', function (data) {      
        if (cod == data.ARCODART) {
            console.log('Ricerca prodotto con COD: %s ...\n', data.ARCODART)
            console.log('COD: %s \nDES: %s \nUBIC: %s', data.ARCODART, data.ARDESART, data.PEARUBIC)
            
            global.COD = data.ARCODART
            global.DESC = data.ARDESART
            global.UBIC = data.PEARUBIC
            
            cod = data.ARCODART
            des = data.ARDESART
            ubi = data.PEARUBIC
        }
    })
    .on('end', function () {
      console.log('[DEBUG] in searchDB:', [cod, des, ubi])
      //return [cod, des, ubi]
      var date_to_file = moment().format('MMMM Do YYYY h:mm:ss a')
    var date_to_display = moment().format('L')
      
      var data_to_append = idx+';'+cod+';'+quant+';'+ubi+';'+des+';'+op_cod+';'+date_to_file+';'+date_to_display+';'+exe+'\n'
        console.log(data_to_append)
        fs.appendFile('data.csv', data_to_append, function (err) {
            if (err) throw err
            loadFromFile('data.csv')
            console.log('Aggiunto al file data.txt')
        })
    })
}

function getLastID(file) {
    fs.createReadStream(file)
      .pipe(csv({separator: ';'}))
      .on('data', function (data) {
        if (data.ID >= idx)
            global.idx = data.ID
      })
      .on('end', function () {
        console.log('IDX: %s', idx)
    })
} 

function searchForDesc(file, cod) {
    var desc = ''
    
    fs.createReadStream(file)
    .pipe(csv({separator: ';'}))
    .on('data', (data) => {      
        if (cod == data.ARCODART) {
            console.log('[DEBUG] Ricerca articolo con cod: %s ...', data.ARCODART)
            console.log('[DEBUG] desc:', data.ARDESART)
            
            desc = data.ARDESART
        }
    })
    .on('end', () => {
        io.emit('desc found', desc)
    })
}

// Socket.io
io.on('connection', function (socket) {    
  // Carico i prodotti da scaricare dal file
  loadFromFile('data.csv')
  
  console.log('User connected with IP Address: %s', ip.address())

  getLastID('data.csv')
  
  socket.on('new product', function (cod, quant, op) { 
    if (op_cod == '') {
        socket.emit('not logged')
    } else {
        var date_to_file = moment().format('MMMM Do YYYY h:mm:ss a')
        var date_to_display = moment().format('L')
        var exe = false

        idx = parseInt(idx) + 1

        // Cerco il prodotto 
        console.log('[DEBUG] after searchDB:', searchDB('dmp_prod.csv', cod, quant, op, idx, exe)) 
    }
  })
  
  socket.on('new checked', function (id) {
      console.log('Remove prod.with id:', id)
      utils.changeEXE('data.csv', id, true)
      //loadFromFile('data.csv')
  })
  
  socket.on('new search', function (data) {
      searchForDesc('dmp_prod.csv', data)
  })
  
  socket.on('login', (op_data) => {
      op_cod = op_data[2] + ', ' + op_data[1]
      console.log('Logged as: %s, %s', op_data[0], op_data[1])
  })
  
  socket.on('logout', () => {
      op_cod = ''
  })
})

