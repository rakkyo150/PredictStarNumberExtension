window.onload=start;

function start(){
    var head=document.querySelector('head');

    var mo = new MutationObserver(function() {
    main();
    });
    var config = {
    childList: true
    };
    mo.observe(head, config);
}

function main(){
    let retryCount=0;
    const maxRetry=5;
    const jsInitCheckTimer = setInterval(jsLoaded, 1000);
    function jsLoaded() {
        if(document.querySelector('.svelte-n29l0e')==null &&
        document.querySelector('.svelte-18crtdx')==null &&
        document.querySelector('.svelte-1s2wgqz')==null){
            retryCount++;
            if(retryCount ==maxRetry){
                console.log("５秒間必要な要素が見つからなかったので終了");
                clearInterval(jsInitCheckTimer);
            }
        }
        else if(document.querySelector('.svelte-n29l0e')!=null){
            var mapCard=document.querySelector('.svelte-n29l0e');
            var beforeTag=mapCard.querySelector('.tag');
            var difficulty=beforeTag.getAttribute("title");
            var rank=beforeTag.textContent;
            console.log("pass?");
            if(!rank.match(/★/)){
                var hashElement=mapCard.querySelector('.text-muted');
                let endpoint=`https://predictstarnumber.herokuapp.com/api/hash/${hashElement.textContent}`
                fetch(endpoint,{
                    mode: 'cors',
                    method: 'GET'
                }).then((response)=>{
                    if(response.ok){
                        return response.json();
                    }
                    throw new Error();
                }).then((json)=>{
                    let predictStar;
                    if(difficulty=="Easy"){
                        predictStar='('+json.Easy+')★';
                    }
                    else if(difficulty=="Normal"){
                        predictStar='('+json.Normal+')★';
                    }
                    else if(difficulty=="Hard"){
                        predictStar='('+json.Hard+')★';
                    }
                    else if(difficulty=="Expert"){
                        predictStar='('+json.Expert+')★';
                    }
                    else if(difficulty="Expert+"){
                        predictStar='('+json.ExpertPlus+')★';
                    }
                    else{
                        predictStar="?";
                    }
                    beforeTag.textContent=predictStar;
                })
            }
            clearInterval(jsInitCheckTimer);
        }
    }
}