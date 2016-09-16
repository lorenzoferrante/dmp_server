$(function() {
    const op_codes = [
        ['1001', 'Linea 1', 'Topolino'],
        ['1002', 'Linea 2', 'Pippo'],
        ['1003', 'Linea 3', 'Paperino'],
    ]
    
    var socket = io.connect()
    
	var $product = $('#product')
    var $quantity = $('#quantity')
	var $operator = $('#operator')
	var $send = $('#send')
    var $log = $('#log')
    var $pop = $('#login_div')
    var $log_btn = $('#login')
    var $log_out = $('#logout')
    var $close = $('#close')
    var $input_cod = $('#opCode')
    
    var timer = 0
    var found = false
    
    function emitNewSearch() {
        socket.emit('new search', $product.val())
    }
    
    $product.on('keyup', function (e) {
        if (timer)
            clearTimeout(timer)
        
        timer = setTimeout(emitNewSearch, 400)
    })
    
    socket.on('desc found', function (data) {
        if (data == '') {
            $('#desc').val('CODICE ERRATO O DESC. NON ESISTENTE')
            $('#desc').css('color', 'red')
            $('#desc').css('font-weight', 'bolder')
        } else {
            $('#desc').val(data)
            $('#desc').css('color', 'green')
            $('#desc').css('font-weight', 'bolder')
        }
    })
    
    $log.on('click', function () {
        if ($log.text() == 'Login') {
            $pop.css('visibility', 'visible')
            var left_attr = ($(window).width() / 2) - ($pop.width() / 2)
            $pop.css('left', left_attr)
            $('#container').hide()
        }
    })
    
    $log_out.on('click', function () {
        socket.emit('logout')
        $log.text('Login')
        $log.css('color', '#F44336')
        $log_out.css('visibility', 'hidden')
        console.log('User logged out!')
    })
    
    $close.on('click', function () {
        $pop.css('visibility', 'hidden')
        $('#container').show()
    })
    
    $log_btn.on('click', function () {
        if ($input_cod.val() != '') {
            for (var i = 0; i < op_codes.length; i++) {
                if ($input_cod.val() == op_codes[i][0]) {
                    found = true
                    socket.emit('login', op_codes[i])
                    $pop.css('visibility', 'hidden')
                    $('#container').show()
                    $log_out.css('visibility', 'visible')
                    var str = 'Sei loggato come ' + op_codes[i][2]
                    $log.text(str)
                    $log.css('color', '#4CAF50')
                }   
            }
        
        if (!found)
            alert('Codice operatore non esistente!')
            
        } else {
            alert('Inserisci un codice valido!')
        }
    })
    
    socket.on('not logged', function () {
        alert('Esegui il login con il COD. operatore!')
    })    

	$send.on('click', function () {
		var product = $product.val()
        var quantity = $quantity.val()
		var operator = $operator.val()
        
        if (product == '' || quantity == '') {
            alert('Hai omesso dei campi!')
        } else if ($('#desc').val() == 'CODICE ERRATO O DESC. NON ESISTENTE') {
            alert('Hai inserito un codice non esistente!')
        } else if (isNaN($quantity.val())) {
            alert('Hai inserito una quantità non valida')
        } else {
            socket.emit('new product', product, quantity, operator)
        }

        $product.val('')
        $quantity.val('')
        $operator.val('')
        $('#desc').val('')
	})

})