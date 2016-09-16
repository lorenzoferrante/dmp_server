$(function(ready) {    
    var socket = io()
    var $product = $('#req_table tr:last')
    
    $('body').on('change','.executed', function() {
        var $row = $(this).closest('tr')    
        var $text = $row.find('.id').text()
        
        $(this).closest('tr').remove()
        socket.emit('new checked', $text)
    })
    
	socket.on('new element', function (id, cod, quant, ubic, desc, op, date, exe) {
        if (exe == 'false') {
            $product.after('<tr><td class="id">'+id+'<td>'+ubic+'</td><td>'+cod+'</td><td>'+desc+'</td><td>'+quant+'</td><td>'+op+'</td><td>'+date+'</td><td><input type="checkbox" class="executed"></td></tr>')
        }
  	})
})