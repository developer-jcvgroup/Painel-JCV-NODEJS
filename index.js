const express = require("express");
const app = express();
const http = require('http').createServer(app);

const io = require('socket.io')(http, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      allowedHeaders: ["my-custom-header"],
      credentials: true
    }
  })

const database = require("./panel/database/database");
const databaseCertificates = require("./panel/database/databaseCertificates");

const session = require("express-session");
const cookieParser = require('cookie-parser');
const flash = require("connect-flash");

app.set("view engine", "ejs");

const systemCalendarEvents = require('./system/scriptsSystemAll')

// Static
app.use(express.static("public"));

app.use(express.urlencoded({extended: false, parameterLimit: 1000000, limit: '50mb'})); //Pegar dados dos forms ou Rotas
app.use(express.json({limit: '50mb'})); //Aceitar json
app.use(cookieParser())

//app.set('socketio', io);

app.use(flash());

io.on('connection', (socket) => {

    socket.on("getNotificationsAll", (data) => {
        
        //Ao inserir as notif colocar o campo view: []
        //Pegando as notificações
        database
        .raw("SELECT * from jcv_notifications WHERE JSON_CONTAINS(jcv_notifications_usersId, '"+data+"', '$') AND NOT JSON_CONTAINS(jcv_notifications_users_view, '"+data+"', '$')")
        //.select()
        //.where({jcv_notifications_usersId: data, jcv_notifications_users_view: null})
        //.table("jcv_notifications")
        .then( dataAll => {
            //console.log(dataAll[0])

            //console.log(dataAll)
            socket.emit("reponseNotificationsAll", dataAll[0])
        
        })
    })

    socket.on("getNotificationsAllCount", (data) => {
        
        //Pegando as notificações
        database
        .raw("SELECT * from jcv_notifications WHERE JSON_CONTAINS(jcv_notifications_usersId, '"+data+"', '$') AND NOT JSON_CONTAINS(jcv_notifications_users_view, '"+data+"', '$') ORDER BY jcv_notifications_id DESC")
        //.select()
        //.where({jcv_notifications_usersId: data, jcv_notifications_users_view: null})
        //.table("jcv_notifications")
        .then( dataAll => {
            //console.log(dataAll.data)
            socket.emit("reponseNotificationsAllCount", dataAll[0])
        
        })
    })

    socket.on('okayNotifications', (data) => {

        let dataSend = data.dataGet;
        let idUser = data.idUser

        if(dataSend != ''){
            
            dataSend.forEach(element => {

                let arrayDB = JSON.parse(element.jcv_notifications_users_view).map(convertString)

                function convertString (value){
                    return parseInt(value)
                }

                arrayDB.push(parseInt(idUser))

                //console.log(arrayDB)

                database
                .update({jcv_notifications_users_view: JSON.stringify(arrayDB)})
                .where({jcv_notifications_id: element.jcv_notifications_id})
                .table("jcv_notifications")
                .then( data => {
                    //console.log('ok')
                })

                //console.log(element)
                //newArrId.push(element.jcv_notifications_id)
            });

            /* database
            .raw("UPDATE jcv_notifications SET jcv_notifications_users_view = CONCAT(COALESCE(jcv_notifications_users_view,''), '"+idUserNot+"') WHERE jcv_notifications_id IN ("+newArrId+")")
            //.update({jcv_notifications_users_view: 1})
            //.whereIn("jcv_notifications_id", newArrId)
            //.table("jcv_notifications")
            .then( dataAll => {
                //Okay
                //console.log(dataAll)
            }) */
        }

    })

    socket.on("getInfoUserSystem", (data) => {

        database.raw(`

        SELECT c1.*, c2.jcv_userNameSecundary, j1.*, j2.*, j3.*
        FROM (jcv_users c1, jcv_users c2)

        JOIN jcv_unitys j1 ON c1.jcv_userUnity = j1.sys_unity_id
        JOIN jcv_users_permissions j2 ON c1.jcv_id = j2.sys_perm_idUser
        JOIN jcv_departments j3 ON c1.jcv_userSector = j3.sys_department_id

        WHERE c1.jcv_id = ${data} AND c1.jcv_userManager = c2.jcv_id ORDER BY c1.jcv_userEnabled DESC
        
        `).then( dataQuery => {


            //Listando todos os gestores e representantes
            database.select().whereIn('jcv_userCassification', [1,2,4]).table("jcv_users").then( allManager => {
                
                //Listando todas as unidades
                database.select().where({sys_unity_enabled: 1}).table("jcv_unitys").then( allUnitys => {
                    
                    //Listando todos os departamentos
                    database.select().where({sys_department_enabled: 1}).table("jcv_departments").then( allDepto => {
                        
                        socket.emit("sendInfoUserSystem", {dataQuery: dataQuery[0], allDepto: allDepto, allUnitys: allUnitys, allManager: allManager})

                    })

                })

            })
        })

    })

    socket.on("getInfoNewUserSystem", () => {
        //Listando todos os gestores e representantes
        database.select().whereIn('jcv_userCassification', [1,2,4]).table("jcv_users").then( allManager => {
                
            //Listando todas as unidades
            database.select().where({sys_unity_enabled: 1}).table("jcv_unitys").then( allUnitys => {
                
                //Listando todos os departamentos
                database.select().where({sys_department_enabled: 1}).table("jcv_departments").then( allDepto => {

                    socket.emit("sendInfoUserNewSystem", {allDepto: allDepto, allUnitys: allUnitys, allManager: allManager})

                })

            })

        })
    })

    socket.on("getInfoUserTrade", (data) => {

        database
        .select()
        .whereRaw("jcv_trade_shops_cnpj LIKE '%"+data.cnpjShop+"%' OR jcv_trade_shops_name_social LIKE '%"+data.nameShop+"%' ")
        .table("jcv_trade_shops")
        .then( data => {

            let dataResultSet = null;
            if(data[0] != ''){

                let arrayUser = data[0].jcv_trade_shops_users != null ? data[0].jcv_trade_shops_users.split(',') : null

                if(arrayUser != null){

                    database
                    .select("jcv_userNamePrimary","jcv_userCassification")
                    .whereIn('jcv_id', arrayUser)
                    .table("jcv_users")
                    .then( dataResult => {

                        dataResultSet = dataResult != '' ? dataResult : null

                        socket.emit("getInfoUserTradeAll", dataResultSet)

                    })

                }else{
                    //Usuario não encontrado
                    socket.emit("getInfoUserTradeAll", dataResultSet)
                }

            }else{
                //Loja não encotrada
                socket.emit("getInfoUserTradeAll", dataResultSet)
            }

        })

    })

    socket.on("getFormsSystemStatus", (data) => {

        //Pegando todos os formularios em aberto
        database
        .raw("SELECT jcv_formularios_registers_title,jcv_userNamePrimary,jcv_formularios_registers_expired,jcv_formularios_registers_id from jcv_formularios_registers JOIN jcv_users ON jcv_users.jcv_id = jcv_formularios_registers.jcv_formularios_registers_userCreated WHERE JSON_CONTAINS(jcv_formularios_registers_users, '"+data+"', '$') AND NOT JSON_CONTAINS(jcv_formularios_registers_usersResponses, '"+data+"', '$') AND jcv_formularios_registers_enabled = 1 ORDER BY jcv_formularios_registers_id DESC LIMIT 1")
        //.select()
        //.where({jcv_notifications_usersId: data, jcv_notifications_users_view: null})
        //.table("jcv_notifications")
        .then( dataAll => {

            socket.emit("reponseFormsStatus", dataAll[0])
        
        })
    })

    socket.on("getInfoShopEdit", (data) => {
        database
        .select()
        .where({jcv_trade_shops_id: data})
        .table("jcv_trade_shops")
        .then( data => { 

            //Pegando todos os representantes
            database
            .select('jcv_userNamePrimary','jcv_id')
            .where({jcv_userEnabled: 1, jcv_userCassification: 4})
            .table("jcv_users")
            .then( dataRepre => {
                //Pegando o representante desta loja

                const searchIndex = dataRepre.findIndex((valueGet) => valueGet.jcv_id==data[0].jcv_trade_shops_manager);
                let userManager = typeof(dataRepre[searchIndex]) == 'undefined' ? '' : dataRepre[searchIndex].jcv_userNamePrimary

                //let userManager = b;//Object.keys(object).find(key => object[key] === value)
                //Object.values(dataRepre[0]).indexOf(data[0].jcv_trade_shops_manager) == -1 ? '' : Object.values(dataRepre[0]).indexOf(data[0].jcv_trade_shops_manager)

                socket.emit("getInfoShopEditResult", ([data, dataRepre, userManager]))   
            })
        })
    })

    socket.on("getInfoUserProfile", (dataGet) => {
        let arrayData = false;
        database.select().where({jcv_id: dataGet}).table("jcv_users").then(data => {

            var userName = data[0]["jcv_userNamePrimary"].split(' ')[0] + " " + data[0]["jcv_userNamePrimary"].split(' ')[1];
            data.push(userName);
    
            arrayData = data;
            socket.emit('getInfoUserProfileResult', arrayData)
    
        }).catch(err => {
            socket.emit('getInfoUserProfileResult', arrayData)
        })
    })

    //Socket para iniciar curso
    socket.on("getInfoUserCourse", (data) => {

        //Valor a ser procurado
        let valueSearch = data;

        databaseCertificates
        .select()
        .whereRaw(`jcv_users_cpf like '${valueSearch}' OR jcv_users_name = '${valueSearch}' AND jcv_users_enabled  = 1`)
        .table("jcv_users")
        .then( data => {
            socket.emit('resultInfoUserCourse', (data))
        })


    })

    socket.on('searchArticles', (data) => {

        database
        .raw("SELECT * from jcv_articles WHERE jcv_articles_content like '%"+data+"%' AND jcv_articles_enabled = 1 ")
        .then( data => {
            socket.emit('searchArticlesSend', (data[0])) 
        })

    })

    socket.on('usersTransfersGet', (data) => {

        //Pegando o id do gestor
        database
        .select('jcv_id')
        .whereRaw('jcv_userNamePrimary like "%'+data+'%" ')
        .table("jcv_users")
        .then( data => {
            
            if(data != ''){

                database
                .select()
                .where({jcv_userManager: data[0].jcv_id, jcv_userEnabled: 1})
                .table("jcv_users")
                .join('jcv_unitys','jcv_unitys.sys_unity_id','jcv_users.jcv_userUnity')
                .join('jcv_departments','jcv_departments.sys_department_id','jcv_users.jcv_userSector')
                .then( dataGet => {
                    socket.emit('usersTransfersSend', (dataGet))
                })

            }else{
                socket.emit('usersTransfersSend', (''))
            }

        })
        
        /* database.raw(`

            SELECT c1.*, c2.jcv_userNameSecundary, j1.*, j2.*, j3.*
            FROM (jcv_users c1, jcv_users c2)

            JOIN jcv_unitys j1 ON c1.jcv_userUnity = j1.sys_unity_id
            JOIN jcv_users_permissions j2 ON c1.jcv_id = j2.sys_perm_idUser
            JOIN jcv_departments j3 ON c1.jcv_userSector = j3.sys_department_id

            WHERE c1.jcv_userManager = c2.jcv_id AND c1.jcv_userEnabled = 1 AND c1.jcv_userNamePrimary like '%${data}%' ORDER BY c1.jcv_id ASC
        
        `)
        .then( dataRes => {
            
            socket.emit('usersTransfersSend', (dataRes[0]))

        }) */
    
    })

    socket.on('productGetInfo', (data) => {
        database
        .select()
        .where({jcv_sys_products_id: data})
        .table("jcv_sys_products")
        .then( data => {
            socket.emit('productGetInfoGet', (data))
        })
    })

    socket.on('searchRepresentante', async(data) => {
        const getInfoUser = await database
        .select('jcv_id')
        .where({jcv_userNamePrimary: data})
        .table("jcv_users")
        .then( dataSearch =>{return dataSearch})

        if(getInfoUser.length == 0){
            //Usuario não encontrado
        }else{
            //Usuario encontrado

            //Pegando as lojas
            let getShop = await database
            .select('jcv_trade_shops_name_fantasy')
            .whereRaw(`JSON_CONTAINS(jcv_trade_shops_manager, '${getInfoUser[0].jcv_id}', '$') AND jcv_trade_shops_enabled = 1`)
            //.whereRaw(`jcv_trade_shops_name_fantasy like '%${getSerch[1]}%'`)
            .table("jcv_trade_shops")
            .then( data => {
                return data
            })

            //console.log(getShop)

            //Pegando as promotoras
            let getPromot = await database
            .select('jcv_userNamePrimary')
            .where({jcv_userManager: getInfoUser[0].jcv_id})
            .table("jcv_users")
            .then( data => {
                //console.log(data)
                return data
            })

            /*  */
            letNewArrayData = [];
            if(getPromot != ''){
                getPromot.forEach(element => {
                    letNewArrayData.push(`PROMOTOR(A) | ${element.jcv_userNamePrimary}`)
                });
            }
            if(getShop != ''){
                getShop.forEach(element => {
                    letNewArrayData.push(`LOJA | ${element.jcv_trade_shops_name_fantasy}`)
                });
            }
            /*  */

            //Enviando o resultado
            socket.emit('searchRepresentanteGet', [letNewArrayData,getInfoUser])

            
        }
    })

    socket.on('getRegistersPremiation', async (data) => {

        //Validando as informaçõe recebidas
        let monthValidadtion = data[0];
        let lojaPromotValidation = data[1];
        let representanteValidation = data[2];
        //console.log([monthValidadtion, lojaPromotValidation, representanteValidation])

        let subValidadtion = lojaPromotValidation.split(' | ') 
        let typeSerchValidation = subValidadtion[0] == 'LOJA' ? [1,subValidadtion[1]] : [2,subValidadtion[1]] 

        //Pegando informações do representante
        const getRepresentante = await database
        .select('jcv_id')
        .where({jcv_id: representanteValidation})
        .table("jcv_users")
        .then( data => {return data})

        if(getRepresentante.length == 0){
            //Representante não encontrado
            socket.emit('getRegistersPremiationSend', null)
        }else{
            if(typeSerchValidation[0] == 1){
                //Buscar loja
    
                //Pegando o id da loja
                database
                .select('jcv_trade_shops_id')
                .where({jcv_trade_shops_name_fantasy: typeSerchValidation[1]})
                .table("jcv_trade_shops")
                .then( data => {
    
                    //Pegando o registro de relatorio
                    database
                    .select('jcv_award_registers_uuid')
                    .where({
                        jcv_award_registers_id_registred: data[0].jcv_trade_shops_id, 
                        jcv_award_registers_type: typeSerchValidation[0], 
                        jcv_award_registers_month: monthValidadtion, 
                        jcv_award_registers_id_manager: getRepresentante[0].jcv_id
                    })
                    .table("jcv_award_registers")
                    .then( dataTwo => {
                        socket.emit('getRegistersPremiationSend', (dataTwo))
                    })
    
                })
    
                
            }else{
                //Buscar Promotora
    
                //console.log(typeSerchValidation[1])
                //Pegando o id da promotora e validando
                database
                .select('jcv_id')
                .where({jcv_userNamePrimary: typeSerchValidation[1]})
                .table("jcv_users")
                .then( data => {
                    //console.log(typeSerchValidation)
                    //PEgando o registro de relatorio
                    database
                    .select()
                    .where({
                        jcv_award_registers_id_registred: data[0].jcv_id, 
                        jcv_award_registers_type: typeSerchValidation[0], 
                        jcv_award_registers_month: monthValidadtion,
                        jcv_award_registers_id_manager: getRepresentante[0].jcv_id
                    })
                    .table("jcv_award_registers")
                    .then( dataTwo => {
                        //console.log(dataTwo)
                        socket.emit('getRegistersPremiationSend', (dataTwo))
                    })
    
                })
            }
        }
    })

    socket.on('searchRegisterPromotoras', async(data) => {

        let month = data[0]
        let idUser = data[1]
        //Buscando

        //Primeiro validando se possui o registro
        const getRegisters = await database
        .raw(`

        select a.*, e.jcv_userNamePrimary, d.jcv_userNameSecundary from jcv_award_registers a 
        inner join jcv_users e on e.jcv_id = a.jcv_award_registers_id_manager 
        inner join jcv_users d on d.jcv_id = a.jcv_award_registers_id_registred where a.jcv_award_registers_id_registred = ${idUser} and a.jcv_award_registers_type = 2 and 
        a.jcv_award_registers_month = '${month}'

        `)
        .then( data => {return data[0].length == 0 ? null : data[0]})

        if(getRegisters == null){
            //Erro ao procurar
            socket.emit('searchRegisterPromotorasGet', null)
        }else{
            //Encontrado
            socket.emit('searchRegisterPromotorasGet', getRegisters)
        }

        //console.log(getRegisters)

    })

    socket.on('eventNewValidationUser', (data) => {
        database
        .select("jcv_id","jcv_userNamePrimary","jcv_userImageIcon")
        .where({jcv_userNamePrimary: data})
        .table("jcv_users")
        .then( dataResult => {
            socket.emit('eventNewValidationUserSend', dataResult[0])
        })
    })
})


//Esta variavel define se o sistema pode ser ou não liberado, seria a tela de manutenção!
//1 = manutenção
//0 = sem manutenção
global.enabledPanel = 0;

//sessions
app.use(session({
    secret: "qualu77asadasfdas!@#", 
    name: "JCV-GROUP", 
    resave: true,
    saveUninitialized: true,
    cookie: {maxAge: 8000000}
}));

//Require Login
const jcvLogin = require("./login/app")
app.use("/login", jcvLogin)

app.get("/", (req,res)=>{
    let loginContr = false;
    if(req.session.cookieLogin != undefined){
        loginContr = req.session.cookieLogin
    }

    if(enabledPanel == 1){
        res.redirect('/maintenance')
    }else{

        res.render("web/index", {loginContr: loginContr})
    }
})

//Encurtador
app.get("/link/:urlEncurtada", (req,res) => {

    const urlEncurtada = req.params.urlEncurtada;

    database
    .raw("update jcv_sys_shortener set jcv_sys_shortener_link_clicks = jcv_sys_shortener_link_clicks + 1 WHERE jcv_sys_shortener_link_short = '"+urlEncurtada+"'")
    .then( data => {
        //ok
    })

    //Validando se existe um link deste
    database
    .select()
    .where({jcv_sys_shortener_link_short: urlEncurtada})
    .table("jcv_sys_shortener")
    .then( data => {
        if(data != ''){
            
            const infoURL = [data[0].jcv_sys_shortener_link_original]

            res.render("web/encurtadorClient", {infoURL: infoURL})

        }else{

        }
    })

})

app.get('/maintenance', (req,res) => {

    if(enabledPanel == 1){
        res.render("maintenance/maintenance")
    }else{
        res.redirect("/")
    } 
})

app.get('/terms', async (req,res) => {

    const getInfo = await database
    .select("jcv_sys_term.*","jcv_userNamePrimary")
    .orderBy("jcv_sys_term_id","DESC")
    .table("jcv_sys_term")
    .join("jcv_users","jcv_users.jcv_id","jcv_sys_term.jcv_sys_term_userId_update")
    .limit(1)
    .then( data => {
        return data
    })

    res.render("web/termsAccept", {getInfo: getInfo})
})

app.get('/style/teste', (req,res) => {
    res.render("panel/beleza/modelGenerateEtiqueta")
})

//Require do painel
const jcvPanel = require("./panel/app");
const { Socket } = require("dgram");
app.use("/painel", jcvPanel);

http.listen(8080, () =>{
    console.log(" ")
    console.log("Servidor Rodando")
    console.log(" ")
})