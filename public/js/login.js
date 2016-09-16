$(function() {
    const op_codes = [
        ['1001', 'Linea 1', 'Topolino'],
        ['1002', 'Linea 2', 'Pippo'],
        ['1003', 'Linea 3', 'Paperino'],
    ]
    
    var socket = io(),
        found = false
    
	var $op_cod = $('#op_cod')
	var $log = $('#login')

	$log.on('click', function () {
        for (var i = 0; i < op_codes.length; i++) {
            if ($op_cod.val() == op_codes[i][0]) {
                found = true
                socket.emit('login', op_codes[i])
                $(window).attr('location', 'index.html')
            }   
        }
        
        if (!found)
            alert('Codice operatore non esistente!')
	})

})