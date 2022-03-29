window.onload=start;

function start(){

    let lastUrl = ""; 
    console.log(lastUrl)

    var head=document.querySelector('head');

    var mo = new MutationObserver(function() {
        let url=location.href;
        console.log(url);
        if (url !== lastUrl) {
            lastUrl = url;
            main();
        }
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
        // マップの個別ページ
        else if(document.querySelector('.svelte-n29l0e')!=null){
            var mapCard=document.querySelector('.svelte-n29l0e');
            var beforeTag=mapCard.querySelector('.tag');
            var rank=beforeTag.textContent;
            console.log("pass?");
            if(!rank.match(/★/)){
                var hashElement=mapCard.querySelector('.text-muted');
                let endpoint=`https://predictstarnumber.herokuapp.com/api/hash/${hashElement.textContent}`
                SwapStar(endpoint,beforeTag)
            }
            clearInterval(jsInitCheckTimer);
        }
        // マップ一覧ページ
        else if(document.querySelector('.svelte-18crtdx')!=null){
            var mapCards=document.querySelectorAll('.song-container');
            mapCards.forEach((mapCard) => {
                console.log('pass');
                console.log(mapCard);
                var beforeTag=mapCard.querySelector('.tag');
                var rank=beforeTag.textContent;
                if(!rank.match(/★/)){
                    var songInfo=mapCard.querySelector('.song-info');
                    var leaderboardIdElement=songInfo.querySelector('a');
                    var leaderboardId=leaderboardIdElement.getAttribute("href").replace('/leaderboard/','');
                    let endpoint=`https://predictstarnumber.herokuapp.com/api/leaderboardId/${leaderboardId}`;
                    SwapStar(endpoint,beforeTag)
                }
            });
            clearInterval(jsInitCheckTimer);
        }
        // プレイヤーページのマップ一覧ページ
        else if(document.querySelector('.svelte-1s2wgqz')!=null){
            var mapCards=document.querySelectorAll(".song-container");
            console.log(mapCards[0]);
            // mapCardが配列と似て非なるオブジェクトらしいので
            mapCards.forEach((mapCard) => {
                console.log('pass');
                var beforeTag=mapCard.querySelector('.tag');
                var rank=beforeTag.textContent;
                if(!rank.match(/★/)){
                    var songInfo=mapCard.querySelector('.song-info');
                    var leaderboardIdElement=songInfo.querySelector('a');
                    var leaderboardId=leaderboardIdElement.getAttribute("href").replace('/leaderboard/','');
                    let endpoint=`https://predictstarnumber.herokuapp.com/api/leaderboardId/${leaderboardId}`;
                    SwapStar(endpoint,beforeTag)
                }
            });
            clearInterval(jsInitCheckTimer);
        }
    }
}

function SwapStar(endpoint,beforeTag){
    var difficulty=beforeTag.getAttribute("title");
    
    fetch(endpoint,{
        mode: 'cors',
        method: 'GET'
    }).then((response)=>{
        if(response.ok){
            return response.json();
        }
        else{
            throw new Error(response.statusText);
        }
    }).then((json)=>{
        let predictStar;
        console.log(json);
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
        else if(difficulty=="Expert+"){
            predictStar='('+json.ExpertPlus+')★';
        }
        // 念のため
        else{
            predictStar="?";
        }
        beforeTag.textContent=predictStar;
    }).catch((err)=>{
        console.log(err.message);
        beforeTag.textContent="?";
    })
}