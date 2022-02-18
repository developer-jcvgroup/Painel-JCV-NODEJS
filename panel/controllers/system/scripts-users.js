const database = require("../../database/database");
const moment = require("moment");
moment.tz.setDefault('America/Sao_Paulo');


//Esta função executa algo sempre que um usuario foi colocando como desabilitado
exports.alterDataUsers = (idUser) => {


    //Excluindo todos as solicitações com estatus SOLICITADO no programa da beleza
    database
    .update({
        sys_blz_requestStatus: 3
    })
    .where({sys_blz_userId: idUser, sys_blz_requestStatus: 2})
    .table("jcv_blz_orders")
    .then( data => {
        //console.log('ok')
    })

    //Cancelando todas as requisições que o usuario esta com o status SOLICITADO
    database
    .update({
        sys_req_orderStatus: 4
    })
    .where({sys_req_userId: idUser, sys_req_orderStatus: 2})
    .table("jcv_req_orders")
    .then( data => {
        //console.log('ok')
    })
}