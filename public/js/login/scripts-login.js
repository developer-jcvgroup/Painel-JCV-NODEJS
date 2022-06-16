$(function(){

//Sistema de notificações
if(Cookies.get("SYSTEM-NOTIFICATIONS-MODULE") != undefined){
    let getCookieMsg = JSON.parse(Cookies.get("SYSTEM-NOTIFICATIONS-MODULE"));
    
    //Exibindo a msg
    $.notification(
        [getCookieMsg.message],
        {
            messageType: getCookieMsg.typeMsg,
            timeView: getCookieMsg.timeMsg,
        }
    )

    Cookies.remove("SYSTEM-NOTIFICATIONS-MODULE")
}

//LGPD
setInterval(() => {
    $("#system-lgpd-container").fadeOut()    
}, 7000);


//$.fn.sys_popupSystem("SYS01", "Teste")

//Valida se o usuario fez login antes e salvou em um cookie
if(Cookies.get('CPF-USER') != ''){
    //Aplicando o CPF no input
    $("#input-cpf").val(parseInt(Cookies.get('CPF-USER')))
}

//Buscando o CPF inserido no array de CPF
let valideInitial = arrayPassNull.indexOf($("#input-cpf").val())

//console.log($("#input-cpf").val())

$("#login-div-inputs").fadeOut()
//Validação Inicial: Caso ele econtre o CPF
if(valideInitial == -1){
    //console.log('CPF possui senha! {1}')
    
    //CPF encontrado: Habilitar o campo de senha 
    $("#login-div-inputs").fadeIn()
    $("#index-form-container-password").append(`
        <label for="">Insira sua senha</label>
        <input type="password" name="cpfPassword" id="input-password">
    `)

}else{
    //console.log('CPF não possui senha! {1}')
}

//Caso o usuario digite o CPF dele
$("#input-cpf").keyup(function(){

    let boxPassWord = $("#index-form-container-password");

    //Caso o campo tenha 11 caractere ele faz uma validação
    if($(this).cleanVal().split('').length == 11){
        //console.log("CPF digitado tem 11 carac! {2}")

        //Criando um cookie que garda o CPF para inserir automaticamente no campo cpf
        Cookies.set('CPF-USER',parseInt($(this).cleanVal()))

        //Buscando o CPF no array
        let valide = arrayPassNull.indexOf(($(this).cleanVal()))

        //Caso encontre o CPF ele deve LOGAR SEM SENHA
        if(valide == -1){

            //Verifica se o input FILHO na div existe
            if(boxPassWord.children().length == 0){
                //CPF encontrado: Habilitar o campo de senha 
                $("#login-div-inputs").fadeIn()
                $("#index-form-container-password").append(`
                    <label for="">Insira sua senha</label>
                    <input type="password" name="cpfPassword" id="input-password">
                `)
            }

        }else{
            //Removendo os elementos FILHOS
            boxPassWord.empty();
        }
    }else{
        //Removendo os elementos FILHOS
        boxPassWord.empty();
    }

});

$("#index-recovery-open").click(function(){
    $("#index-recover-pass").fadeIn();
    $("#index-recover-pass").css("display","flex");
})

$("#index-recover-close").click(function(){
    $("#index-recover-pass").fadeOut();
})

//Input mask login
$('#input-cpf').mask('000.000.000-00');

//Input mask reset pass
$('#input-cpf-reset-pass').mask('000.000.000-00');

//Spin loader
$(".class-loader").click(function(){
    $("#sys-section-loader").fadeIn();
})

textmsg.pop()
textauthor.pop()

var atualmsg = 0;
var atualauthor = 0;

$('#span-msg').text(textmsg[atualmsg++]);
setInterval(function() {
    $('#span-msg').fadeOut(function() {
        if (atualmsg >= textmsg.length) atualmsg = 0;
        $('#span-msg').text(textmsg[atualmsg++]).fadeIn();
    });
}, 7000);


$('#span-author').text(textauthor[atualauthor++]);
setInterval(function() {
    $('#span-author').fadeOut(function() {
        if (atualauthor >= textauthor.length) atualauthor = 0;
        $('#span-author').text(textauthor[atualauthor++]).fadeIn();
    });
}, 7000);

})