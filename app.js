const express = require('express')
const app = express()
const server = require('http').Server(app)
var io = require('socket.io')(server)
var port = 3000

app.use(express.static(__dirname + '/public'))

server.listen(port, () => {
	console.log('App listening on http://localhost:%s', port)
})
