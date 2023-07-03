export function createHTMLTable(table) {
    let string = '<table style="width:100%; border:1px solid; padding-bottom:10px;">';
    for ( let i = 0; i < table.length; i++){
        string += '<tr>';
        for (let j = 0; j < table[0].length; j++){
            if (i === 0 || j === 0){
                string += '<td style="background-color:#cbc3e3; padding-left:2px;">';
                string += '<span style="font-size: 20px;">';
                if (!table[i][j]){
                    string += '<b>' + '' + '</b>';
                } else {
                    string += '<b>' + table[i][j] + '</b>';
                }
                string += '</span></td>';
            } else {
                string += '<td>';
                string += table[i][j];
                string += '</td>';
            }
        }
    }
    string += '</table></div>';
    return string;
}

