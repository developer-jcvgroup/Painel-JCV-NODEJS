const express = require("express");
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http)

const database = require("./panel/database/database");

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
        .raw("SELECT * from jcv_notifications WHERE JSON_CONTAINS(jcv_notifications_usersId, '"+data+"', '$') AND NOT JSON_CONTAINS(jcv_notifications_users_view, '"+data+"', '$')")
        //.select()
        //.where({jcv_notifications_usersId: data, jcv_notifications_users_view: null})
        //.table("jcv_notifications")
        .then( dataAll => {

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

app.get('/maintenance', (req,res) => {

    if(enabledPanel == 1){
        res.render("maintenance/maintenance")
    }else{
        res.redirect("/")
    } 
})

//Require do painel
const jcvPanel = require("./panel/app");
const { Socket } = require("socket.io");
app.use("/painel", jcvPanel);

http.listen(8080, () =>{
    console.log(" ")
    console.log("Servidor Rodando")
    console.log(" ")
})