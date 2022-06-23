const express = require("express");
const router = express.Router();
const multer  = require('multer');

//const io = require('socket.io')(http)

const getPermissions = require("./middlewarePermissions");
const middlewareURL = require("./moduleUrl")

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
//Controller Formulário
const controllerFormulario = require("./controllers/formularios/controllerFormulario")
//Controller Notifications
const controllerNotifications = require("./controllers/notifications/controllerNotify")
//Controller Updates
const controllerUpdates = require("./controllers/updates/controllerUpdate")
//Controllers Reports
const controllerReport = require("./controllers/system/controllerReport")
//Controllers Terms
const controllerTerms = require("./controllers/system/controllerTerms")
//Controller encurtador
const controllerEncurtador = require("./controllers/encurtador/controllerEncurtador")
//Controller certificados
const controllerCursos = require("./controllers/certificados/controllerCursos")
//Controller External Login
const controllerExternalLogin = require("./controllers/system/controllerExternalLogin")

/*===================================*/


/*===================================*/


//Logout
router.get("/logout", (req,res)=> {
    req.session.cookieLogin = undefined;
    GLOBAL_DASH = undefined;
    res.redirect("/");
})

//Pagina inicial
router.get("/", middlewareURL, authenticate, getPermissions, homePanel.homeInfo)
router.post("/action/define/pass", homePanel.indexSetPass)


/***********************************/
/***********************************/
//Requisitor: Novo Pedido
router.get("/requisitor/Novo", middlewareURL, authenticate, getPermissions, requisitorMateriais.listAllinformations)
router.post("/requisitor/create/order", authenticate, requisitorMateriais.createOrder);
router.post("/requisitor/new/item/request", authenticate, itemsRequisitor.requestItemAdmin)

//Requisitor: Editar Pedido
router.get("/requisitor/EditarRequisicao/:id?", middlewareURL, authenticate, getPermissions, requisitorMateriais.editRequestUser);
router.post("/requisitor/EditarRequisicao/save/new/Request", authenticate, requisitorMateriais.editRequestUserCommand);

//Requisitor: Visualizar pedido
router.get("/requisitor/VisualizarRequisicao/:id?", middlewareURL, authenticate, getPermissions, requisitorMateriais.viewRequest)
router.post("/requisitor/VisualizarRequisicao/view/order/download", authenticate, requisitorMateriais.viewDownloadOrder)//Botao de download pagina view

//Requisitor: Receber pedido *EXCLUIR, MUDOU PARA ENVIAR REQ*
//router.get("/requisitor/ReceberRequisicao/:id?", authenticate, getPermissions, requisitorMateriais.receberRequisicao)
//router.post("/requisitor/ReceberRequisicao/receber/finalizar", authenticate, requisitorMateriais.receberRequisicaoAction)
//router.post("/requisitor/ReceberRequisicao/receber/finalizar/force", authenticate, requisitorMateriais.receberRequisicaoActionForce)

//Requisitor: Enviar requisição
router.get("/requisitor/EnviarRequisicoes/:idsOrders?", middlewareURL, authenticate, requisitorMateriais.sendRequests)

//Requisitor: Meus pedidos
router.get("/requisitor/MinhasRequisicoes", middlewareURL, authenticate, getPermissions, requisitorMateriais.listMyRequests)
router.post("/requisitor/action/search/myRequests", authenticate, requisitorMateriais.searchMyRequest)
router.post("/requisitor/action/download/myRequest", authenticate, requisitorMateriais.myRequestDownload)
router.post("/requisitor/action/remove/myRequest", authenticate, requisitorMateriais.myRequestRemove)

//Requisitor: Lista de Pedidos {admin}
router.get("/requisitor/ListaRequisicoes", middlewareURL, authenticate, getPermissions, requisitorMateriais.listRequsicoesAll)
router.post("/requisitor/action/list/requisicoes", authenticate, requisitorMateriais.actionSearchOrder)
router.post("/requisitor/action/commands/orders", authenticate, requisitorMateriais.actionCommandsORders)
router.post("/requisitor/admin/action/remove/myRequest", authenticate, requisitorMateriais.adminRequestRemove)
router.post("/requisitor/admin/action/download/myRequest", authenticate, requisitorMateriais.adminRequestDownload)

//Requisitor: Lista de Itens {admin}
router.get("/requisitor/Items", middlewareURL, authenticate, getPermissions, itemsRequisitor.adminListAllItems)
router.post("/requisitor/save/item/edit", authenticate, itemsRequisitor.saveEditItem);
router.post("/requisitor/save/item/new", authenticate, itemsRequisitor.saveNewItem)

/***********************************/
/***********************************/
//Calendario: Pagina inicial
router.get("/calendario/main/:numberMonth?/:yearMonth?", middlewareURL, authenticate, getPermissions, controllerCalendar.viewCalendarMonth)
//Calendario: Pagina de eventos
router.get("/calendario/event/:idEvent?/:dayEvent?/:monthEvent?/:yearEvent?", middlewareURL, authenticate, getPermissions, controllerCalendar.viewEvent)
//Calendario: Pagina de salas
router.get("/calendario/room/RoomSettings", middlewareURL, authenticate, getPermissions, controllerCalendar.roomSettings)


//Calendario: Pagina ver eventos da sala
router.get("/calendario/viewRoom/:idRoom/:monthRoom?", middlewareURL, authenticate, getPermissions, controllerCalendar.viewRoom)

//Calendario: Ver evento do dia
router.get("/calendario/viewEvent/Day/:dayEvent?", middlewareURL, authenticate, getPermissions, controllerCalendar.viewEventDay)

//Calendario: Criar novo evento
router.post("/calendario/main/register/new", authenticate, controllerCalendar.saveNewEvent)
router.post("/calendario/main/register/edit", authenticate, controllerCalendar.editSaveNewEvent)
//Remover evento
router.post("/calendario/main/delete/event", authenticate, controllerCalendar.deleteEvent)

//Link de Download do evento:
router.get("/calendario/download/:eventFile", middlewareURL, controllerCalendar.eventDownload)

//Calendario: Criar nova sala
router.post("/calendario/room/register/new", authenticate, controllerCalendar.registerNewRoom)
router.post("/calendario/room/register/edit", authenticate, controllerCalendar.editNewRoom)
router.post("/calendario/room/register/createQrCode", authenticate, controllerCalendar.createQrCode)

/***********************************/
/***********************************/
//Programa da Beleza: Solicitar
router.get("/beleza/solicitar", middlewareURL, authenticate, getPermissions, programaBeleza.sysBLZrequest)
router.post("/beleza/action/solicitar", authenticate, programaBeleza.finalizarSolicitacao);

//Programa da Beleza: Status
router.get("/beleza/status", middlewareURL, authenticate, getPermissions, programaBeleza.listOrder)
router.post("/beleza/request/cancel", authenticate, programaBeleza.cancelOrder);

//Programa da Beleza: Lista de solicitações
router.get("/beleza/solicitacoes", middlewareURL, authenticate, getPermissions, programaBeleza.listRequests);
router.post("/beleza/requests/search", authenticate, programaBeleza.searchRequests);

//Programa da Beleza: Lista de produtos
router.get("/beleza/produtos", middlewareURL, authenticate, getPermissions, programaBeleza.listProducts);
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
router.get("/system/users", middlewareURL, authenticate, getPermissions, controllerUsers.listAllinformations)

//Salvar novo usuario
router.post("/system/action/sys/user/save", authenticate, controllerUsers.saveNewUser)
//Salvar um usuario editado
router.post("/system/action/sys/user/save-edit", authenticate, controllerUsers.editSaveUser)
//Resetar a senha do usuario
router.post("/system/action/sys/user/resetpass", authenticate, controllerUsers.resetPassUser)
router.post("/system/action/sys/user/resetpasssingle", authenticate, controllerUsers.resetPassUserSingle)
//Download dos dados
router.post("/system/action/sys/users/download", authenticate, controllerUsers.downloadDataUsers)

//Departamentos
router.get("/system/departamentos", middlewareURL, authenticate, getPermissions, controllerDepartment.listDepartments)
router.post("/system/department/action/saveEdit", authenticate, controllerDepartment.editSaveDepartment)
router.post("/system/department/action/save", authenticate, controllerDepartment.saveNewDepartment)

//Sistema: Unidades
router.get("/system/unidades", middlewareURL, authenticate, getPermissions, controllerDepartment.listUnitys)
router.post("/system/unidades/action/save", authenticate, controllerDepartment.saveUnity)
router.post("/system/unidades/action/save/edit", authenticate, controllerDepartment.saveEditUnity)

//Sistema: Reports
router.post("/system/report/action", authenticate, controllerReport.saveNewReport)

/***********************************/
/***********************************/
//Trade Mtk: Pagina inicial
router.get('/trademkt/main', middlewareURL, authenticate, getPermissions, controllerTrade.controllerMain)
//Trade Mtk: Formulario de visita
router.get('/trademkt/visit', middlewareURL, authenticate, getPermissions, controllerTrade.visitForm)
router.post('/trademkt/visit/new', authenticate, controllerTrade.visitFormNew)
//Trade Mtk: Vendas diarias
router.get('/trademkt/salesDay', middlewareURL, authenticate, getPermissions, controllerTrade.salesDay)
router.post('/trademkt/salesDay/new', authenticate, controllerTrade.salesDayRegister)
//Trade Mtk: Formulario de pesquisa
router.get('/trademkt/formSearch/new', middlewareURL, authenticate, getPermissions, controllerTrade.formSearch)
router.get('/trademkt/formSearch/edit/:id?', middlewareURL, authenticate, getPermissions, controllerTrade.formSearchEdit)
router.post('/trademkt/formSearch/newForm', authenticate, controllerTrade.formSearchNew)
router.post('/trademkt/formSearch/editForm', authenticate, controllerTrade.formSearchEditAction)
//Trade Mtk: Lista Geral
router.get('/trademkt/listTrade', middlewareURL, authenticate, getPermissions, controllerTrade.listTradePage)
router.post('/trademkt/listTrade/search', authenticate, controllerTrade.listTradeSearch)
router.post('/trademkt/action/vd/action', authenticate, controllerTrade.actionVDmodule)
router.post('/trademkt/action/fp/action', authenticate, controllerTrade.actionFPmodule)
router.post('/trademkt/action/fv/action', authenticate, controllerTrade.visitFormModule)
router.post('/trademkt/fv/export-pdf', authenticate, controllerTrade.exportFVPDF)
//Ação no Form de Pesquisa
router.post('/trademkt/action/fp/deleteForm', authenticate, controllerTrade.deleteFPform)
router.post('/trademkt/action/fp/removeResponses', authenticate, controllerTrade.removeFPresponses)
//Trade Mtk: Pagina de resposta
router.get('/trademkt/form/response/:id', middlewareURL, authenticate, getPermissions, controllerTrade.formResponse)
router.post('/trademkt/formSearch/responseForm', authenticate, controllerTrade.formResponseAction)
//Trade Mkt: Lojas
router.get('/trademkt/shops', middlewareURL, authenticate, getPermissions, controllerTrade.shopsPage)
router.post('/trademkt/shops/register/shop/new', authenticate, controllerTrade.shopsRegisterNew)
router.post('/trademkt/shops/register/shop/edit', authenticate, controllerTrade.shopsRegisterEdit)
router.post('/trademkt/shops/action/execute', authenticate, controllerTrade.shopsRegisterActions)
router.get('/trademkt/shops/config/:id?', middlewareURL, authenticate, getPermissions, controllerTrade.configShops)
//Mapa
router.get('/trademkt/shops/maps', middlewareURL, authenticate, getPermissions, controllerTrade.mapViewShops)
//
router.post('/trademkt/shops/set/users', authenticate, controllerTrade.saveSetUsers)

//Trade MKT ações de remover forms
router.post('/trademkt/remove/fv/form', authenticate, controllerTrade.deleteFV)
router.post('/trademkt/remove/vd/form', authenticate, controllerTrade.deleteVD)

//Trade MKT: produtos
router.get('/trademkt/products', middlewareURL, authenticate, controllerTrade.tradeProducts)
router.post('/trademkt/products/save/new', authenticate, controllerTrade.saveNewProduct)
router.post('/trademkt/products/save/edit', authenticate, controllerTrade.editNewProduct)
router.post('/trademkt/products/action/execute', authenticate, controllerTrade.actionProductsTrade)

/***********************************/
/***********************************/
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
router.get("/updates/main", middlewareURL, authenticate, controllerUpdates.updatesMain)
router.get("/updates/new", middlewareURL, authenticate, controllerUpdates.updatesNew)
router.get("/updates/edit/:id?", middlewareURL, authenticate, controllerUpdates.updateEdit)

router.post("/updates/new", authenticate, controllerUpdates.updatesNewSave)

router.post("/updates/disabled", authenticate, controllerUpdates.updatesDisabled)
router.post("/updates/enabled", authenticate, controllerUpdates.updatesEnabled)
router.post("/updates/delete", authenticate, controllerUpdates.updatesDelete)
router.post("/updates/edit", authenticate, controllerUpdates.updateEditSave)

//Updates: Sistema de exibição do update
router.post("/update/closeUp", authenticate, controllerSystemGeneral.closeUpdateSingle)

/***********************************/
/***********************************/
//Notificações: Pagina inicial
router.get("/notifications", middlewareURL, authenticate, controllerSystemGeneral.listNotificationsUser)

/* Admin */
router.get("/notifications/main", middlewareURL, authenticate, controllerNotifications.mainNotifications)
router.get("/notifications/new", middlewareURL, authenticate, controllerNotifications.newNotifications)
router.get("/notifications/edit/:id?", middlewareURL, authenticate, controllerNotifications.editNotifications)

router.post("/notifications/new", authenticate, controllerNotifications.saveNotifications)
router.post("/notifications/edit", authenticate, controllerNotifications.saveEditNotifications)
router.post("/notifications/delete", authenticate, controllerNotifications.deleteNotifications)
router.post("/notifications/reset", authenticate, controllerNotifications.resetViews)

/***********************************/
/***********************************/
//Formulário de Pesquisa: Sistema
router.get("/formularios/main", middlewareURL, authenticate, getPermissions, controllerFormulario.mainPage)
router.get("/formularios/novo", middlewareURL, authenticate, getPermissions, controllerFormulario.novoFormulario)
router.get("/formularios/edit/:idForm?", middlewareURL, authenticate, getPermissions, controllerFormulario.editFormulario)
router.get("/formularios/reponse/:idForm?", middlewareURL, authenticate, controllerFormulario.responseFormulario)

router.post("/formularios/reponseButton", authenticate, getPermissions, controllerFormulario.responseFormularioButton)

router.post("/formularios/novo", authenticate, controllerFormulario.saveNewForm)
router.post("/formularios/edit", authenticate, controllerFormulario.editFormularioSave)
router.post("/formularios/deleteResponses", authenticate, controllerFormulario.removeResponses)
router.post("/formularios/delete", authenticate, controllerFormulario.deleteFormulario)
router.post("/formularios/disabled", authenticate, controllerFormulario.disabledForm)
router.post("/formularios/reponse", authenticate, controllerFormulario.sendResponse)
router.post("/formularios/reponse/downlod", authenticate, controllerFormulario.exportResponses)

/***********************************/
/***********************************/
//Encurtador: Encurtador
router.get("/encurtador/main", middlewareURL, authenticate, getPermissions, controllerEncurtador.encurtadorMain)
router.get("/encurtador/new", middlewareURL, authenticate, getPermissions, controllerEncurtador.encurtadorNew)
router.get("/encurtador/edit/:id?", middlewareURL, authenticate, getPermissions, controllerEncurtador.encurtadorEdit)

router.post("/encurtador/new", authenticate, controllerEncurtador.encurtadorNewSave)
router.post("/encurtador/edit", authenticate, controllerEncurtador.encurtadorEditSave)
router.post("/encurtador/delete", authenticate, controllerEncurtador.encurtadorDelete)

/***********************************/
/***********************************/
//Cursos: Sistema de cursos e certificados
router.get("/cursos/main", middlewareURL, authenticate, getPermissions,controllerCursos.cursosMain)
router.get("/cursos/new", middlewareURL, authenticate, getPermissions, controllerCursos.cursosNew)
router.get("/cursos/edit/:id?", middlewareURL, authenticate, getPermissions, controllerCursos.cursosEdit)
router.get("/cursos/start/:id?", middlewareURL, authenticate, getPermissions, controllerCursos.cursosStartup)
router.get("/cursos/sinc/profile", middlewareURL, authenticate, controllerCursos.moduleSicProfile)

router.post("/course/new", authenticate, controllerCursos.saveNewCourse)
router.post("/course/edit", authenticate, controllerCursos.saveEditCourse)
router.post("/course/delete", authenticate, getPermissions, controllerCursos.courseDelete)
router.post("/course/start", authenticate, controllerCursos.startCourse)
router.post("/course/finality", authenticate, controllerCursos.finalityCourse)

router.post("/course/sync/profile", authenticate, controllerCursos.moduleActionSync)

/***********************************/
/***********************************/
//Termos: Sistema
router.get("/terms", authenticate, controllerTerms.moduleTerms)
router.post("/terms/save", authenticate, controllerTerms.termsSave)

/***********************************/
/***********************************/
//Login: Login externo
router.get("/external/login", authenticate, controllerExternalLogin.moduleLoginExternal)

module.exports = router;