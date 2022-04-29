
let arrayDataFilter = [];//Array responsavel pelo armazenamento dos filtros

//Função faz a busca e retorna o valor ou null
function valideDataFilterArray(searchCode){
    let index = arrayDataFilter.map(function(e) { return e.code; }).indexOf(searchCode)
    return arrayDataFilter[index] == undefined ? null : [index, arrayDataFilter[index]];
}

/* 
{
    code: 'codigo do filtro em INT',
    value:'valor do input',
    title-text:'titulo do filtro',
    name-text:'descrição do filtro',
    name-input: 'nome do input'
}
*/


$.fn.systemAddFiltersDinamics = function (boxMainFilter, contentBoxFilters, selectFilter, nameTagFilters, nameIdentify, pageFilterIdentify){

    let sysBoxMainFilter = $(`#${boxMainFilter}`) //Box main (1°)
    let sysContentBoxFilters = $(`#${contentBoxFilters}`) //Content Box (2°)
    let sysSelectFilter = $(`#${selectFilter}`) //Id do select
    let sysNameTagFilters = nameTagFilters //Tag no input do filtro
    let sysNameIdentify = nameIdentify //Nome de identificação deste filtro

    //Pegando o VALUE e TEXT do select
    let getSelectValue = sysSelectFilter.val()
    let getSelectText = sysSelectFilter.children("option:selected").text();

    try {
        
        //Validando se o option é vazio
        if(getSelectValue == '' || getSelectText == ''){
            throw {"SYS02":"Escolha um filtro válido"}
        }

        //Codigo unico do filtro
        let codeFilterSet = 'filter-'+sysNameIdentify+'-'+getSelectValue;

        //Validando se este select já foi adicionado
        if(valideDataFilterArray(codeFilterSet) == null){

            //Filtro pode ser adicionado

            //Estrutura do box do option
            //TAGS:
            //sys-filter-name-box: nome individual de cada box (ex: sys-filter-unidade, sys-filter-gestor, etc)
            //sys-filter-name-code: codigo do filtro no contexto (ex: filter-unidade-1, filter-unidade-2)

            //Adicionando as informações no array
            arrayDataFilter.push({
                'code': codeFilterSet,
                'value': getSelectValue,
                'title-text': sysNameIdentify,
                'name-text': getSelectText,
                'name-input': sysNameTagFilters,
                'name-app': pageFilterIdentify
            })

            //Criando um cookie para salvar estas informações
            Cookies.set('COOKIE-FILTER-MODULE-'+pageFilterIdentify, JSON.stringify(arrayDataFilter))


            //Adicionando o filtro no HTML
            let optionBoxHTMLDefault = 
            `<div class="sys-filter-box-main" id="${codeFilterSet}">
                <input type="hidden" readonly value="${getSelectValue}" name="${sysNameTagFilters}">
                <div>
                    <b>${sysNameIdentify}</b>
                    <span>${getSelectText}</span>    
                </div>
                <button type="button" value="${codeFilterSet}" class="sys-filter-button-remove" onclick="$(this).systemRemoveFiltersDinamics('${codeFilterSet}','${pageFilterIdentify}')">x</button>
            </div>`;
            sysContentBoxFilters.append(optionBoxHTMLDefault)

        }else{
            throw {"SYS02":"Filtro já adicionado"}
        }

        //Verificando se o display principal esta visivel
        sysBoxMainFilter.is(':visible') == false ? sysBoxMainFilter.fadeIn() : 'nd'//faça nada

    } catch (error) {
        
        //Msg de erro
        $.fn.sys_popupSystem(Object.keys(error)[0], Object.values(error)[0])

    }

}

$.fn.systemRemoveFiltersDinamics = function (codeFilter, appPage) {

    $.fn.loadSpin(1)
    
    //Removendo o filtro do array
    let resultValidation = valideDataFilterArray(codeFilter)
    //console.log(resultValidation[0])
    arrayDataFilter.splice(resultValidation[0], 1);

    if(arrayDataFilter.length < 1){
        //Removendo cookie
        Cookies.remove('COOKIE-FILTER-MODULE-'+appPage)  
    }

    //Reajustando o cookie
    Cookies.set('COOKIE-FILTER-MODULE-'+appPage, JSON.stringify(arrayDataFilter))
    
    //Removendo html
    $(`#${codeFilter}`).fadeOut(function(){
        setTimeout(() => {
            $.fn.loadSpin(0)
            $(this).remove()
        }, 200);
    })
}

$.fn.searchFiltersDinamics = function (appPage, displayMain, displayContent){

    let resultConsult =  Cookies.get('COOKIE-FILTER-MODULE-'+appPage) == undefined ? null : JSON.parse(Cookies.get('COOKIE-FILTER-MODULE-'+appPage))
    if(resultConsult != null){

        //Adicionando os filtros no array
        arrayDataFilter = resultConsult;
        
        //Verificando se o display principal esta visivel
        $(`#${displayMain}`).is(':visible') == false ? $(`#${displayMain}`).fadeIn() : 'nd'//faça nada


        /* 
        {
            code: 'codigo do filtro em INT',
            value:'valor do input',
            title-text:'titulo do filtro',
            name-text:'descrição do filtro',
            name-input: 'nome do input'
        }
        */

        resultConsult.forEach(element => {

            $(`#${displayContent}`).append(
            `<div class="sys-filter-box-main" id="${element.code}">
                <input type="hidden" readonly value="${element.value}" name="${element['name-input']}">
                <div>
                    <b>${element['title-text']}</b>
                    <span>${element['name-text']}</span>    
                </div>
                <button type="button" value="${element.code}" class="sys-filter-button-remove" onclick="$(this).systemRemoveFiltersDinamics('${element.code}','${element['name-app']}')">x</button>
            </div>`
            )
        });
    }

}