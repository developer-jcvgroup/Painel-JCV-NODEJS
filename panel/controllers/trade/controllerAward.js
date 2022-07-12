const database = require("../../database/database");
const moment = require("moment");
moment.tz.setDefault('America/Sao_Paulo');

const uuid = require('uuid')

//Data atual
function generateDate(){
    moment.locale('pt-br');
    return moment().format('LT')+" "+moment().format('L')
}

function generateMonth(){
    moment.locale('pt-br');
    return moment().format('MM-YYYY')
}

exports.moduleAwardNew = async (req,res) => {

    //Pegando os parametros de preenchimento de cada marca
    const getParams = await database
    .select()
    .table("jcv_award_params_brand")
    .then( data => {return data})


    //Pegando as lojas
    let getShop = await database
    .select('jcv_trade_shops_name_fantasy')
    .whereRaw(`JSON_CONTAINS(jcv_trade_shops_manager, '${GLOBAL_DASH[0]}', '$') AND jcv_trade_shops_enabled = 1`)
    //.whereRaw(`jcv_trade_shops_name_fantasy like '%${getSerch[1]}%'`)
    .table("jcv_trade_shops")
    .then( data => {
        return data
    })

    //Pegando as promotoras
    let getPromot = await database
    .select('jcv_userNamePrimary')
    .where({jcv_userManager: GLOBAL_DASH[0]})
    .table("jcv_users")
    .then( data => {
        //console.log(data)
        return data
    })

    letNewArrayData = [];

    /*  */
    /*  */
    /*  */
    if(getPromot != ''){
        getPromot.forEach(element => {
            letNewArrayData.push(`PROMOTORA | ${element.jcv_userNamePrimary}`)
        });
    }
    if(getShop != ''){
        getShop.forEach(element => {
            letNewArrayData.push(`LOJA | ${element.jcv_trade_shops_name_fantasy}`)
        });
    }
    
    /*  */
    /*  */
    /*  */


    var page = "trade/awardNew";
    res.render("panel/index", {
        page: page,
        getParams: getParams,
        letNewArrayData: letNewArrayData
    })
}

exports.moduleSaveAward = async (req,res) => {

    //Convertendo
    function convertArray(getArray){
        let newObject = []
        for (let i = 0; i < getArray.length; i++) {
            let idOf = i;
            newObject.push({
                [getArray[i]]: getArray[idOf + 1]   
            })
            i++
        }
        return newObject
    }

    const getDataFelps = convertArray(req.body['input-values-felps'])
    const getDataRetro = convertArray(req.body['input-values-retro'])
    const getDataAvenca = convertArray(req.body['input-values-avenca'])

    const getMonth = req.body['monthReference']
    const getSerch = req.body['getShopPromot'].split(' | ')

    //console.log(getSerch[1])

    //Validando a informação de loja/representante inserida
    let getShop = await database
    .select('jcv_trade_shops_id')
    .whereRaw(`jcv_trade_shops_name_fantasy like '%${getSerch[1]}%'`)
    .table("jcv_trade_shops")
    .then( data => {
        return data.length != 0 ? data[0].jcv_trade_shops_id : null
    })

    let getPromot = await database
    .select('jcv_id')
    .whereRaw(`jcv_userNamePrimary like '%${getSerch[1]}%'`)
    .table("jcv_users")
    .then( data => {
        //console.log(data)
        return data.length != 0 ? data[0].jcv_id : null
    })

    //console.log(getShop)
    //console.log(getPromot)

    //Validano esta string para fazer validação e inserir no banco da maneira certa!
    let validationFinal = getPromot == null ? getShop == null ? null : [1,getShop] : [2,getPromot] // [1= typo de regsitro (1{loja}/2{representante}), 2=id da loja/reprensentante]

    //Validação final
    if(validationFinal == null){
        //Erro
        res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Erro ao validar loja/promotora","timeMsg": 3000}`);
        res.redirect("/painel/trademkt/award/new");
    }else{

        //Validando se já possui registro desta loja/promotora
        const getvalidation = await database
        .select()
        .where({jcv_award_registers_id_registred: validationFinal[1], jcv_award_registers_type: validationFinal[0]})
        .table("jcv_award_registers")
        .then( data => {return data.length === 0 ? null : 200 })

        //console.log(validationFinal)

        //Validando
        if(getvalidation != null){
            //console.log('errado')
            //Relatorio já relaizado
            res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Relatorio já registrado!","timeMsg": 3000}`);
            res.redirect("/painel/trademkt/award/new");
        }else{
            let arrayData = [
                getDataFelps,
                getDataRetro,
                getDataAvenca
            ]

            //Relatorio ainda não relaizado
            database
            .insert({
                jcv_award_registers_id_registred: validationFinal[1],
                jcv_award_registers_type: validationFinal[0],
                jcv_award_registers_json: JSON.stringify(arrayData),
                jcv_award_registers_created_date: generateDate(),
                jcv_award_registers_month: getMonth,
                jcv_award_registers_id_manager: GLOBAL_DASH[0],
                jcv_award_registers_status: 1,
                jcv_award_registers_uuid: uuid.v1()
            })
            .table("jcv_award_registers")
            .then( data => {
                if(data >= 1){
                    res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "success","message":"Relatório realizado com sucesso","timeMsg": 4000}`);
                    res.redirect("/painel/trademkt/award/new");
                }else{
                    res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Não foi possivel registrar seu relatorio","timeMsg": 4000}`);
                    res.redirect("/painel/trademkt/award/new");
                }
            })
        }
    }

    
    







    //Validando se a PROMOTORA já possui um relatorio cadastrado para este mes
    /* const getvalidationPromot = await database
    .select()
    .where({jcv_award_registers_promot_id: getPromot, jcv_award_registers_shop_id: getShop, jcv_award_registers_month: getMonth})
    .table("jcv_award_registers")
    .then( data => {return data.length === 0 ? null : 200 })

    //Validando se a LOJA já possui um relatorio cadastrado para este mes
    const getvalidationShop = await database
    .select()
    .where({jcv_award_registers_promot_id: null, jcv_award_registers_shop_id: getShop, jcv_award_registers_month: getMonth})
    .table("jcv_award_registers")
    .then( data => {return data.length === 0 ? null : 200 }) */

    /* let arrayData = [
        getDataFelps,
        getDataRetro,
        getDataAvenca
    ]

    //Validando a promotora e a loja
    if(getvalidationPromot == null){
        //Nenhum registro de promotora encontrado

        //Validando a loja somente
        if(getvalidationShop == null){
            //Nehnum regsitro de loja..

            //res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Vamos cadastrar","timeMsg": 3000}`);
            //res.redirect("/painel/trademkt/award/new");
            
        }else{
            //achamos um registro..
            res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Já existe um relatório para esta loja no mês <b>(${getMonth})</b>","timeMsg": 4000}`);
            res.redirect("/painel/trademkt/award/new");
        }
    }else{
        //regsitro encontrado

        if(getvalidationShop != null){
            res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Já existe um relatório para esta loja no mês <b>(${getMonth})</b>","timeMsg": 4000}`);
            res.redirect("/painel/trademkt/award/new");
        }else{
            res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Já existe um relatório para esta promotora no mês <b>(${getMonth})</b>","timeMsg": 4000}`);
            res.redirect("/painel/trademkt/award/new");
        }
        
    } */

    
}

exports.moduleAwardEditBrand = async (req,res) => {
    const idBrand = req.params.id

    const getBrand = await database
    .select()
    .where({jcv_award_params_brand_id: idBrand})
    .table("jcv_award_params_brand")
    .then( data => {return data})

    if(getBrand == ''){
        res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Não foi encontrado dados","timeMsg": 3000}`);
        res.redirect("/painel/trademkt/main");
    }else{
        var page = "trade/awardParams";
        res.render("panel/index", {
            page: page,
            getBrand: getBrand
        })
    }
}
exports.moduleAwardEditBrandSave = async (req,res) => {

    const getData = req.body['award-input-value-json']
    const getIdBrand = req.body['award-input-id-brand']

    if(getData.length <= 2){
        res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "warning","message":"Insira os parametros necessarios","timeMsg": 3000}`);
        res.redirect("/painel/trademkt/award/brand/edit/"+getIdBrand);
    }else{
        database
        .update({
            jcv_award_params_brand_json: getData
        })
        .where({jcv_award_params_brand_id: getIdBrand})
        .table("jcv_award_params_brand")
        .then( data => {
            if(data == 1){
                res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "success","message":"Os parametros foram atualziado com sucesso","timeMsg": 3000}`);
                res.redirect("/painel/trademkt/main");
            }else{
                res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Erro ao atualizar os parametros","timeMsg": 3000}`);
                res.redirect("/painel/trademkt/main");
            }
        })
    }
}

exports.moduleAwardEdit = async (req,res) => {
    const getUUID = req.params.id;

    //Validando se exite
    const getValidation = await database
    .select()
    .where({jcv_award_registers_uuid: getUUID, jcv_award_registers_status: 1})
    .table("jcv_award_registers")
    .then( data => {return data})

    if(getValidation.length === 0){
        //não
        res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Relatório não encontrado ou não disponível para a edição","timeMsg": 4000}`);
        res.redirect("/painel/trademkt/main");
    }else{
        //tem

        let getName;
        //Pegango o nome loja/promotora
        if(getValidation[0].jcv_award_registers_type == 1){
            //Buscar loja
            await database
            .select('jcv_trade_shops_name_fantasy')
            .where({jcv_trade_shops_id: getValidation[0].jcv_award_registers_id_registred})
            .table("jcv_trade_shops")
            .then( data => {getName = data[0].jcv_trade_shops_name_fantasy})
        }else{
            //Buscar Promotora
            await database
            .select('jcv_userNamePrimary')
            .where({jcv_id: getValidation[0].jcv_award_registers_id_registred})
            .table('jcv_users')
            .then(data => {getName = data[0].jcv_userNamePrimary})
        }


        var page = "trade/awardEdit";
        res.render("panel/index", {
            page: page,
            getValidation: getValidation,
            getName: getName
        })
    }
}
exports.moduleAwardEditSave = async (req,res) => {

    const idUUID = req.body['button-save-edit-request'];
    const getName = req.body['nameShow']

    //Convertendo
    function convertArray(getArray){
        let newObject = []
        for (let i = 0; i < getArray.length; i++) {
            let idOf = i;
            newObject.push({
                [getArray[i]]: getArray[idOf + 1]   
            })
            i++
        }
        return newObject
    }

    const getDataFelps = convertArray(req.body['input-values-felps'])
    const getDataRetro = convertArray(req.body['input-values-retro'])
    const getDataAvenca = convertArray(req.body['input-values-avenca'])

    let arrayData = [
        getDataFelps,
        getDataRetro,
        getDataAvenca
    ]

    database
    .update({
        jcv_award_registers_json: JSON.stringify(arrayData),
    })
    .where({jcv_award_registers_uuid: idUUID, jcv_award_registers_status: 1})
    .table("jcv_award_registers")
    .then( data => {
        if( data == 1){
            res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "success","message":"Relátorio <b>${getName}</b> atualizado com sucesso!","timeMsg": 3000}`);
            res.redirect("/painel/trademkt/award/edit/"+idUUID);
        }else{
            res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Erro ao editar o relatorio <b>${getName}</b>","timeMsg": 5000}`);
            res.redirect("/painel/trademkt/award/edit/"+idUUID);
        }
    })
}

exports.awarsList = async (req,res) => {

    //Verificando se o usuario é presentante ou Admin
    const getPerm = await database
    .select('jcv_userCassification','jcv_users_permissions.*')
    .where({jcv_id: GLOBAL_DASH[0]})
    .table('jcv_users')
    .join("jcv_users_permissions","jcv_users_permissions.sys_perm_idUser","jcv_users.jcv_id")
    .then( data => {return data})

    //Pegando as lojas deste usuario
    let convertShops = [];
    let convertRepre;
    if(getPerm[0].sys_tra_premiation_admin == 1){
        //Caso o usuario seja um admin liste todas as lojas
        const getShops = await database
        .select('jcv_trade_shops_id','jcv_trade_shops_name_fantasy')
        .where({jcv_trade_shops_enabled: 1})
        .table("jcv_trade_shops")
        .then (data => {return data})

        getShops.forEach(element => {
            convertShops.push(element.jcv_trade_shops_id +' - '+ element.jcv_trade_shops_name_fantasy)    
        });

        //Pegando todos os representantes
        const getRepre = await database
        .select('jcv_userNamePrimary')
        .where({jcv_userEnabled: 1, jcv_userCassification: 4})
        .table('jcv_users')
        .then( data => {return data})

        convertRepre = getRepre.map(function(value){
            return Object.values(value)[0]
        })
    }else{
        //Usuario é um representante
        const getShopsRep = await database
        .select('jcv_trade_shops_name_fantasy')
        .whereRaw(`JSON_CONTAINS(jcv_trade_shops_manager, '${GLOBAL_DASH[0]}', '$') AND jcv_trade_shops_enabled = 1`)
        .orderBy("jcv_trade_shops_id","DESC")
        .table("jcv_trade_shops")
        .then(data => {return data})

        convertShops = getShopsRep.map(function(value){
            return Object.values(value)[0]
        })

        //console.log(convertShops)
    }

    //console.log(convertShops)
    
    var page = "trade/awardList";
    res.render("panel/index", {
        page: page,
        getPerm: getPerm,
        convertShops: convertShops,
        convertRepre: convertRepre,
        resultSearchDataPremiacao: req.flash('resultSearchDataPremiacao')
    })
}

exports.moduleAwardSearch = async (req,res) => {
    
    const awardRepresentante = async(inputValue) => {
        if(inputValue != undefined){
            let inputFilterConvert = typeof(inputValue) == 'object' ? inputValue : [inputValue]
            
            let search = await database
            .select('jcv_id')
            .whereIn('jcv_userNamePrimary', inputFilterConvert)
            .table("jcv_users")
            .then( data => {
                return data.map(function(value){
                    return Object.values(value)[0]
                })
            })

            return search
        }else{
            return null
        }
    }

    const awardLoja = async(inputValue) => {
        if(inputValue != undefined){
            let inputFilterConvert = typeof(inputValue) == 'object' ? inputValue : [inputValue]

            let convertFilter = [];
            inputFilterConvert.forEach(element => {
                convertFilter.push(parseInt(element.split(' - ')))
            });

            //console.log(inputFilterConvert)
            let search = await database
            .select('jcv_trade_shops_id')
            .whereIn('jcv_trade_shops_id', convertFilter)
            .table("jcv_trade_shops")
            .then( data => {
                //console.log(data)
                return data.map(function(value){
                    return Object.values(value)[0]
                })
            })

            return search
        }else{
            return null
        }
    }



    let resultRepresentante = await awardRepresentante(req.body['sys-filter-name-representante'])//Retorna array [1,2,3,4,5,6]
    let resultShop = await awardLoja(req.body['sys-filter-name-shop'])//Retorna array [1,2,3,4,5,6]

    //console.log(resultRepresentante)
    //console.log(resultShop)
    //console.log('')
    //console.log('')

    //Validando se o represetante ou loja foram inseridos
    //let validationTwoArr = resultRepresentante == null ? resultShop == null ? 

    //Juntando o array de promotoras e lojas
    //console.log(resultRepresentante)
    //console.log(resultShop)

    /* let concatArray;
    if(resultRepresentante != null){
        //tem dados
        
        //Verificando se shops é nulo
        if(resultShop != null){
            //Tem dados
            resultRepresentante.concat(concatArray)
        }else{
            //Não tem dados
            concatArray = resultRepresentante
        }
    }else{
        //não tem dados

        //Verificando se shops é nulo
        if(resultShop != null){
            concatArray = resultShop
        }else{
            //Não tem dados
            concatArray = []
        }
    } */


    let concatArray = resultRepresentante != null ? resultShop != null ? `in (${resultRepresentante.concat(resultShop)})` : `in (${resultRepresentante})` : resultShop != null ? `in (${resultShop})` : 'like "%%"'
    //console.log(concatArray)

    //Mês de referencia (data)
    let convertStringRef = ``;
    const awardReference = req.body['sys-filter-name-reference'];
    if(typeof(awardReference) == 'object'){
        for (let i = 0; i < awardReference.length; i++) {
            convertStringRef+=`"${awardReference[i]}",`
        }
    }else if(typeof(awardReference) == 'undefined'){
        convertStringRef = `"${moment().subtract(1, 'months').format('MM-YYYY')}",`
    }else{
        convertStringRef+=`"${awardReference}",`
    }
    let newConvertRef = `in (${convertStringRef.slice(0, -1)})`;

    const awardStatus = req.body['sys-filter-name-status'] != undefined ? req.body['sys-filter-name-status'] == 0 ? 0 : `in (${req.body['sys-filter-name-status']})` : 'like "%%" '

    //Fazendo a busca pelo regsitro
    const getRegsiterSearch = await database
    .select()
    //.whereRaw(`jcv_award_registers_id_registred ${concatArray} AND jcv_award_registers_type in (1,2) AND jcv_award_registers_id_manager ${awardStatus} AND jcv_award_registers_status ${awardStatus} AND jcv_award_registers_month ${newConvertRef}`)
    .whereRaw(`jcv_award_registers_type in (1,2) AND jcv_award_registers_id_manager ${concatArray} AND jcv_award_registers_status ${awardStatus} AND jcv_award_registers_month ${newConvertRef}`)
    .table("jcv_award_registers")
    .join("jcv_users","jcv_users.jcv_id","jcv_award_registers.jcv_award_registers_id_manager")
    .then( data => {return data})

    let getUsers = {}
    await database
    .select('jcv_userNamePrimary','jcv_id')
    .orderBy('jcv_id','ASC')
    .table("jcv_users")
    .then( data => {
        data.forEach(element => {
            getUsers[element.jcv_id] = element.jcv_userNamePrimary
            //getUsers.push({[element.jcv_id]: element.jcv_userNamePrimary})
        });
    })

    let getShops = {}
    await database
    .select('jcv_trade_shops_id','jcv_trade_shops_name_fantasy')
    .table("jcv_trade_shops")
    .then( data => {
        data.forEach(element => {
            getShops[element.jcv_trade_shops_id] = element.jcv_trade_shops_name_fantasy
            //getShops.push({[element.jcv_trade_shops_id]: element.jcv_trade_shops_name_fantasy})
        });
    })

    //console.log(getUsers)

    //console.log(getRegsiterSearch)
    if(getRegsiterSearch.length === 0){
        res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Nenhum relatorio encontrado","timeMsg": 5000}`);
        res.redirect("/painel/trademkt/award/list");
    }else{
        //console.log(getDataSearch)
        req.flash('resultSearchDataPremiacao', [getRegsiterSearch, getShops, getUsers ])
        res.redirect("/painel/trademkt/award/list");
    }






    //console.log(newConvertRef)

    //Convert string das lojas
    /* let convertStringShop = ``;
    let newConvertStringShop = '';
    //console.log(resultShop)
    if(resultShop != null){  
        resultShop.forEach(element => {
            convertStringShop+=`"LOJA_${element}",`
        });
        newConvertStringShop = `JSON_CONTAINS(jcv_award_registers_shop_promot, '${convertStringShop.slice(0,-1)}', '$') AND`
    } */


    
    

    //const awardReference = req.body['sys-filter-name-reference'] != undefined ? `in (${req.body['sys-filter-name-reference']})` : 'like "%%" '
    //req.body['sys-filter-name-reference'].length === 0 ? 'like "%%" ' : req.body['sys-filter-name-reference']
    //const awardStatus = req.body['sys-filter-name-status'] != undefined ? req.body['sys-filter-name-status'] == 0 ? 0 : `in (${req.body['sys-filter-name-status']})` : 'like "%%" '
    //typeof(req.body['sys-filter-name-status']) == 'object' ? req.body['sys-filter-name-status'].length === 0 ? 'like "%%" ' : req.body['sys-filter-name-status'] : [req.body['sys-filter-name-status']]

    //Valida caso a busca seja por NÃO PREECHIDOS
    if(awardStatus == 0){
        //Fazer busca por não preenchidos
        //Base da pesquisa: REPRESENTANTE e MES


        /* const getResultStat = await database
        .select()
        .select("jcv_award_registers.*","jcv_users.jcv_userNamePrimary")
        .where(`jcv_award_registers_id_manager ${resultRepresentante} AND jcv_award_registers_month ${newConvertRef}`)
        .table("jcv_award_registers")
        .join("jcv_users","jcv_users.jcv_id","jcv_award_registers.jcv_award_registers_id_manager")
        .then( data => {return data})
        
        if(getResultStat.length === 0){
            res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Nenhum relatorio encontrado","timeMsg": 5000}`);
            res.redirect("/painel/trademkt/award/list");
        }else{
            //console.log(getDataSearch)
            req.flash('resultSearchDataPremiacao', getDataSearch)
            res.redirect("/painel/trademkt/award/list");
        } */

    }else{
        //jcv_award_registers_id_manager = gestor
        //jcv_award_registers_shop_id = loja
        //jcv_award_registers_promot_id = promotora
        //jcv_award_registers_month = mes
        //jcv_award_registers_status = status


        //Buscando os dados
        /* const getDataSearch = await database
        .select("jcv_award_registers.*","jcv_users.jcv_userNamePrimary")
        .whereRaw(` ${newConvertStringShop} jcv_award_registers_id_manager ${resultRepresentante} AND jcv_award_registers_status ${awardStatus} AND jcv_award_registers_month ${newConvertRef} `)
        .table("jcv_award_registers")
        .join("jcv_users","jcv_users.jcv_id","jcv_award_registers.jcv_award_registers_id_manager")
        .then( data => {return data})

        if(getDataSearch.length === 0){
            res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Nenhum relatorio encontrado","timeMsg": 5000}`);
            res.redirect("/painel/trademkt/award/list");
        }else{
            //console.log(getDataSearch)
            req.flash('resultSearchDataPremiacao', getDataSearch)
            res.redirect("/painel/trademkt/award/list");
        } */
    }


    

}

exports.moduleActions = async (req,res) => {
    const typeAction = req.body['command-actions']
    const listIds = req.body['id-order-input']

    if(typeAction == 'CMD01'){
        //Exportar dados
        exportsData(req,res,listIds)

    }else if(typeAction == 'CMD03'){
        //Exportar parametros dos registros
        exportsParams(req,res,listIds)
    }else if(typeAction == 'CMD02'){
        //Status FECHADO

    }
}

async function exportsData(req,res,listIds){

    const xl = require('excel4node');
    const wb = new xl.Workbook();
    const ws = wb.addWorksheet('Worksheet Name');

    //Pegando todas os registros cadastrados como LOJA
    const getRegistersShops = await database
    .select('jcv_award_registers.*','jcv_trade_shops.jcv_trade_shops_name_fantasy')
    .whereRaw(`jcv_award_registers_type = 1 AND jcv_award_registers_id in (${listIds})`)
    .table("jcv_award_registers")
    .join("jcv_trade_shops","jcv_trade_shops.jcv_trade_shops_id","jcv_award_registers.jcv_award_registers_id_registred")
    .then(data => {return data})

    //Pegando todas os registros cadastrados como PROMOTORAS
    const getRegistersPromotoras = await database
    .select('jcv_award_registers.*','jcv_users.jcv_userNamePrimary')
    .whereRaw(`jcv_award_registers_type = 2 AND jcv_award_registers_id in (${listIds})`)
    .table("jcv_award_registers")
    .join("jcv_users","jcv_users.jcv_id","jcv_award_registers.jcv_award_registers_id_registred")
    .then(data => {return data})

    let newConversionArr = [...getRegistersShops, ...getRegistersPromotoras];


    const headingColumnNames = [
        "ID",
        "Loja/Promotora",
        "Dados",
        "Mês de Ref",
        "Status",
        "Criado",
        "Nome"
    ]
    
    let headingColumnIndex = 1; //diz que começará na primeira linha
    headingColumnNames.forEach(heading => { //passa por todos itens do array
        // cria uma célula do tipo string para cada título
        ws.cell(1, headingColumnIndex++).string(heading);
    });

    console.log(newConversionArr)
    
    let rowIndex = 2;
    newConversionArr.forEach( record => {
        let columnIndex = 1;
        Object.keys(record).forEach(columnName =>{

            //console.log(columnName)
            if(columnName == 'jcv_award_registers_status'){
                let statusGet = {
                    0: 'Não Preenchido',
                    1: 'Preenchido',
                    2: 'Fechados'
                }

                ws.cell(rowIndex,columnIndex++)
                .string(statusGet[record [columnName]])
            }else if(columnName == 'jcv_award_registers_id_manager'){
                //Faça nada
                columnIndex -1
            }else if(columnName == 'jcv_award_registers_id_registred'){
                //Faça nada
                columnIndex -1
            }else if(columnName == 'jcv_award_registers_uuid'){
                //Faça nada
                columnIndex -1
            }
            else if(columnName == 'jcv_award_registers_json'){
                //Converta em string
                let b = JSON.parse(record [columnName])
                let arr = []
                b[0].forEach(element => {
                    arr.push(Object.keys(element).join('') + ': ' + Object.values(element).join(''))
                })
                b[1].forEach(element => {
                    arr.push(Object.keys(element).join('') + ': ' + Object.values(element).join(''))
                })
                b[2].forEach(element => {
                    arr.push(Object.keys(element).join('') + ': ' + Object.values(element).join(''))
                })

                let stringFinal = arr.join(', ')
                ws.cell(rowIndex,columnIndex++)
                .string(stringFinal)

            }else if(columnName == 'jcv_award_registers_type'){
                let statusGet = {
                    1: 'Loja',
                    2: 'Promotor(a)'
                }

                ws.cell(rowIndex,columnIndex++)
                .string(statusGet[record [columnName]])
            }else{
                //Verificando se o dado é numero
                if(typeof(record[columnName]) === 'number'){
                    ws.cell(rowIndex,columnIndex++)
                    .number(record [columnName])
                }else{
                    ws.cell(rowIndex,columnIndex++)
                    .string(record [columnName])
                }
            }

            

            
        });
        rowIndex++;
    });

    //console.log(newConversionArr)

    /* let newArrHeader = []
    let newArrBody = []

    newConversionArr[0].forEach(element => {
        newArrHeader.push(Object.keys(element)[0])
        newArrBody.push(Object.values(element)[0])
        //c+=Object.keys(element) + ': ' + Object.values(element)+ ', '
    })
    newConversionArr[1].forEach(element => {
        newArrHeader.push(Object.keys(element)[0])
        newArrBody.push(Object.values(element)[0])
        //c+=Object.keys(element) + ': ' + Object.values(element)+ ', '
    })
    newConversionArr[2].forEach(element => {
        newArrHeader.push(Object.keys(element)[0])
        newArrBody.push(Object.values(element)[0])
    //c+=Object.keys(element) + ': ' + Object.values(element)
    }) */


    /*  */
    /*  */
    /*  */
    /*  */
    /*  */  
    /*  */
    /*  */
    /*  */
    /*  */
    /*  */
    //Agora fazendo novamente
    /* newArrHeader.forEach(heading => { //passa por todos itens do array
        // cria uma célula do tipo string para cada título
        ws.cell(1, headingColumnIndex++).string(heading);
    });

    newConversionArr.forEach( record => {
        let columnIndex = 1;
        Object.keys(record).forEach(columnName =>{


            //Verificando se o dado é numero
            if(typeof(record[columnName]) === 'number'){
                ws.cell(rowIndex,columnIndex++)
                .number(record [columnName])
            }else{
                ws.cell(rowIndex,columnIndex++)
                .string(record [columnName])
            }

    
        });
        rowIndex++;
    }); */








    const caracteresAleatorios = Math.random().toString(36).substring(5);
    const nameData = 'EXPORT-REL-'+caracteresAleatorios;

    wb.write(nameData+'.xlsx', res)


}

async function exportsParams(req,res,listIds){

    const xl = require('excel4node');
    const wb = new xl.Workbook();
    const ws = wb.addWorksheet('Worksheet Name');

    //Pegando todas os registros cadastrados como LOJA
    const getRegistersShops = await database
    .raw(`
        select c1.*, c3.jcv_trade_shops_name_fantasy, c4.jcv_userNameSecundary from (jcv_award_registers c1)
    
        inner join jcv_trade_shops c3 on c3.jcv_trade_shops_id = c1.jcv_award_registers_id_registred 
        inner join jcv_users c4 on c4.jcv_id = c1.jcv_award_registers_id_manager 
        
        where c1.jcv_award_registers_type = 1 AND c1.jcv_award_registers_id in (${listIds})
    `)
    .then(data => {return data[0]})

    //Pegando todas os registros cadastrados como PROMOTORAS
    const getRegistersPromotoras = await database
    .raw(`
    
        select c1.*, c3.jcv_userNamePrimary, c4.jcv_userNameSecundary from (jcv_award_registers c1)
    
        inner join jcv_users c3 on c3.jcv_id = c1.jcv_award_registers_id_registred 
        inner join jcv_users c4 on c4.jcv_id = c1.jcv_award_registers_id_manager 
        
        where c1.jcv_award_registers_type = 2 AND c1.jcv_award_registers_id in (${listIds})

    `)
    .then(data => {return data[0]})

    let newConversionArr = [...getRegistersShops, ...getRegistersPromotoras];


    const headingColumnNames = [
        "REPRESENTANTE","LOJA/PROMOTORA","MÊS REF.","DADOS"
    ]
    
    let headingColumnIndex = 1; //diz que começará na primeira linha
    headingColumnNames.forEach(heading => { //passa por todos itens do array
        // cria uma célula do tipo string para cada título
        ws.cell(1, headingColumnIndex++).string(heading);
    });

    let newArr =[];
    let rowIndex = 2
    newConversionArr.forEach(element => {
        
        let getJson = JSON.parse(element.jcv_award_registers_json)[0];
        getJson.forEach(elementTwo => {

            let namePrimary = element.jcv_userNamePrimary == null ? element.jcv_trade_shops_name_fantasy : element.jcv_userNamePrimary
            let nameSecundary = element.jcv_userNameSecundary == null ? element.jcv_userNameSecundary : element.jcv_userNameSecundary

            newArr.push([nameSecundary,namePrimary,element.jcv_award_registers_month,Object.keys(elementTwo)[0],Object.values(elementTwo)[0]])

            //console.log(Object.keys(element)[0])
            //console.log(Object.values(element)[0])
        });



        let getJsonTwo = JSON.parse(element.jcv_award_registers_json)[1];
        getJsonTwo.forEach(elementTwo => {

            let namePrimary = element.jcv_userNamePrimary == null ? element.jcv_trade_shops_name_fantasy : element.jcv_userNamePrimary
            let nameSecundary = element.jcv_userNameSecundary == null ? element.jcv_userNameSecundary : element.jcv_userNameSecundary

            newArr.push([nameSecundary,namePrimary,element.jcv_award_registers_month,Object.keys(elementTwo)[0],Object.values(elementTwo)[0]])

            //console.log(Object.keys(element)[0])
            //console.log(Object.values(element)[0])
        });



        let getJsonThree = JSON.parse(element.jcv_award_registers_json)[2];
        getJsonThree.forEach(elementTwo => {

            let namePrimary = element.jcv_userNamePrimary == null ? element.jcv_trade_shops_name_fantasy : element.jcv_userNamePrimary
            let nameSecundary = element.jcv_userNameSecundary == null ? element.jcv_userNameSecundary : element.jcv_userNameSecundary

            newArr.push([nameSecundary,namePrimary,element.jcv_award_registers_month,Object.keys(elementTwo)[0],Object.values(elementTwo)[0]])

            //console.log(Object.keys(element)[0])
            //console.log(Object.values(element)[0])
        });
    });


    newArr.forEach( record => {
        let columnIndex = 1;
        Object.keys(record).forEach(columnName =>{


            //Verificando se o dado é numero
            if(typeof(record[columnName]) === 'number'){
                ws.cell(rowIndex,columnIndex++)
                .number(record [columnName])
            }else{
                ws.cell(rowIndex,columnIndex++)
                .string(record [columnName])
            }

    
        });
        rowIndex++;
    });

    //console.log(newConversionArr)

    /* let newArrHeader = []
    let newArrBody = []

    newConversionArr[0].forEach(element => {
        newArrHeader.push(Object.keys(element)[0])
        newArrBody.push(Object.values(element)[0])
        //c+=Object.keys(element) + ': ' + Object.values(element)+ ', '
    })
    newConversionArr[1].forEach(element => {
        newArrHeader.push(Object.keys(element)[0])
        newArrBody.push(Object.values(element)[0])
        //c+=Object.keys(element) + ': ' + Object.values(element)+ ', '
    })
    newConversionArr[2].forEach(element => {
        newArrHeader.push(Object.keys(element)[0])
        newArrBody.push(Object.values(element)[0])
    //c+=Object.keys(element) + ': ' + Object.values(element)
    }) */


    /*  */
    /*  */
    /*  */
    /*  */
    /*  */  
    /*  */
    /*  */
    /*  */
    /*  */
    /*  */
    //Agora fazendo novamente
    /* newArrHeader.forEach(heading => { //passa por todos itens do array
        // cria uma célula do tipo string para cada título
        ws.cell(1, headingColumnIndex++).string(heading);
    });

    newConversionArr.forEach( record => {
        let columnIndex = 1;
        Object.keys(record).forEach(columnName =>{


            //Verificando se o dado é numero
            if(typeof(record[columnName]) === 'number'){
                ws.cell(rowIndex,columnIndex++)
                .number(record [columnName])
            }else{
                ws.cell(rowIndex,columnIndex++)
                .string(record [columnName])
            }

    
        });
        rowIndex++;
    }); */








    const caracteresAleatorios = Math.random().toString(36).substring(5);
    const nameData = 'EXPORT-REL-'+caracteresAleatorios;

    wb.write(nameData+'.xlsx', res)


}

exports.moduleDelete = async (req,res) => {
    const getUUID = req.body['btnDeleteOrder'];

    database
    .delete()
    .where({
        jcv_award_registers_uuid: getUUID,
        jcv_award_registers_status: 1
    })
    .table("jcv_award_registers")
    .then( data => {
        if( data == 1){
            res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "success","message":"Relátorio deletado com sucesso!","timeMsg": 3000}`);
            res.redirect("/painel/trademkt/award/list");
        }else{
            res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Erro ao deletar o relatorio","timeMsg": 5000}`);
            res.redirect("/painel/trademkt/award/list");
        }
    })
}