const database = require("../../database/database");
const moment = require("moment");
moment.tz.setDefault('America/Sao_Paulo');

const monthReference = moment().add(1, 'M').format('MM-YYYY');
const bcripty = require("bcryptjs");

getBLZstatus = async () => {
    const status = await database.select("sys_blz_requestStatus","sys_blz_requestReference").where({sys_blz_requestReference: monthReference, sys_blz_userId: GLOBAL_DASH[0]}).orderBy("sys_blz_id","DESC").table("jcv_blz_orders").then(data => {

        if(data != ''){
            return data[0].sys_blz_requestStatus;
        }else{
            return false;
        }

    })
    return status;
}

getREQUISITORstatus = async () => {
    const status = await database.select("sys_req_orderStatus").where({sys_req_userId: GLOBAL_DASH[0]}).orderBy("sys_req_idOne","DESC").table("jcv_req_orders").then(data => {;
        return data;
    })
    
    let arrayResult = []
    for(let i = 0; i < status.length ; i++){
        if(status[i].sys_req_orderStatus != 3){
            arrayResult.push(+1)
        }
    }

    return arrayResult.length >= 1 ? true : false;
}

getCalendarEvents = async () => {

    const getCalendar = await database
    .select()
    .whereRaw("sys_calendar_eventPersons like '%,"+GLOBAL_DASH[0]+"%' OR sys_calendar_eventPersons like '%"+GLOBAL_DASH[0]+",%' OR sys_calendar_eventUserId = "+GLOBAL_DASH[0])
    .table("jcv_calendar_registers")
    .limit(3)
    .then( data => {
        return data;
    })

    return getCalendar;
}

exports.homeInfo = async (req,res)=> {

    //Verificando se tem pedidos

    const BLZstatusOrder = await getBLZstatus();
    const REQUISITORstatus = await getREQUISITORstatus();

    //Pegadando os 3 primeiros eventos
    const CALENDARcount = await getCalendarEvents();

    var page = "home";
    res.render("panel/index", {
        page: page, 
        GLOBAL: GLOBAL_DASH, 
        system_blz_status: BLZstatusOrder, 
        REQUISITORstatus: REQUISITORstatus,
        CALENDARcount: CALENDARcount
    })

    
}

exports.indexSetPass = async (req,res) => {
    const idUser = req.body['button-def-pass'];
    
    const passOne = req.body['passOne']
    const passTwo = req.body['passTwo']

    if(passOne == passTwo){

        let salt = bcripty.genSaltSync(10);
        let passwordHash = bcripty.hashSync(passOne, salt)

        database.update({jcv_userPassword: passwordHash}).where({jcv_id: idUser}).table("jcv_users").then( data => {
            res.cookie('SYS-NOTIFICATION-EXE1', "SYS01|Senha definida com sucesso!");
            res.redirect("/painel/perfil");
        })
    }

    
}