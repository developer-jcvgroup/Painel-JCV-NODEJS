const express = require("express");
const app = express();
const session = require("express-session");
const cookieParser = require('cookie-parser');
const flash = require("connect-flash");

app.set("view engine", "ejs");

const systemCalendarEvents = require('./system/systemAlertCalendar')

// Static
app.use(express.static("public"));

app.use(express.urlencoded({extended: false, parameterLimit: 1000000})); //Pegar dados dos forms ou Rotas
app.use(express.json()); //Aceitar json
app.use(cookieParser())

app.use(flash());

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
        loginContr = true
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
const jcvPanel = require("./panel/app")
app.use("/painel", jcvPanel);

app.listen(8080, () =>{
    console.log(" ")
    console.log("Servidor Rodando")
    console.log(" ")
})