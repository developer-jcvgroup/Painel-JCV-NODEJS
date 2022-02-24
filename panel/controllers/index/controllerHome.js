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

getTradeInfo = async() => {
    //Vendo os formularios de pesquisa que esta pedente para este usuario
    const getFormsReponse = await database
    .select("jcv_trade_form_create_titleForm","jcv_trade_form_create_id","jcv_trade_form_create_usersSet",
    "jcv_trade_form_create_usersGroups","jcv_trade_form_create_usersListResponse","jcv_trade_form_create_expired")
    .where({jcv_trade_form_create_enabled: 1})
    .table("jcv_trade_form_create")
    .then( data => {return data})

    let getFormsResp = []
    getFormsReponse.forEach(element => {
        
        let arrayUsers = element.jcv_trade_form_create_usersSet.split(',')
        let arrayGroups = element.jcv_trade_form_create_usersGroups.split(',')
        let responsesGet = element.jcv_trade_form_create_usersListResponse != null ? element.jcv_trade_form_create_usersListResponse.split(',') : []

        if(arrayUsers.indexOf(''+GLOBAL_DASH[0]) > -1 && responsesGet.indexOf(''+GLOBAL_DASH[0]) == -1){


            getFormsResp.push([element.jcv_trade_form_create_id, element.jcv_trade_form_create_titleForm, element.jcv_trade_form_create_expired])


        }else if(arrayGroups.indexOf('GRP0'+GLOBAL_DASH[12]) > -1 && responsesGet.indexOf(''+GLOBAL_DASH[0]) == -1){


            getFormsResp.push([element.jcv_trade_form_create_id, element.jcv_trade_form_create_titleForm, element.jcv_trade_form_create_expired])


        }else{
            //Faça nada
        }

    });

    return getFormsResp.length;
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

    let count = 0;
    const getFormsReponse = await database
    .raw("SELECT locate("+GLOBAL_DASH[0]+", sys_calendar_eventPersons) achado,sys_calendar_eventDate,sys_calendar_eventPersons FROM jcv_calendar_registers WHERE sys_calendar_eventMonth = '"+moment().format("MM/YYYY")+"'")
    //.select()
    //.whereRaw("jcv_trade_form_create_usersGroups LIKE '%,"+GLOBAL_DASH[12]+"' OR jcv_trade_form_create_usersGroups LIKE '"+GLOBAL_DASH[12]+",%' AND jcv_trade_form_create_usersListResponse IS NULL")
    //.leftJoin("jcv_trade_form_response","jcv_trade_form_create.jcv_trade_form_create_id","jcv_trade_form_response.jcv_trade_form_res_formId")
    //.table("jcv_trade_form_create")
    .then( data => { return data[0]})

    getFormsReponse.forEach(element => {
        let dateSet = moment(element.sys_calendar_eventDate, 'DD/MM/YYYY').format('YYYY-MM-DD');
        //let dateSet = element.sys_calendar_eventDate.split('/')[2]+'-'+element.sys_calendar_eventDate.split('/')[1]+'-'+element.sys_calendar_eventDate.split('/')[0]
        let usersEvents = element.sys_calendar_eventPersons.split(',').map(convertNumber)

        function convertNumber(index){
            return parseInt(index)
        }
        
        if(element.achado > 1 && usersEvents.indexOf(GLOBAL_DASH[0]) && dateSet >= moment().format("YYYY-MM-DD")){
            count++
        }
    });

    
    /* await database
    .select()
    .whereRaw("sys_calendar_eventPersons like '%,"+GLOBAL_DASH[0]+"%' OR sys_calendar_eventPersons like '%"+GLOBAL_DASH[0]+",%' OR sys_calendar_eventUserId = "+GLOBAL_DASH[0])
    .table("jcv_calendar_registers")
    //.limit(3)
    .then( data => {

        data.forEach(element => {
            console.log(moment.sys_calendar_eventDate)
            let date = moment().format("DD/MM/YYYY")
            if(moment(date).isBefore(moment.sys_calendar_eventDate)){
                count++
            }
        });

        return count;
    }) */

    return count;
}

exports.homeInfo = async (req,res)=> {

    //Verificando se tem pedidos

    const BLZstatusOrder = await getBLZstatus();
    const REQUISITORstatus = await getREQUISITORstatus();

    //Trade MKT
    const TRADEMKTcount = await getTradeInfo();

    //Pegadando os 3 primeiros eventos
    const CALENDARcount = await getCalendarEvents();

    
    var page = "home";
    res.render("panel/index", {
        page: page, 
        GLOBAL: GLOBAL_DASH, 
        system_blz_status: BLZstatusOrder, 
        REQUISITORstatus: REQUISITORstatus,
        CALENDARcount: CALENDARcount,
        TRADEMKTcount: TRADEMKTcount
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