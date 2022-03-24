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

        if(element.achado > 0 && usersEvents.indexOf(GLOBAL_DASH[0]) >-1 && dateSet >= moment().format("YYYY-MM-DD")){
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


getInfoGrapicsBeleza = async () => {

    let dataReference = moment().format("MM-YYYY");

    const productTwo = await database
    .raw("SELECT sys_blz_tratmentTwo, COUNT(sys_blz_tratmentTwo) AS Qtd FROM jcv_jcvpanel.jcv_blz_orders WHERE sys_blz_requestReference = '"+dataReference+"' GROUP BY sys_blz_tratmentTwo HAVING COUNT(sys_blz_tratmentTwo) > 0 ORDER BY COUNT(sys_blz_tratmentTwo) DESC LIMIT 4")
    .then(data => {
        return data[0];
    })

    const productOne = await database
    .raw("SELECT sys_blz_tratmentOne, COUNT(sys_blz_tratmentOne) AS Qtd FROM jcv_jcvpanel.jcv_blz_orders WHERE sys_blz_requestReference = '"+dataReference+"' GROUP BY sys_blz_tratmentOne HAVING COUNT(sys_blz_tratmentOne) > 0 ORDER BY COUNT(sys_blz_tratmentOne) DESC LIMIT 4")
    .then(data => {
        return data[0];
    })

    let arrayConvertOne = {};
    let arrayConvertTwo = {};
    let objCompDados = {}

    productOne.forEach(element => {
        arrayConvertOne[element.sys_blz_tratmentOne.split(' - ')[1]] = element.Qtd
    });
    productTwo.forEach(element => {
        arrayConvertTwo[element.sys_blz_tratmentTwo.split(' - ')[1]] = element.Qtd
    });

    arrayConvertOne['dateBeleza'] = dataReference
    arrayConvertTwo['dateBeleza'] = dataReference

    objCompDados['arrayConvertTwo'] = arrayConvertTwo;
    objCompDados['arrayConvertOne'] = arrayConvertOne;

    //console.log(objCompDados)

    return JSON.stringify(objCompDados)

}

getRequisitorInfo = async () => {
    const getInfoReq = await database
    .raw("SELECT sys_req_userName, COUNT(sys_req_userName) AS Qtd FROM jcv_jcvpanel.jcv_req_orders GROUP BY sys_req_userName HAVING COUNT(sys_req_userName) > 0 ORDER BY COUNT(sys_req_userName) DESC LIMIT 6")
    .then(data => {
        return data[0];
    })

    let arrayConvert = {};
    getInfoReq.forEach(element => {
        arrayConvert[element.sys_req_userName] = element.Qtd
    });

    return JSON.stringify(arrayConvert)
}

getInfoGrapicsCalendar = async () => {

    let dataReference = moment().subtract(1, 'M').format("MM/YYYY");

    const registersCalendar = await database
    .raw("SELECT sys_calendar_roomName,sys_calendar_roomColor, COUNT(sys_calendar_eventRoom) AS Qtd FROM jcv_jcvpanel.jcv_calendar_registers INNER JOIN jcv_calendar_rooms ON jcv_calendar_rooms.sys_calendar_roomId = jcv_calendar_registers.sys_calendar_eventRoom WHERE sys_calendar_eventMonth = '"+dataReference+"' GROUP BY sys_calendar_eventRoom HAVING COUNT(sys_calendar_eventRoom) > 0 ORDER BY COUNT(sys_calendar_eventRoom) DESC LIMIT 6")
    .then(data => {
        return data[0];
    })

    let arrayConvert = {};
    registersCalendar.forEach(element => {
        arrayConvert[element.sys_calendar_roomName] = [element.sys_calendar_roomColor, element.Qtd]
    });

    arrayConvert['dateCalendar'] = dataReference
    return JSON.stringify(arrayConvert)

}

//Pegando todos os usuarios somente nome e imagem
getInfoUserMain = async () => {
    const dataGet = database
    .raw("SELECT jcv_userNamePrimary,jcv_userImageIcon FROM jcv_users WHERE jcv_userEnabled = 1 ORDER BY rand() LIMIT 54")
    //.select("jcv_userNamePrimary","jcv_userImageIcon")
    //.where({jcv_userEnabled: 1})
    //.table("jcv_users")
    //.limit(54)
    .then( data => {return data[0]})
    return dataGet
}

exports.homeInfo = async (req,res)=> {
    
    //Verificando se tem pedidos
    const BLZstatusOrder = await getBLZstatus();
    const REQUISITORstatus = await getREQUISITORstatus();

    //Trade MKT
    const TRADEMKTcount = await getTradeInfo();

    //Pegadando os 3 primeiros eventos
    const CALENDARcount = await getCalendarEvents();

    //Gráficos Beleza
    const arrayConvert = await getInfoGrapicsBeleza();

    //Gráficos Calendário
    const arrayCalendar = await getInfoGrapicsCalendar();

    //Pegando dados requsitor
    const arrayRequsitor = await getRequisitorInfo();
    //console.log(arrayRequsitor)
    //Al users
    const allUserSystem = await getInfoUserMain();

    var page = "home";
    res.render("panel/index", {
        page: page, 
        GLOBAL: GLOBAL_DASH, 
        system_blz_status: BLZstatusOrder, 
        REQUISITORstatus: REQUISITORstatus,
        CALENDARcount: CALENDARcount,
        TRADEMKTcount: TRADEMKTcount,
        arrayConvert: arrayConvert,
        arrayCalendar: arrayCalendar,
        allUserSystem: allUserSystem,
        arrayRequsitor: arrayRequsitor
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