window.onload=start;

function start(){
    console.log("start");
    var main=document.querySelector('main');

    var mo = new MutationObserver(function() {
    mainmain();
    });
    var config = {
    childList: true
    };
    mo.observe(main, config);
}

function mainmain(){
    let retryCount=0;
    const maxRetry=5;
    const jsInitCheckTimer = setInterval(jsLoaded, 1000);
    function jsLoaded() {
        if(document.querySelector('.stats')==null){
            retryCount++;
            if(retryCount ==maxRetry){
                console.log("５秒間必要な要素が見つからなかったので終了");
                clearInterval(jsInitCheckTimer);
            }
        }
        else if (document.querySelector('.stats')!=null){

            let oneClickUrl=document.querySelector('a[title="One-Click"]').getAttribute('href');
            let id=oneClickUrl.replace('beatsaver://','')
            if(id==null){
                console.log("idを取得できませんでした");
            }
            else{
                let endpoint=`https://predictstarnumber.herokuapp.com/api/id/${id}`
                fetch(endpoint,{
                    mode: 'cors',
                    method: 'GET'
                }).then((response)=>{
                    if(response.ok){
                        console.log(response.text);
                        return response.json();
                    }
                    throw new Error();
                    console.log(response);
                }).then((json)=>{
                    var mapStats=document.querySelector('.mapstats');
                    var difficultyList =mapStats.querySelectorAll('.list-group-item');
                    
                    let passPredict=false;
                    if(difficultyList==null){
                        console.log("マップの種類を取得できませんでした");
                    }
                    else{
                        difficultyList.forEach(function (difficultyItem){
                            let starNumber;
                            if(difficultyItem.querySelector('.diff-stars')==null){
                                if(difficultyItem.querySelector('img[title="Expert+ Standard"]')!=null){
                                    starNumber=json.ExpertPlus;
                                    console.log(starNumber);
                                }
                                else if(difficultyItem.querySelector('img[title="Expert Standard"]')!=null){
                                    starNumber=json.Expert;
                                    console.log(starNumber);
                                }
                                else if(difficultyItem.querySelector('img[title="Hard Standard"]')!=null){
                                    starNumber=json.Hard;
                                    console.log(starNumber);
                                }else if(difficultyItem.querySelector('img[title="Normal Standard"]')!=null){
                                    starNumber=json.Normal;
                                    console.log(starNumber);
                                }
                                else if(difficultyItem.querySelector('img[title="Easy Standard"]')!=null){
                                    starNumber=json.Easy;
                                    console.log(starNumber);
                                }else{
                                    starNumber="?";
                                    console.log(starNumber);
                                }
                                var stats=difficultyItem.querySelector('.stats');
                                console.log(stats);
                                var starSpan=document.createElement('span');
                                starSpan.classList.add('diff-stars');
                                starSpan.textContent='('+starNumber+')';
                                var starI=document.createElement('i');
                                starI.classList.add('fas');
                                starI.classList.add('fa-star')
                                starSpan.prepend(starI);
                                stats.prepend(starSpan);
                            }
                        })
                    }
                })
            }
            clearInterval(jsInitCheckTimer);
        }
    }
}