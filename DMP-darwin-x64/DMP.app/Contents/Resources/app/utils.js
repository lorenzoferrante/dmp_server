const fs = require('fs')
const readline = require('readline')
const line = require('line-reader')
const S = require('string') 
const csv = require('csv-parser')

exports.test = (a, b) => {
    a = a.slice(1)
    b = b.slice(1)
    
    console.log('[DEBUG]', S(a).toInt(), S(b).toInt())
}

findMinUbi = (ubi1, ubi2) => {
    var ubi1_ = S(ubi1).trim().s
    var ubi2_ = S(ubi2).trim().s
    
    // Se una ubicazione è più lunga di conseguenza la maggiore, quindi ritorno l'altra
    if (S(ubi1_).length > S(ubi2_).length)
        return ubi2 
    else if (S(ubi1_).length < S(ubi2_).length)
        return ubi1
    else if (S(ubi1_).length == S(ubi2_).length) {
        // Se la prima lettera è minore della prima lettera dell'altra, ritorno la prima
        if (ubi1_[0] < ubi2_[0])
            return ubi1
        else if (ubi2_[0] < ubi1_[0])
            return ubi1
        else {
            var a = ubi1_
            var b = ubi2_
            
            // Rimuovo la lettera iniziale dalle due ubicazioni
            ubi1_ = S(ubi1.slice(1)).toInt()
            ubi2_ = S(ubi2.slice(1)).toInt()
            
            if (ubi1_ < ubi2_)
                return ubi2
            else 
                return ubi1
        }
    }
        
    //console.log('[DEBUG]', ubi1[0] < ubi2[0])
}

exports.sortUBI = (data) => {    
    const n = data.length   // Lunghezza dell'array passato
    var new_data = []       // Data ordinata da ritornare
    var min_ubi = 'Z99999'  // Minimo per fare il confronto
    var v_int = []          // Array per vedere se ho già considerato l'elemento
    var index = -1          // Var per memorizzare l'indice del minimo 
    
    for (var i = 0; i < n; i++)
        v_int.push(0)
    
    for (var i = 0; i < n; i++) {
        min_ubi = 'Z999999'
        
        for (var y = 0; y < n; y++) {
            if (v_int[y] == 0) {
                //console.log('[DEBUG] confronto %s - %s => %s', data[y].ubi, min_ubi, findMinUbi(data[y].ubi, min_ubi))
                if (findMinUbi(data[y].ubi, min_ubi) == data[y].ubi) {
                    //console.log('[DEBUG] %s - %s => %s', data[y].ubi, min_ubi, findMinUbi(data[y].ubi, min_ubi))
                    // Ho trovato un nuovo minimo, memorizzo l'indice
                    index = y
                    min_ubi = data[y].ubi
                }
            }
        }
        
        v_int[index] = 1
        //console.log('[DEBUG]', data[index].ubi)
        new_data.push(data[index])
    }
    
    //console.log(new_data)
    return new_data
}

exports.changeEXE = (filename, id_to_change, notExe) => {    
    const rl = readline.createInterface({
        input: fs.createReadStream(filename)
    })
    
    var line_index = -1, 
        comma_count, i,
        id = '',
        new_data = 'ID;PRODOTTO;QUANTITA;UBICAZIONE;DESCRIZIONE;OPERATORE;DATA;DATA_DISP;EXE'
    
    rl.on('line', (line) => {        
        // Setto le variabili
        comma_count = 0
        i = 0
        id = ''
        
        // Leggo una nuova riga
        line_index++
        
        // Processo soltanto dalla seconda riga in poi
        if (line_index > 0) {
            // Cerco l'ID per ogni riga
            while (line[i] != ';') {
                id += line[i]
                i++
            }
            
            comma_count++
            
            // Se ho trovato l'ID cercato vado avanti a leggere la riga
            // per controllare il campo EXE
            if (id == id_to_change) {
                while (comma_count != 9) {
                    if (line[i] == ';')
                        comma_count++
                    i++
                }
                
                line = line.replace('false', 'true')
            }
            new_data += '\n' + line
        }
        
        //console.log(new_data)
    }).on('close', function () {        
        fs.writeFile(filename, new_data, function (err) {
            if (err) throw err
            console.log('New Data:', new_data)
            console.log('%s updated succesfully.', filename)
        })
    })
}