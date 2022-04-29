$(function(){

    //evita todos os form post do sistema
    if(window.history.replaceState) {
        window.history.replaceState(null, null, window.location.href)
    }

    $.fn.closePagination = function (typeOf){
        
        if(typeOf == 1){
            //Exibe a paginação
            $('.pagination-nav-list-main').css('display','flex');
        }else{
            //Esconde a paginação
            $('.pagination-nav-list-main').css('display','none');
        }
    }

    //Paginação
    $.fn.paginationTableMain = function (selectTable, amountRow, removeRow){
        if($(selectTable).is(':visible')){
            $('#nav').fadeOut()
        }else{
            $('#nav').fadeIn()
        }

        $(selectTable).after('<div id="nav" class="pagination-nav-list-main"></div>');

        var rowsShown = amountRow;
        var rowsTotal = $(selectTable+' tbody tr').length;
        var numPages = rowsTotal/rowsShown;

        for(i = 0;i < numPages;i++) {
            var pageNum = i + 1;
            $('#nav').append('<span href="#" rel="'+i+'">'+pageNum+'</span>');
        }

        //Aqui removemos tantas linhas DE CIMA PARA BAIXO
        removeRow = rowsTotal-removeRow;

        //Quantidade total
        $('#nav').append('<div class="pagination-nav-list-main-amount"><span>'+removeRow+' totais</span></div>')

        $(selectTable+' tbody tr').hide();
        $(selectTable+' tbody tr').slice(0, rowsShown).show();
        $('#nav span:first').addClass('pagination-nav-list-active');
        $('#nav span').bind('click', function(){

        $('#nav span').removeClass('pagination-nav-list-active');
        $(this).addClass('pagination-nav-list-active');
        var currPage = $(this).attr('rel');
        var startItem = currPage * rowsShown;
        var endItem = startItem + rowsShown;
        $(selectTable+' tbody tr').css('opacity','0.0').hide().slice(startItem, endItem).
            css('display','table-row').animate({opacity:1}, 300);
        });

        //Spin load {1: ativo, 2: desativar}
        $.fn.loadSpin(2);
        
    }

    let arrayCountPopUp = [];
    $.fn.sys_popupSystem = async function(code, valueMsg){
        $("#system-section-notification").fadeIn();//deixando visivel a section principal



        if(code == "SYS01"){
            let idPopUp = arrayCountPopUp.push(+1);

            $("#sys-notifi-container-main").fadeIn()
            .append(`<div class="sys-notifi-box-one" id="sys-notifi-box-one-${idPopUp}">
            <div class="sys-notifi-mark-left-one"></div>
                <div class="sys-notifi-main-msg-display-one">
                    <div class="sys-notifi-container-msg-center-one">
                        <div class="sys-notifi-icon-one"><i class="ri-check-line"></i></div>
                        <div class="sys-notifi-text-one">
                            <span id="sys-nofiti-text-one">${valueMsg}</span>
                        </div>
                    </div>
                </div>
            </div>`);

            setTimeout(()=> {
                $("#sys-notifi-box-one-"+idPopUp).fadeOut(1000,function() { $(this).remove(); })
                arrayCountPopUp.splice(arrayCountPopUp.indexOf(idPopUp), 1)
            },5000)
        }
        
        if(code == "SYS02"){
            let idPopUp = arrayCountPopUp.push(+1);

            $("#sys-notifi-container-main").fadeIn()
            .append(`<div class="sys-notifi-box-two" id="sys-notifi-box-two-${idPopUp}">
            <div class="sys-notifi-mark-left-two"></div>
                <div class="sys-notifi-main-msg-display-two">
                    <div class="sys-notifi-container-msg-center-two">
                        <div class="sys-notifi-icon-two"><i class="ri-error-warning-line"></i></div>
                        <div class="sys-notifi-text-two">
                            <span id="sys-nofiti-text-two">${valueMsg}</span>
                        </div>
                    </div>
                </div>
            </div>`);

            setTimeout(()=> {
                $("#sys-notifi-box-two-"+idPopUp).fadeOut(1000,function() { $(this).remove(); })
                arrayCountPopUp.splice(arrayCountPopUp.indexOf(idPopUp), 1)
            },6000)
        }
        
        if(code == "SYS03"){

            let idPopUp = arrayCountPopUp.push(+1);

            $("#sys-notifi-container-main").fadeIn()
            .append(`<div class="sys-notifi-box-three" id="sys-notifi-box-three-${idPopUp}">
            <div class="sys-notifi-mark-left-three"></div>
                <div class="sys-notifi-main-msg-display-three">
                    <div class="sys-notifi-container-msg-center-three">
                        <div class="sys-notifi-icon-three"><i class="ri-close-circle-line"></i></div>
                        <div class="sys-notifi-text-three">
                            <span id="sys-nofiti-text-three">${valueMsg}</span>
                        </div>
                    </div>
                </div>
            </div>`);

            setTimeout(()=> {
                $("#sys-notifi-box-three-"+idPopUp).fadeOut(1000,function() { $(this).remove(); })
            },7000)

        }

        
        //Deletando os cookies
        await Cookies.remove("SYS-NOTIFICATION-EXE1")
        await Cookies.remove("SYS-NOTIFICATION-EXE2")
        await Cookies.remove("SYS-NOTIFICATION-EXE3")
    }

    // Dropdown do menu
    $("#menu-01").click(function(){
        $("#menu-01 > i").toggleClass('rotate-90')

        var subMeu = $("#sub-01");
        $(subMeu).slideToggle();
    })
    $("#menu-02").click(function(){
        $("#menu-02 > i").toggleClass('rotate-90')

        var subMeu = $("#sub-02");
        $(subMeu).slideToggle();
    })
    $("#menu-03").click(function(){
        $("#menu-03 > i").toggleClass('rotate-90')

        var subMeu = $("#sub-03");
        $(subMeu).slideToggle();
    })
    $("#menu-04").click(function(){
        $("#menu-04 > i").toggleClass('rotate-90')

        var subMeu = $("#sub-04");
        $(subMeu).slideToggle();
    })
    $("#menu-05").click(function(){
        $("#menu-05 > i").toggleClass('rotate-90')

        var subMeu = $("#sub-05");
        $(subMeu).slideToggle();
    })


    //Drop info user
    $("#dropdown-action").click(function(){

        if($("#li-info-user-drop").is(':visible')){
            $("#li-info-user-drop").fadeOut()
        }else{
            $("#li-info-user-drop").fadeIn().css({'display':'flex'})
        }
        //$("#li-info-user-drop").toggle();
        $("#toggle-user").toggleClass('rotate-90')
    })


    //Menu click body
    $('#section-body-main').click(function(){
        if($("#menu-action-main").is(':visible')){

            var classeSetarMenu = "ri-menu-line";
            $("#menu-action").removeClass().addClass(classeSetarMenu);

            $("#menu-action-main").animate({width: "toggle"},200);
        }

        //Box notifications
        if($("#notification-container-box").is(':visible')){
            $("#notification-container-box").fadeOut()
        }
    })
    //Menu
    $("#menu-action").click(function(){
        var classeSetada = $("#menu-action").attr('class');

        var classeSetarClose = "ri-close-fill";
        var classeSetarMenu = "ri-menu-line";

        if(classeSetada == classeSetarMenu){
            $("#menu-action").removeClass().addClass(classeSetarClose);
        }else{
            $("#menu-action").removeClass().addClass(classeSetarMenu);
        }

        $("#menu-action-main").animate({width: "toggle"},200);
    })

    //Spin loader
    $(".class-loader").click(function(){
        $("#sys-section-loader").fadeIn();
    })
    //function spin
    $.fn.loadSpin = function(command){
        if(command == 1){
            $("#sys-section-loader").fadeIn();  
        }else{
            $("#sys-section-loader").fadeOut();
        }
        
    }

    $.fn.searchInputTable = function(tableRows, inputSearchTable){
        
        const rows = $(''+tableRows+'');
        $(inputSearchTable).keyup(function() {
            
            if($(this).val() != ''){
                console.log('fechar')
                $.fn.closePagination(0)//Fechar a paginação
            }else{
                console.log('abrir')
                $.fn.closePagination(1)//Abrir a paginação
            }

            var val = $.trim($(this).val()).replace(/ +/g, ' ').toLowerCase();
            
            rows.show().filter(function() {
                var text = $(this).text().replace(/\s+/g, ' ').toLowerCase();

                return !~text.indexOf(val);
            }).hide();
        });

        
    }

    $.fn.searchInputTableInputs = function(tableRows, inputSearchTable, commandButton){

        var $rows = $(tableRows+' tr')

        let convertString = $(inputSearchTable).val().toLowerCase().replace(/\b[a-z]/g, function(txtjq) {
            return txtjq.toUpperCase();
        });

        var searchText = convertString;
        $rows
        .show()
        .filter(function() {
            
            var $inputs = $(this).find("input:text");

            var found = searchText.length == 0; // for empty search, show all rows

            for (var i=0; i < $inputs.length && !found; i++) {
                var seqc = $inputs.eq(i).val().toLowerCase();

                var text = seqc.replace(/\b[a-z]/g, function(txtjq) {
                    return txtjq.toUpperCase();
                });

                found = text.length > 0 && text.indexOf(searchText) >= 0;
            }
            return !found;
        })
        .hide();
        
        $.fn.closePagination()
        $.fn.loadSpin(0)
        var $rows = $(tableRows+' tr')

        /////////////////////////////////////////////////
        /////////////////////////////////////////////////
        //Valida se é por button ou digitando
        if(commandButton == 1){
            $(inputSearchTable).keyup(function() {
                var searchText = $(this).val()
                    $rows
                    .show()
                    .filter(function() {
                    var $inputs = $(this).find("input:text");
                    var found = searchText.length == 0; // for empty search, show all rows
                    for (var i=0; i < $inputs.length && !found; i++) {
                        var text = $inputs.eq(i).val().replace(/\s+/g, ' ');
                        found = text.length > 0 && text.indexOf(searchText) >= 0;
                    }
                    return !found;
                })
                .hide();
                //console.log('final 2')
            });
        }

    }

    ///////////////////////////////////////////////////////////////////////
    currentRow = 0;//contagem de linhas
    let arrayItemDinamic;

    //Validação para editar pedido
    $.fn.functionSetDinamic = function(action, array){
        if(action == true){
            arrayItemDinamic = array;//Array de itens dinamicos de pedidos ja criados
        }else{
            arrayItemDinamic = [];//Array de itens dinamicos
        }
    }

    Removeitem = function(handler, idItem) {
        parseInt(idItem);

        arrayItemDinamic.splice(arrayItemDinamic.indexOf(idItem), 1);

        let tr = $(handler).closest('tr');
        tr.fadeOut(400, function(){ 
            currentRow--;
            tr.remove();
        }); 
        
        return false;
    };

    
    addItemTable = function(itemAmount, itemName, tableId, sectionView, arrayItems) {

        //Inputs
        let selectInputItem = $("#"+itemName+"");
        let selectInputAmount = $("#"+itemAmount+"");

        //Pegando os valores
        let itemInsert = selectInputItem.val();
        let itemInsertID = parseInt(selectInputItem.val().split(' - ')[0]);
        let itemInsertName = selectInputItem.val().split(' - ')[1];
        let amountInsert = selectInputAmount.val();

        //Validando se ele existe no array
        if(arrayItems.indexOf(itemInsert) >= 0){

            if(amountInsert <= 0){

                //quantidade inválida
                //$("#"+itemName+"").val('');//Limpando o input name
                $("#"+itemAmount+"").val('');//Limpando o input amount
                $.fn.sys_popupSystem("SYS02", "Insira uma quantidade válida")
            }else{
                //Verificando se o item é repetido
                
                if(arrayItemDinamic.indexOf(itemInsertID) >= 0){

                    //item repetido
                    $("#"+itemName+"").val('');//Limpando o input name
                    $("#"+itemAmount+"").val('');//Limpando o input amount
                    $.fn.sys_popupSystem("SYS02", "O item já foi inserido")
                }else{

                    //Mostrando a tabela

                    if(sectionView != false){
                        if(!$("#"+sectionView+"").is(':visible')){
                            $("#"+sectionView+"").css("display","block");
                        }
                    }
                    
                    let newRow = $("<tr>");
                    let cols = "";
        
                    cols += '<td>'+itemInsertID+'</td>';
                    cols += '<td><input class="req-input-large" readonly type="text" value="'+itemInsertName+'" name="req-input-list-item-table"></td>';
                    cols += '<td><div class="req-table-inputs"><input type="number" value="'+amountInsert+'" name="req-input-list-amount-table" min="1"></div></td>';
                    cols += '<td><div class="req-container-actions"><button type="button" title="Remover item" onclick="Removeitem(this, '+itemInsertID+') "><i class="ri-delete-bin-line"></i></button></div></td>';
        
                    newRow.append(cols);
                    $("#"+tableId+"").append(newRow);
                    ++currentRow;//contando as linhas
                    arrayItemDinamic.push(parseInt(itemInsertID));//Criando um array de itens

                    $("#"+itemName+"").val('');//Limpando o input name
                    $("#"+itemAmount+"").val('');//Limpando o input amount
                }
            }
        }else{
            //item não encontrado
            $("#"+itemName+"").val('');//Limpando o input name
            $("#"+itemAmount+"").val('');//Limpando o input amount
            $.fn.sys_popupSystem("SYS02", "O item não foi encontrado")
        }



        

    };

/* 
    /////////////////////////////////////////////////////////////////////////////////////////////////////
    //Adicionando um novo filtro
    let arrayListFilter = [];//Array que contabiliza os filtros adicionados

    //Buscar se existe filtros existes de acordo com a pagina que o usuario esta
    $.fn.searchFiltersCookies = function (displayMain, contentBox, nameSelect){

        //alert(Cookies.get('COOKIE-FILTER-MODULE-'+nameSelect))

        let dataHTMLfilters;
        //passando por cada name select inserido
        nameSelect.forEach(element => {
            
            if(Cookies.get('COOKIE-FILTER-MODULE-'+element) != undefined){
                //console.log('tem dados')
                dataHTMLfilters = Cookies.get('COOKIE-FILTER-MODULE-'+element)

                //console.log('COOKIE-FILTER-MODULE-'+nameSelect)

                $("#"+displayMain+"").fadeIn();
                $("#"+contentBox+"").append(dataHTMLfilters)

                

            }else{
                dataHTMLfilters = ''
            }
        });


        //console.log($("#"+contentBox+"").children().length)

        $("#"+contentBox+"").children().each(function(){
            arrayListFilter.push($(this).attr('sys-get-filter'))
            //console.log($(this).attr('sys-get-filter'))
        })

        //alert(arrayListFilter)

        //return dataHTMLfilters;
    }
    
    //Filtros dinamicos para consultas
    $.fn.clickADDInputDinamic = function(displayMain, classBox, selectId, nameSelect){

        const componentOne = $("#"+displayMain+"");//Display principal
        const componentTwo = $("#"+classBox+"");//Component box
        const componentThree = $("#"+selectId+"");//Option selecionado
        const componentFour = nameSelect;//Nome do select

        //console.log(typeof(componentFour))

        //Extraindo valores e textos do option selecionado
        let valCompOne = componentThree.val();
        let textCompOne = $("#"+selectId+' :selected').text();

        //Validando se estão vazios
        if(valCompOne != "" && textCompOne != ""){
            valCompOne = parseInt(valCompOne);//Tranformando a string em int

            let validadeFilter = componentFour+"-"+valCompOne;//Nome mais valor do option

            if(arrayListFilter.indexOf(validadeFilter) == -1){
                //Verificando se o display principal esta visivel
                let componentVisible = componentOne.is(':visible');

                if(!componentVisible){
                    //console.log("Display não visivel")
                    componentOne.fadeIn();//Exibindo o display principal
                }

                arrayListFilter.push(componentFour+"-"+valCompOne);//Adicionando o option a uma lista de filtros adicionados
                let componetHTML = '<div class="sys-filter-box-main" sys-get-filter="'+validadeFilter+'" filter-name="'+componentFour+'" id="box-id-'+validadeFilter+'"><input type="hidden" readonly value="'+valCompOne+'" name="sys-filter-input-selects-'+componentFour+'"><span><b>'+componentFour+'</b> - '+textCompOne+'</span><button type="button" value="'+valCompOne+'" class="sys-filter-button-remove" onclick="$(this).clickREMOVEInputDinamic('+'`'+componentFour+'`'+','+valCompOne+','+'`'+classBox+'`'+')">x</button> </div>';
                componentTwo.append(componetHTML)
                //Filtro aplicado com sucesso!

                /* *************************************************** 
                /* *************************************************** 
                //Agora vamos criar um cookie para sempre este filtro aparecer mesmo com o reload da página!
                //Validando se o COOKIE deste SELECT tem algo
                if(Cookies.get('COOKIE-FILTER-MODULE-'+nameSelect) != undefined){
                    //Este cookie tem algo

                    let valueCookieGet = Cookies.get('COOKIE-FILTER-MODULE-'+nameSelect);
                    
                    //Definindo o cookie novamente
                    Cookies.set('COOKIE-FILTER-MODULE-'+nameSelect, valueCookieGet+componetHTML)
                }else{
                    //Este cookie não exite
                    Cookies.set('COOKIE-FILTER-MODULE-'+nameSelect, componetHTML)
                }
                /* *************************************************** 
                /* *************************************************** 

            }else{
                //Filtro já adicionado
                $.fn.sys_popupSystem("SYS02", "Filtro já adicionado")
            }
        }else{
            console.log("Options inválidos")
            $.fn.sys_popupSystem("SYS02", "Filtro inválido")
        }
    }

    //Removendo um filtro
    $.fn.clickREMOVEInputDinamic = function(nameSelect,valCompOne,boxMainFilters){

        const validadeFilterRemove = nameSelect+'-'+valCompOne;
        
        const tagComponent = $("#box-id-"+validadeFilterRemove);

        arrayListFilter.splice(arrayListFilter.indexOf(validadeFilterRemove), 1);

        tagComponent.remove();

        
        //Removendo o filtro do cookie e redefinindo os valores

        //console.log($("#"+boxMainFilters+"").find('[sys-get-filter="'+nameSelect+'"]').attr('sys-get-filter'))

        //console.log($("#"+boxMainFilters+"").filter('#box-id-'+nameSelect).html())

        $("#"+boxMainFilters+"").each(function(){

            console.log($(this).children().attr('id'))

            if($(this).attr('filter-name') == nameSelect){
                Cookies.set('COOKIE-FILTER-MODULE-'+nameSelect, )
            } 

            
        })

       

        if(Cookies.get('COOKIE-FILTER-MODULE-'+nameSelect) != undefined){
            //Este cookie tem algo

            let valueCookieGet = Cookies.get('COOKIE-FILTER-MODULE-'+nameSelect);
            
            //Definindo o cookie novamente
            Cookies.set('COOKIE-FILTER-MODULE-'+nameSelect, valueCookieGet+componetHTML)
        }else{
            //Este cookie não exite
            Cookies.set('COOKIE-FILTER-MODULE-'+nameSelect, componetHTML)
        } 

    }

    */

    //Restringir caracteres
    $.fn.inputValidateCaracters = function(input){
        //Compo input so aceita caracteres validos
        var UMregex = new RegExp('[^ 0-9a-zA-ZçÇãÓÍêÊ/ °\b()]', 'g');
        // repare a flag "g" de global, para substituir todas as ocorrências
        $(input).bind('input', function(){
            $(this).val($(this).val().replace(UMregex, ''));
        });
    }

    //SISTEMA DE POPUP {Sucesso, atenção, erro}
    if(Cookies.get("SYS-NOTIFICATION-EXE1") != undefined){
        //Sucesso!!
        const valuesCookiesEXE1 = Cookies.get("SYS-NOTIFICATION-EXE1").split("|");
        $.fn.sys_popupSystem(valuesCookiesEXE1[0], valuesCookiesEXE1[1]);
    }
    if(Cookies.get("SYS-NOTIFICATION-EXE2") != undefined){
        //Sucesso!!
        const valuesCookiesEXE2 = Cookies.get("SYS-NOTIFICATION-EXE2").split("|");
        $.fn.sys_popupSystem(valuesCookiesEXE2[0], valuesCookiesEXE2[1]);
    }
    if(Cookies.get("SYS-NOTIFICATION-EXE3") != undefined){
        //Sucesso!!
        const valuesCookiesEXE3 = Cookies.get("SYS-NOTIFICATION-EXE3").split("|");
        $.fn.sys_popupSystem(valuesCookiesEXE3[0], valuesCookiesEXE3[1]);
    }


    const textHTML = $("#sys-update-text").text()
    $("#sys-update-text").html(textHTML)





    $.fn.inputCaractersValidation = function (input){
        let vazioAnterior = 0;
        $(input).keypress(function(e) {

            if(vazioAnterior == 0){
                var regex = new RegExp("^[a-z0-9_ ]+$");
            }else{
                var regex = new RegExp("^[a-z0-9_]+$");
                vazioAnterior = 0;
            }

            var key = String.fromCharCode(!event.charCode ? event.which : event.charCode);

            if(key == ' '){
                vazioAnterior++
            }

            if (!regex.test(key)) {


                event.preventDefault();
                
                //return false;

                
                if(key == ''){
                    return false;
                }else{
                    $.fn.sys_popupSystem("SYS02","<b>Digite apenas caracteres MINÚSCULOS e NÃO ESPECIAIS</b>")
                }
            }

            var str = $(this).val();
            str = str.replace(/(^|\s|$)(?!de|do|d$)(.)/g, (geral, match1, match2) => match1 + match2.toUpperCase());

            $(this).val(str);
        });
    }


    $.fn.orderByTableColumns = function (tableId, orderByClick){
        var table = $(tableId);
    
        $(orderByClick)
        .wrapInner('<span title="Coluna Ordenada"/>')
        .each(function(){
            
            var th = $(this),
                thIndex = th.index(),
                inverse = false;
            
            th.click(function(){
                
                table.find('tbody td').filter(function(){
                    
                    return $(this).index() === thIndex;
                    
                }).sortElements(function(a, b){
                    
                    return $.text([a]) > $.text([b]) ?
                        inverse ? -1 : 1
                        : inverse ? 1 : -1;
                    
                }, function(){
                    
                    // parentNode is the element we want to move
                    return this.parentNode; 
                    
                });
                
                inverse = !inverse;
                    
            });
                
        });    
    }








})
