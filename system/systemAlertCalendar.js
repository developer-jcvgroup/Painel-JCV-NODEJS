const database = require("./database");
const moment = require("moment");
moment.locale('pt-BR');

const cron = require('node-cron');

//Sistema de emails
const emailSystemExe = require('../panel/controllers/system/emailSystem');

async function lembreteCalendar(){

    //Mes atual
    var monthNumber = moment().month() < 10 ? '0'+ (1 + moment().month()) : 1 + moment().month();
    var yearMonth = moment().year();

    //Pegando todos os eventos do mes atual e validando o inicio de cada
    //para disparar emails de lembrete
    database
    .select()
    .where({sys_calendar_eventMonth: monthNumber+'/'+yearMonth})
    .table("jcv_calendar_registers")
    .then( data => {
        
        data.forEach(element => {
            
            let converMinutesHours = moment().add(element.sys_calendar_eventReminder, 'minutes').format("HH:mm");

            //Validando se o evento esta prestes a começar
            if(converMinutesHours == element.sys_calendar_eventHours.split(' - ')[0] && element.sys_calendar_eventDate == moment().format("DD/MM/YYYY") ){
                
                database
                .select("jcv_userEmailCorporate")
                .whereRaw('jcv_id IN ('+element.sys_calendar_eventPersons+')')
                .table("jcv_users")
                .then( dataTwo => {

                    let newArrayEamils = [];
                    dataTwo.forEach(elementTwo => {
                        newArrayEamils.push(elementTwo.jcv_userEmailCorporate)
                    });

                    const textOne = 'Um evento está próximo de acontecer';
                    const textTwo = `Existe um evento que esta prestes a iniciar faltando apenas <b>${element.sys_calendar_eventReminder} minutos!</b>.<br> Nome do evento: <b>${element.sys_calendar_eventName}</b>. <br> Data do evento: <b>${element.sys_calendar_eventDate}</b>.`;
                    emailSystemExe.sendMailExe(newArrayEamils, 'Evento Próximo', 'Evento Próximo', 'Calendario', '', textOne, textTwo);

                })
            }else if(moment().add(1, 'minutes').format("HH:mm") == element.sys_calendar_eventHours.split(' - ')[0]){
                //Caso nao esteje na hora programada pelo usuario, o sistema manda automaticamente o email faltando 1 minuto para o evento começar
                //Ou seja, o usuario recebe por padrão 2 emails de aviso sobre o eventos

                database
                .select("jcv_userEmailCorporate")
                .whereRaw('jcv_id IN ('+element.sys_calendar_eventPersons+')')
                .table("jcv_users")
                .then( dataTwo => {

                    let newArrayEamils = [];
                    dataTwo.forEach(elementTwo => {
                        newArrayEamils.push(elementTwo.jcv_userEmailCorporate)
                    });

                    const textOne = 'Um evento está próximo de acontecer';
                    const textTwo = `Existe um evento que esta prestes a iniciar faltando apenas <b>1 minuto!</b>.<br> Nome do evento: <b>${element.sys_calendar_eventName}</b>. <br> Data do evento: <b>${element.sys_calendar_eventDate}</b>.`;
                    emailSystemExe.sendMailExe(newArrayEamils, 'Evento Próximo', 'Evento Próximo', 'Calendario', '', textOne, textTwo);

                })
            }
        });

    })
}

cron.schedule('1 * * * *', function() {
    console.log("Executando a tarefa a cada minuto: "+moment().format("DD-MM-YYYY HH:mm:ss"))
    lembreteCalendar()
});