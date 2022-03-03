const express = require("express");
const router = express.Router();
const multer  = require('multer');

//const io = require('socket.io')(http)

const getPermissions = require("./middlewarePermissions");
const io = require('socket.io')

//middle
const authenticate = require("./middleware");

const storage = multer.diskStorage({
    destination: (req, file, cb) =>{
        cb(null, 'public/panel/img/img-user')
    },
    filename: (req,file,cb) => {
        let typeImage = file.mimetype.split("/")[1];
        cb(null, 'userId-'+GLOBAL_DASH[0]+"."+typeImage)
    }
})

const upload = multer({ storage })

//Controllers da beleza
const programaBeleza = require("./controllers/beleza/controllersBeleza");
//Controller system: Home page
const homePanel = require("./controllers/index/controllerHome");
//Controller system: profile
const controllerProfile = require("./controllers/system/profile");
//Controller do requisitor
const requisitorMateriais = require("./controllers/requisitor/controllerOrder")
//Controller dos itens de requisitor
const itemsRequisitor = require("./controllers/requisitor/controllerItems")
//Controller Usuarios
const controllerUsers = require("./controllers/system/sysUsers")
//Controller departamentos
const controllerDepartment = require("./controllers/system/departments")
//Controller Calendar
const controllerCalendar = require("./controllers/calendar/controllerCalendar")
//Consoller System General
const controllerSystemGeneral = require("./controllers/system/sysGeneral")
//Controler TradeMkt
const controllerTrade = require("./controllers/trade/controllerTrade")
//Controller Sistema Pesquisas
const controllerPesquisas = require("./controllers/system/controllerPesquisas")

//Controller Notifications
const controllerNotifications = require("./controllers/system/controllerNotifications")



/*===================================*/


/*===================================*/


//Logout
router.get("/logout", (req,res)=> {
    req.session.cookieLogin = undefined;
    res.redirect("/");
})

//Pagina inicial
router.get("/", authenticate, getPermissions, homePanel.homeInfo)
router.post("/action/define/pass", homePanel.indexSetPass)


/***********************************/
/***********************************/
//Requisitor: Novo Pedido
router.get("/requisitor/Novo", authenticate, getPermissions, requisitorMateriais.listAllinformations)
router.post("/requisitor/create/order", authenticate, requisitorMateriais.createOrder);
router.post("/requisitor/new/item/request", authenticate, itemsRequisitor.requestItemAdmin)

//Requisitor: Editar Pedido
router.get("/requisitor/EditarRequisicao/:id?", authenticate, getPermissions, requisitorMateriais.editRequestUser);
router.post("/requisitor/EditarRequisicao/save/new/Request", authenticate, requisitorMateriais.editRequestUserCommand);

//Requisitor: Visualizar pedido
router.get("/requisitor/VisualizarRequisicao/:id?", authenticate, getPermissions, requisitorMateriais.viewRequest)
router.post("/requisitor/VisualizarRequisicao/view/order/download", authenticate, requisitorMateriais.viewDownloadOrder)//Botao de download pagina view

//Requisitor: Receber pedido *EXCLUIR, MUDOU PARA ENVIAR REQ*
//router.get("/requisitor/ReceberRequisicao/:id?", authenticate, getPermissions, requisitorMateriais.receberRequisicao)
//router.post("/requisitor/ReceberRequisicao/receber/finalizar", authenticate, requisitorMateriais.receberRequisicaoAction)
//router.post("/requisitor/ReceberRequisicao/receber/finalizar/force", authenticate, requisitorMateriais.receberRequisicaoActionForce)

//Requisitor: Enviar requisição
router.get("/requisitor/EnviarRequisicoes/:idsOrders?", authenticate, requisitorMateriais.sendRequests)

//Requisitor: Meus pedidos
router.get("/requisitor/MinhasRequisicoes", authenticate, getPermissions, requisitorMateriais.listMyRequests)
router.post("/requisitor/action/search/myRequests", authenticate, requisitorMateriais.searchMyRequest)
router.post("/requisitor/action/download/myRequest", authenticate, requisitorMateriais.myRequestDownload)
router.post("/requisitor/action/remove/myRequest", authenticate, requisitorMateriais.myRequestRemove)

//Requisitor: Lista de Pedidos {admin}
router.get("/requisitor/ListaRequisicoes", authenticate, getPermissions, requisitorMateriais.listRequsicoesAll)
router.post("/requisitor/action/list/requisicoes", authenticate, requisitorMateriais.actionSearchOrder)
router.post("/requisitor/action/commands/orders", authenticate, requisitorMateriais.actionCommandsORders)
router.post("/requisitor/admin/action/remove/myRequest", authenticate, requisitorMateriais.adminRequestRemove)
router.post("/requisitor/admin/action/download/myRequest", authenticate, requisitorMateriais.adminRequestDownload)

//Requisitor: Lista de Itens {admin}
router.get("/requisitor/Items", authenticate, getPermissions, itemsRequisitor.adminListAllItems)
router.post("/requisitor/save/item/edit", authenticate, itemsRequisitor.saveEditItem);
router.post("/requisitor/save/item/new", authenticate, itemsRequisitor.saveNewItem)

/***********************************/
/***********************************/
//Calendario: Pagina inicial
router.get("/calendario/main/:numberMonth?/:yearMonth?", authenticate, getPermissions, controllerCalendar.viewCalendarMonth)
//Calendario: Pagina de eventos
router.get("/calendario/event/:idEvent?/:dayEvent?/:monthEvent?/:yearEvent?", authenticate, getPermissions, controllerCalendar.viewEvent)
//Calendario: Pagina de salas
router.get("/calendario/room/RoomSettings", authenticate, getPermissions, controllerCalendar.roomSettings)


//Calendario: Pagina ver eventos da sala
router.get("/calendario/viewRoom/:idRoom/:monthRoom?", authenticate, getPermissions, controllerCalendar.viewRoom)

//Calendario: Ver evento do dia
router.get("/calendario/viewEvent/Day/:dayEvent?", authenticate, getPermissions, controllerCalendar.viewEventDay)

//Calendario: Criar novo evento
router.post("/calendario/main/register/new", authenticate, controllerCalendar.saveNewEvent)
router.post("/calendario/main/register/edit", authenticate, controllerCalendar.editSaveNewEvent)
//Remover evento
router.post("/calendario/main/delete/event", authenticate, controllerCalendar.deleteEvent)

//Calendario: Criar nova sala
router.post("/calendario/room/register/new", authenticate, controllerCalendar.registerNewRoom)
router.post("/calendario/room/register/edit", authenticate, controllerCalendar.editNewRoom)
router.post("/calendario/room/register/createQrCode", authenticate, controllerCalendar.createQrCode)

/***********************************/
/***********************************/
//Programa da Beleza: Solicitar
router.get("/beleza/solicitar", authenticate, getPermissions, programaBeleza.sysBLZrequest)
router.post("/beleza/action/solicitar", authenticate, programaBeleza.finalizarSolicitacao);

//Programa da Beleza: Status
router.get("/beleza/status", authenticate, getPermissions, programaBeleza.listOrder)
router.post("/beleza/request/cancel", authenticate, programaBeleza.cancelOrder);

//Programa da Beleza: Lista de solicitações
router.get("/beleza/solicitacoes", authenticate, getPermissions, programaBeleza.listRequests);
router.post("/beleza/requests/search", authenticate, programaBeleza.searchRequests);

//Programa da Beleza: Lista de produtos
router.get("/beleza/produtos", authenticate, getPermissions, programaBeleza.listProducts);
router.post("/beleza/register/product", authenticate, programaBeleza.registerProduct);
router.post("/beleza/status/products", authenticate, programaBeleza.statusProducts);
router.post("/beleza/actions/product/save", authenticate, programaBeleza.actionProductSave)
router.post("/beleza/actions/product/delete", authenticate, programaBeleza.actionProductDelete)

//Programa da beleza: operações em pedidos listados
router.post("/beleza/actions/orders/commands", authenticate, programaBeleza.actionsCommandsOrder)
//Programa da beleza: operações em pedidos separados
router.post("/beleza/actions/order/download", authenticate, programaBeleza.actionsCommandsUnityDownload)
router.post("/beleza/actions/order/delete", authenticate, programaBeleza.actionsCommandsUnityCancel)

/***********************************/
/***********************************/
//Sistema: Usuarios, permissoes, departamentos, unidades
router.get("/system/users", authenticate, getPermissions, controllerUsers.listAllinformations)

//Salvar novo usuario
router.post("/system/action/sys/user/save", authenticate, controllerUsers.saveNewUser)
//Salvar um usuario editado
router.post("/system/action/sys/user/save-edit", authenticate, controllerUsers.editSaveUser)
//Resetar a senha do usuario
router.post("/system/action/sys/user/resetpass", authenticate, controllerUsers.resetPassUser)

//Departamentos
router.get("/system/departamentos", authenticate, getPermissions, controllerDepartment.listDepartments)
router.post("/system/department/action/saveEdit", authenticate, controllerDepartment.editSaveDepartment)
router.post("/system/department/action/save", authenticate, controllerDepartment.saveNewDepartment)

//Sistema: Unidades
router.get("/system/unidades", authenticate, getPermissions, controllerDepartment.listUnitys)
router.post("/system/unidades/action/save", authenticate, controllerDepartment.saveUnity)
router.post("/system/unidades/action/save/edit", authenticate, controllerDepartment.saveEditUnity)

//Sistema: Pesquisas

/***********************************/
/***********************************/
//Trade Mtk: Pagina inicial
router.get('/trademkt/main', authenticate, getPermissions, controllerTrade.controllerMain)
//Trade Mtk: Formulario de visita
router.get('/trademkt/visit', authenticate, getPermissions, controllerTrade.visitForm)
router.post('/trademkt/visit/new', authenticate, controllerTrade.visitFormNew)
//Trade Mtk: Vendas diarias
router.get('/trademkt/salesDay', authenticate, getPermissions, controllerTrade.salesDay)
router.post('/trademkt/salesDay/new', authenticate, controllerTrade.salesDayRegister)
//Trade Mtk: Formulario de pesquisa
router.get('/trademkt/formSearch/new', authenticate, getPermissions, controllerTrade.formSearch)
router.get('/trademkt/formSearch/edit/:id?', authenticate, getPermissions, controllerTrade.formSearchEdit)
router.post('/trademkt/formSearch/newForm', authenticate, controllerTrade.formSearchNew)
router.post('/trademkt/formSearch/editForm', authenticate, controllerTrade.formSearchEditAction)
//Trade Mtk: Lista Geral
router.get('/trademkt/listTrade', authenticate, getPermissions, controllerTrade.listTradePage)
router.post('/trademkt/listTrade/search', authenticate, controllerTrade.listTradeSearch)
router.post('/trademkt/action/vd/action', authenticate, controllerTrade.actionVDmodule)
router.post('/trademkt/action/fp/action', authenticate, controllerTrade.actionFPmodule)
router.post('/trademkt/action/fv/action', authenticate, controllerTrade.visitFormModule)
router.post('/trademkt/fv/export-pdf', authenticate, controllerTrade.exportFVPDF)
//Ação no Form de Pesquisa
router.post('/trademkt/action/fp/deleteForm', authenticate, controllerTrade.deleteFPform)
router.post('/trademkt/action/fp/removeResponses', authenticate, controllerTrade.removeFPresponses)
//Trade Mtk: Pagina de resposta
router.get('/trademkt/form/response/:id', authenticate, getPermissions, controllerTrade.formResponse)
router.post('/trademkt/formSearch/responseForm', authenticate, controllerTrade.formResponseAction)
//Trade Mkt: Lojas
router.get('/trademkt/shops', authenticate, getPermissions, controllerTrade.shopsPage)
router.post('/trademkt/shops/register/shop/new', authenticate, controllerTrade.shopsRegisterNew)
router.post('/trademkt/shops/register/shop/edit', authenticate, controllerTrade.shopsRegisterEdit)
router.post('/trademkt/shops/action/execute', authenticate, controllerTrade.shopsRegisterActions)
router.get('/trademkt/shops/config/:id?', authenticate, getPermissions, controllerTrade.configShops)
//
router.post('/trademkt/shops/set/users', authenticate, controllerTrade.saveSetUsers)

//Trade MKT ações de remover forms
router.post('/trademkt/remove/fv/form', authenticate, controllerTrade.deleteFV)
router.post('/trademkt/remove/vd/form', authenticate, controllerTrade.deleteVD)

//Trade MKT: produtos
router.get('/trademkt/products', authenticate, controllerTrade.tradeProducts)
router.post('/trademkt/products/save/new', authenticate, controllerTrade.saveNewProduct)
router.post('/trademkt/products/save/edit', authenticate, controllerTrade.editNewProduct)
router.post('/trademkt/products/action/execute', authenticate, controllerTrade.actionProductsTrade)

/***********************************/
/***********************************/
//Pagina: Perfil
router.get("/perfil", authenticate, controllerProfile.getInfoUser);
//Alterando a senha
router.post("/perfil/pass/redefine", authenticate, controllerProfile.sysNewpassword);
//Update dos dados
router.post("/perfil/update", authenticate, controllerProfile.updateDataUser);
router.post("/perfil/update/image", authenticate, upload.single('userImageUpload'), controllerProfile.updateImageUser);

/***********************************/
/***********************************/
//Chat: Pagina inicial
router.get("/chat", authenticate,(req,res)=>{

    res.cookie('SYS-NOTIFICATION-EXE1', "SYS03|Em desenvolvimento...");
    res.redirect("/painel")

    /* var page = "chat/chat";
    res.render("panel/index", {page: page}) */
})


/***********************************/
/***********************************/
//Updates: Pagina inicial
router.get("/updates", authenticate,(req,res)=>{

    res.cookie('SYS-NOTIFICATION-EXE1', "SYS03|Em desenvolvimento...");
    res.redirect("/painel")

    /* var page = "system/updates";
    res.render("panel/index", {page: page}) */
})

//Updates: Sistema de exibição do update
router.post("/update/closeUp", authenticate, controllerSystemGeneral.closeUpdateSingle)
router.post("/update/closeAll", authenticate, controllerSystemGeneral.closeUpdateAll)

/***********************************/
/***********************************/
//Notificações: Pagina inicial
router.get("/notifications", authenticate, controllerSystemGeneral.listNotificationsUser)

/***********************************/
/***********************************/
//Logs do sistema: Pagina inicial
//router.get("/logs", authenticate, controllerSystemGeneral.systemLogs)

module.exports = router;