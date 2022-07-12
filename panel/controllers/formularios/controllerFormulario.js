const database = require("../../database/database");
const moment = require("moment");
moment.tz.setDefault('America/Sao_Paulo');

function generateDate(){
    moment.locale('pt-br');
    return moment().format('LT')+" "+moment().format('L')
}

exports.mainPage = async (req,res) => {

    //Listando todos os formulários ATIVOS
    const resultForms = await database
    .select("jcv_formularios_registers.*","jcv_users.jcv_userNamePrimary")
    .where({jcv_formularios_registers_enabled: 1})
    .table("jcv_formularios_registers")
    .join("jcv_users","jcv_users.jcv_id","jcv_formularios_registers.jcv_formularios_registers_userCreated")
    .orderBy("jcv_formularios_registers_id","DESC")
    .then( data => {
        return data
    })

    //console.log(resultForms)

    //Listando os ultimos 30 fomularios finalizados
    const fishedForms = await database
    .select("jcv_formularios_registers.*","jcv_userNamePrimary")
    .where({jcv_formularios_registers_enabled: 0})
    .table("jcv_formularios_registers")
    .join("jcv_users","jcv_users.jcv_id","jcv_formularios_registers.jcv_formularios_registers_userCreated")
    .orderBy("jcv_formularios_registers_id","DESC")
    .then( data => {return data})

    var page = "formularios/mainForm";
    res.render("panel/index", {page: page, resultForms: resultForms, fishedForms: fishedForms})
}

exports.novoFormulario = async (req,res) => {

    //Lista de todos os usuarios TOTAIS
    const allUsersSystem = await database
    .select("jcv_id","jcv_userNamePrimary","sys_unity_name","sys_department_name","jcv_userCassification")
    .where({jcv_userEnabled: 1})
    .table("jcv_users")
    .join("jcv_users_permissions","jcv_users_permissions.sys_perm_idUser","jcv_users.jcv_id")
    .join("jcv_unitys","jcv_unitys.sys_unity_id","jcv_users.jcv_userUnity")
    .join("jcv_departments","jcv_departments.sys_department_id","jcv_users.jcv_userSector")
    .then(data => {return data;})

    //console.log(allUsersSystem)

    var page = "formularios/novoFormulario";
    res.render("panel/index", {page: page, allUsersSystem: allUsersSystem})
}

exports.saveNewForm = async (req,res) => {
    let idsUsers = req.body['array-users-list']
    const titleForm = req.body['form-title-set']
    let expiredForm = req.body['form-set-date-expired']
    const formJson = req.body['button-json-form']

    const formUniqueResponse = req.body['new-form-unique-response'] == 'on' ? 1 : 0;

    if(idsUsers != '' && titleForm != '' && expiredForm != '' && formJson!= ''){
        idsUsers = JSON.stringify(req.body['array-users-list'].split(',').map(convertNumber))

        function convertNumber(value){
            return parseInt(value)
        }

        expiredForm = moment(moment(expiredForm, 'YYYY-MM-DD')).format("DD-MM-YYYY")

        database
        .insert({
            jcv_formularios_registers_title: titleForm,
            jcv_formularios_registers_userCreated: GLOBAL_DASH[0],
            jcv_formularios_registers_jsonForm: formJson,
            jcv_formularios_registers_totalResponse: 0,
            jcv_formularios_registers_createdDate: generateDate(),
            jcv_formularios_registers_expired: expiredForm,
            jcv_formularios_registers_users: idsUsers,
            jcv_formularios_registers_enabled: 1,
            jcv_formularios_registers_usersResponses: '[]',
            jcv_formularios_registers_res_unique: formUniqueResponse
        })
        .table("jcv_formularios_registers")
        .then( data => {
            if(data != ''){

                //console.log(data)

                //Criando a notificação do formulario
                database
                .insert({
                    jcv_notifications_type: 'JCVMOD01',
                    jcv_notifications_usersId: idsUsers,
                    jcv_notifications_users_view: '[]',
                    jcv_notifications_title: titleForm,
                    jcv_notifications_message: 'Um novo formulario de pesquisa foi criado, responda-o. Valido até: <b>'+expiredForm+'</b> ',
                    jcv_notifications_link: '/painel/formularios/reponse/'+data[0],
                    jcv_notifications_created: generateDate(),
                    jcv_notifications_enabled: 1
                })
                .table("jcv_notifications")
                .then( datas => {
                    //Registro confirmado
                    //Redirecionando para a pagina status
                    //res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| <b>"+titleForm+"</b> criado com sucesso!");
                    res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "success","message":"<b>${titleForm}</b> criado com sucesso!","timeMsg": 4000}`);
                    res.redirect("/painel/formularios/main");
                })
            }else{
                //res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| Erro interno ao criar o <b>"+titleForm+"</b>");
                res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Erro interno ao criar o <b>${titleForm}</b>","timeMsg": 4000}`);
                res.redirect("/painel/formularios/novo");
            }
        })
    }else{
        //res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| Dados necessários para a criação inexistentes");
        res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "warning","message":"Dados necessários para a criação inexistentes","timeMsg": 4000}`);
        res.redirect("/painel/formularios/novo");
    }
    
}

exports.editFormulario = async (req,res) => {

    const idForm = req.params['idForm']

    const infoFormulario = await database
    .select()
    .where({jcv_formularios_registers_id: idForm})
    .table("jcv_formularios_registers")
    .then( data => {
        return data
    })

    //Lista de todos os usuarios TOTAIS
    const allUsersSystem = await database
    .select("jcv_id","jcv_userNamePrimary","sys_unity_name","sys_department_name","jcv_userCassification")
    .where({jcv_userEnabled: 1})
    .table("jcv_users")
    .join("jcv_users_permissions","jcv_users_permissions.sys_perm_idUser","jcv_users.jcv_id")
    .join("jcv_unitys","jcv_unitys.sys_unity_id","jcv_users.jcv_userUnity")
    .join("jcv_departments","jcv_departments.sys_department_id","jcv_users.jcv_userSector")
    .then(data => {return data;})


    var page = "formularios/editFormulario";
    res.render("panel/index", {
        page: page, 
        allUsersSystem: allUsersSystem,
        infoFormulario: infoFormulario
    })
}

exports.editFormularioSave = async (req,res) => {
    const idForm = req.body['edit-users-form']

    let idsUsers = req.body['array-users-list']
    const titleForm = req.body['edit-form-title-set']
    let expiredForm = req.body['edit-form-set-date-expired']
    const formJson = req.body['button-json-form']

    const uniqueResponse = req.body['edit-form-unique-response'] == 'on' ? 1 : 0;

    //console.log(idsUsers)
    //console.log(titleForm)
    //console.log(expiredForm)
    //console.log(formJson)

    if(idsUsers != '' && titleForm != '' && expiredForm != '' && formJson!= ''){
        idsUsers = JSON.stringify(req.body['array-users-list'].split(',').map(convertNumber))

        function convertNumber(value){
            return parseInt(value)
        }

        expiredForm = moment(moment(expiredForm, 'YYYY-MM-DD')).format("DD-MM-YYYY")

        database
        .update({
            jcv_formularios_registers_title: titleForm,
            //jcv_formularios_registers_userCreated: GLOBAL_DASH[0],
            jcv_formularios_registers_jsonForm: formJson,
            //jcv_formularios_registers_totalResponse: 0,
            //jcv_formularios_registers_createdDate: generateDate(),
            jcv_formularios_registers_expired: expiredForm,
            jcv_formularios_registers_users: idsUsers,
            //jcv_formularios_registers_enabled: 1
            jcv_formularios_registers_res_unique: uniqueResponse
        })
        .where({jcv_formularios_registers_id: idForm})
        .table("jcv_formularios_registers")
        .then( data => {
            if(data != ''){

                //Adicionando este evento ao painel de notificações
                database
                .insert({
                    jcv_notifications_type: 'JCVMOD01',
                    jcv_notifications_usersId: idsUsers,
                    jcv_notifications_users_view: '[]',
                    jcv_notifications_title: titleForm,
                    jcv_notifications_message: 'O formulário <b>'+titleForm+'</b> foi editado, prazo máximo: '+expiredForm,
                    jcv_notifications_link: '/painel/formularios/reponse/'+idForm,
                    jcv_notifications_created: generateDate(),
                    jcv_notifications_enabled: 1
                })
                .table("jcv_notifications")
                .then( data => {
                    //res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| <b>"+titleForm+"</b> editado com sucesso!");
                    res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "success","message":"<b>${titleForm}</b> editado com sucesso!","timeMsg": 3000}`);
                    res.redirect("/painel/formularios/main");
                })
            }else{
                //res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| Erro interno ao editar o <b>"+titleForm+"</b>");
                res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Erro interno ao editar o <b>${titleForm}</b>","timeMsg": 3000}`);
                res.redirect("/painel/formularios/edit/"+idForm);
            }
        })
    }else{
        //res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| Dados necessários para a criação inexistentes");
        res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "warning","message":"Dados necessários para a criação inexistentes","timeMsg": 3000}`);
        res.redirect("/painel/formularios/edit/"+idForm);
    }
}

exports.responseFormulario = async (req,res) => {
    const idForm = req.params['idForm'];

    const getInfo = await database
    .select()
    .where({jcv_formularios_registers_id: idForm, jcv_formularios_registers_enabled: 1})
    .table("jcv_formularios_registers")
    .then( data => {return data})

    if(getInfo != ''){
        let verifyUniqueResponse;
        if(getInfo[0].jcv_formularios_registers_res_unique == 1){
            verifyUniqueResponse = true;
        }else{
            verifyUniqueResponse = false;
        }
    
        const verifyResponse = await database
        .raw(`SELECT * from jcv_formularios_registers WHERE JSON_CONTAINS(jcv_formularios_registers_users, '${GLOBAL_DASH[0]}', '$') AND NOT JSON_CONTAINS(jcv_formularios_registers_usersResponses, '${GLOBAL_DASH[0]}', '$') AND jcv_formularios_registers_id = ${idForm}`)
        //.raw("SELECT * from jcv_formularios_registers WHERE JSON_CONTAINS(jcv_formularios_registers_usersResponses, '"+GLOBAL_DASH[0]+"', '$') AND jcv_formularios_registers_id = "+idForm)
        .then( data => {return data[0]})
        if(verifyResponse != ''){
            //Resposta encontrada
            if(getInfo != ''){
                var page = "formularios/viewFormulario";
                res.render("panel/index", {
                    page: page, 
                    getInfo: getInfo
                })
            }else{
                //res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| Formulário não encotrado");
                res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Formulário não encontrado","timeMsg": 3000}`);
                res.redirect("/painel");
            }
        }else{
            if(verifyUniqueResponse == false){
                //Resposta unica é falsa: pode enviar o tanto de resposta que quiser
                
                var page = "formularios/viewFormulario";
                res.render("panel/index", {
                    page: page, 
                    getInfo: getInfo
                })
            }else{
                //res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| Formulário já respondido");
                res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Formulário já respondido","timeMsg": 3000}`);
                res.redirect("/painel");
            }
        }
    }else{
        //res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| Formulário não encotrado");
        res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Formulário não encontrado","timeMsg": 3000}`);
        res.redirect("/painel");
    }    
}

exports.responseFormularioButton= async (req,res) => {
    console.log(req.body['button-redirect-page'])
    res.redirect('/painel/formularios/reponse/'+req.body['button-redirect-page'])
}

exports.sendResponse = async (req,res) => {
    const idForm = req.body['view-form-send-form']
    const responseForm = req.body['view-form-response-response-text']
    const titleForm = req.body['view-form-response-response-title']

    if(responseForm == ''){
        //res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Insira alguma resposta!");
        res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "warning","message":"Insira alguma resposta!","timeMsg": 3000}`);
        res.redirect("/painel/formularios/reponse/"+idForm);
    }else{
        await database
        .insert({
            jcv_formularios_responses_idForm: idForm,
            jcv_formularios_responses_userResponse: GLOBAL_DASH[0],
            jcv_formularios_responses_jsonForm: responseForm,
            jcv_formularios_responses_responseDate: generateDate()
        })
        .table("jcv_formularios_responses")
        .then( data => {
            if(data != ''){

                //Pegando o formulario e adicionado o usuario
                database.select().where({jcv_formularios_registers_id: idForm}).table("jcv_formularios_registers").then( getForm => {
                    //console.log(getForm)

                    let arrayNew = [];
                    if(getForm[0].jcv_formularios_registers_usersResponses != '[]'){
                        let convertArray = JSON.parse(getForm[0].jcv_formularios_registers_usersResponses).map(convertNumber)

                        function convertNumber(value){
                            return parseInt(value)
                        }

                        convertArray.push(GLOBAL_DASH[0])

                        arrayNew = convertArray
                    }else{
                        arrayNew.push(GLOBAL_DASH[0])
                    }

                    let responsesCount = getForm[0].jcv_formularios_registers_totalResponse + 1;
                    //Adicionando o usuario
                    database
                    .update({
                        jcv_formularios_registers_usersResponses: JSON.stringify(arrayNew),
                        jcv_formularios_registers_totalResponse: responsesCount
                    })
                    .where({jcv_formularios_registers_id: idForm})
                    .table("jcv_formularios_registers")
                    .then( data => {
                        //res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| <b>"+titleForm+"</b> respondido com sucesso!");
                        res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "success","message":"<b>${titleForm}</b> respondido com sucesso!","timeMsg": 3000}`);
                        res.redirect("/painel");
                    })
                })

            }else{
                //res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| Erro interno ao responder o formulário <b>"+titleForm+"</b>");
                res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Erro interno ao responder o formulário <b>${titleForm}</b>","timeMsg": 3000}`);
                res.redirect("/painel/formularios/main");
            }
        })
    }
}

exports.removeResponses = async (req,res) => {
    const idForm = req.body['button-delete-responses-form']

    //Atualizando as informações do formulário
    database
    .update({
        jcv_formularios_registers_totalResponse: 0,
        jcv_formularios_registers_usersResponses: '[]'
    })
    .where({jcv_formularios_registers_id: idForm})
    .table("jcv_formularios_registers")
    .then( data => {
        //ok
    })

    database
    .delete()
    .where({jcv_formularios_responses_idForm: idForm})
    .table("jcv_formularios_responses")
    .then( data => {
        //console.log(data)
        if(data > 1){
            //res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| Foram excluídas <b>"+data.length+"</b> destes formulário");
            res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "success","message":"Foram excluídas <b>${data.length}</b> destes formulário","timeMsg": 3000}`);
            res.redirect("/painel/formularios/main");
        }else{
            //res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| Erro ao excluir as respostas");
            res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Foram excluídas <b>${data.length}</b> destes formulário","timeMsg": 3000}`);
            res.redirect("/painel/formularios/main");
        }
    })
}

exports.deleteFormulario = async (req,res) => {
    const idForm = req.body['button-delete-form']

    //Atualizando as informações do formulário
    database
    .delete()
    .where({jcv_formularios_responses_idForm: idForm})
    .table("jcv_formularios_responses")
    .then( data => {
        //ok
    })

    database
    .delete()
    .where({jcv_formularios_registers_id: idForm})
    .table("jcv_formularios_registers")
    .then( data => {
        if(data != 0){
            //res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| Formulário foi excluido com sucesso");
            res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "success","message":"Formulário foi excluido com sucesso!","timeMsg": 3000}`);
            res.redirect("/painel/formularios/main");
        }else{
            //res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| Erro ao excluir o formulário");
            res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Erro ao excluir o formulário","timeMsg": 3000}`);
            res.redirect("/painel/formularios/main");
        }
    })
}

exports.exportResponses = async (req,res) => {
    const idForm = req.body['button-exports-responses-form']

    //Importando os dados para gerar excel
    const xl = require('excel4node');
    const wb = new xl.Workbook();
    const ws = wb.addWorksheet('Worksheet Name');

    //Exportando..
    const dataExport = await database
    .select("jcv_formularios_responses_idForm","jcv_formularios_registers_title","jcv_userNamePrimary","jcv_formularios_registers_expired","jcv_formularios_responses_jsonForm")
    .where({jcv_formularios_responses_idForm: idForm})
    .table("jcv_formularios_responses")
    .join("jcv_formularios_registers","jcv_formularios_registers.jcv_formularios_registers_id","jcv_formularios_responses.jcv_formularios_responses_idForm")
    .join("jcv_users","jcv_users.jcv_id","jcv_formularios_responses.jcv_formularios_responses_userResponse")
    .then( data => {
        return data
    })

    if(dataExport != ''){
        //Criando os titulo das colunas da planilha
        const headingColumnNames = [
            "ID",
            "Titulo",
            "Respondido por",
            "Expira"
        ]

        //Configurando a planilha
        let headingColumnIndex = 1; //diz que começará na primeira linha
        headingColumnNames.forEach(heading => { //passa por todos itens do array
            // cria uma célula do tipo string para cada título
            ws.cell(1, headingColumnIndex++).string(heading);
        });

        //Pegando todos os title para adicionar no excel
        let test = dataExport[0].jcv_formularios_responses_jsonForm
        let tt = JSON.parse(test);

        tt.forEach(elementTo => {
            if(elementTo.type == 'header' || elementTo.type == 'paragraph'){
                //Removendo umas iformações para não aparecer na planilha
                //ex.: header eu quero remover do cabeçalho da plahilha, paragrafo tambem
            }else{
                ws.cell(1, headingColumnIndex++ ).string(elementTo.label);
            }
        });

        //Quando começa a inserir os itens na planilha
        let rowIndex = 2;
        dataExport.forEach( record => {

            let columnIndex = 1;
            Object.keys(record).forEach(columnName =>{

                if([columnName] == 'jcv_formularios_responses_jsonForm'){

                    let arrayJSON = JSON.parse(record[columnName]);
                    
                    arrayJSON.forEach(elementTo => {

                        //console.log(elementTo)

                        //ws.cell(1, headingColumnIndex++ ).string(elementTo.label);
                        
                        if(elementTo.type == 'checkbox-group' || elementTo.type == 'radio-group' || elementTo.type == 'select'){
                
                            //console.log('Pergunta: '+element.label+'. Resposta: '+resp)
                        
                            let response = typeof(elementTo.userData) == 'undefined' ? 'Não definido' : `${elementTo.userData}`
                            //textResponse+=`${elementTo.label}? . R: ${response}. `

                            //ws.cell(1, headingColumnIndex++ ).string(elementTo.label);
                            ws.cell(rowIndex,columnIndex++)
                            .string(response)

                        }else if(elementTo.type == 'textarea'){

                            let response = elementTo.userData[0] == '' ? 'Não definido' : `${elementTo.userData[0]}`
                            //textResponse+=`${elementTo.label}? . R: ${response}. `

                            //ws.cell(1, headingColumnIndex++ ).string(elementTo.label);
                            ws.cell(rowIndex,columnIndex++)
                            .string(response)
                            
                            //console.log('Pergunta: '+element.label+'. Resposta: '+element.userData)
                        }else if(elementTo.type == 'number'){
                        
                            let response = typeof(elementTo.userData) == 'undefined' ? 'Não definido' : `${elementTo.userData}`
                            //textResponse+=`${elementTo.label}? . R: ${response}. `

                            //ws.cell(1, headingColumnIndex++ ).string(elementTo.label);
                            ws.cell(rowIndex,columnIndex++)
                            .string(response)
                            
                            //console.log('Pergunta: '+element.label+'. Resposta: '+element.userData)
                        }else if(elementTo.type == 'autocomplete'){
                            
                            let response = typeof(elementTo.userData) == 'undefined' ? 'Não definido' : `${elementTo.userData}`
                            //textResponse+=`${elementTo.label}? . R: ${response}. `

                            //ws.cell(1, headingColumnIndex++ ).string(elementTo.label);
                            ws.cell(rowIndex,columnIndex++)
                            .string(response)
                        
                            //console.log('Pergunta: '+element.label+'. Resposta: '+element.userData)
                        }

                    })



                }else{

                    //Verificando se o dado é numero
                    if(typeof(record[columnName]) === 'number'){

                        //Convertendo o id do pedido para string
                        record[columnName] = ""+record[columnName]+"";

                        ws.cell(rowIndex,columnIndex++)
                        .string(record [columnName])
                    }else{
                        ws.cell(rowIndex,columnIndex++)
                        .string(record [columnName])
                    }


                }
                


            });
            rowIndex++;
        }); 

        //Gerando caracteres aleatorios e exportando a requisição
        const caracteresAleatorios = Math.random().toString(36).substring(5);
        const nameData = 'EXPORT-FORM-PESQUISA-'+caracteresAleatorios;

        wb.write(nameData+'.xlsx', res);//o res faz o download
    }else{
        //res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| Nenhuma resposta encontrada");
        res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Nenhuma resposta encontrada","timeMsg": 3000}`);
        res.redirect("/painel/formularios/main");
    }    
}

exports.disabledForm = async (req,res) => {
    const idForm = req.body['button-disabled-form']

    database
    .update({
        jcv_formularios_registers_enabled: 0
    })
    .where({jcv_formularios_registers_id: idForm})
    .table("jcv_formularios_registers")
    .then( data => {
        if(data != 0){
            //res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| Formulário desabilitado com sucesso");
            res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "success","message":"Formulário desabilitado com sucesso","timeMsg": 3000}`);
            res.redirect("/painel/formularios/main");
        }else{
            //res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| Erro ao desabilitar o formulário");
            res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Erro ao desabilitar o formulário","timeMsg": 3000}`);
            res.redirect("/painel/formularios/main");
        }
    })
}