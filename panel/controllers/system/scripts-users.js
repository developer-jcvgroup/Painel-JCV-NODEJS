const database = require("../../database/database");
const moment = require("moment");
moment.tz.setDefault('America/Sao_Paulo');


//Esta função executa algo sempre que um usuario foi colocando como desabilitado
exports.alterDataUsers = async (req, res, idUser, userName, userAtivo) => {

    //Validando se o usuario tem colaboradores vinculados
    const getData = await database
    .select('jcv_id')
    .where({jcv_userManager: idUser})
    .table("jcv_users")
    .then(data => {return data})

    if(getData == ''){
        //Excluindo todos as solicitações com estatus SOLICITADO no programa da beleza
        database
        .update({
            sys_blz_requestStatus: 2
        })
        .where({sys_blz_userId: idUser, sys_blz_requestStatus: 1})
        .table("jcv_blz_orders")
        .then( data => {
            //console.log('ok: '+data)
        })

        //Cancelando todas as requisições que o usuario esta com o status SOLICITADO
        database
        .update({
            sys_req_orderStatus: 4
        })
        .where({sys_req_userId: idUser, sys_req_orderStatus: 2})
        .table("jcv_req_orders")
        .then( data => {
            //console.log('ok: '+data)
        })

        //Removendo CPF e EMAIL do registro, por conta LGPD e desabilitando o usuario
        database
        .update({
            jcv_userCpf: null,
            jcv_userEmailCorporate: null,
            jcv_userEmailFolks: null,
            jcv_userCpf: null,
            jcv_userEnabled: userAtivo
        })
        .where({jcv_id: idUser})
        .table("jcv_users")
        .then( data => {
            //console.log('ok: '+data)
        })

        //res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| O usuario '"+userName+"' foi desabilitado(a) com sucesso.");
        res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "success","message":"O usuario <b>${userName}</b> foi desabilitado(a) com sucesso","timeMsg": 3000}`);
        res.redirect("/painel/system/users");
    }else{
        res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "warning","message":"<b>Antes de excluir este usuario você precisa desvincular os colaboradores dele e transferir para outro gestor</b>","timeMsg": 8000}`);
        res.redirect("/painel/system/users/transfer");
    }

    

}