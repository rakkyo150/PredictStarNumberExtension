window.onload=start;

function start(){

    let lastUrl = ""; 
    console.log(lastUrl)

    var body=document.querySelector('body');

    var mo = new MutationObserver(function() {
        let url=location.href;
        console.log(url);
        if (url !== lastUrl) {
            lastUrl = url;
            main();
        }
    });
    var config = {
    subtree:true,
    attributes:true,
    };
    mo.observe(body, config);
}

function main(){
    console.log("main fired");
    let retryCount=0;
    const maxRetry=5;
    const jsInitCheckTimer = setInterval(jsLoaded, 1000);
    function jsLoaded() {
        if(document.querySelector('.media-content.is-clipped')==null &&
        document.querySelector('.song-container')==null){
            retryCount++;
            if(retryCount ==maxRetry){
                console.log("５秒間必要な要素が見つからなかったので終了");
                clearInterval(jsInitCheckTimer);
            }
        }
        // マップのリーダーボードorランクリクエストの譜面の固有のページ
        else if(document.querySelector('.media-content.is-clipped')!=null){
            PredictStarNumberForLeaderboard(jsInitCheckTimer);
        }
        // プレイヤーページのマップ一覧ページorマップ一覧ページ
        else if(document.querySelector('.song-container')!=null){
            PredictStarNumberForMapList(jsInitCheckTimer);
        }
    }
}

function PredictStarNumberForMapList(jsInitCheckTimer) {
    const mapListUrl='https://scoresaber.com/leaderboards';
    const usersMapListUrl='https://scoresaber.com/u';
    if(!location.href.includes(mapListUrl) && !location.href.includes(usersMapListUrl)) return;
    
    var mapCards = document.querySelectorAll('.song-container');
    mapCards.forEach((mapCard) => {
        console.log('pass');
        console.log(mapCard);
        var beforeTag = mapCard.querySelector('.tag');
        var rank = beforeTag.textContent;
        
        if (!rank.includes('★') || rank.includes(')★')) {
            var songInfo = mapCard.querySelector('.song-info');
            var leaderboardIdElement = songInfo.querySelector('a');
            var leaderboardId = leaderboardIdElement.getAttribute("href").replace('/leaderboard/', '');
            const endpoint = `https://predictstarnumber.herokuapp.com/api/leaderboardId/${leaderboardId}`;
            SwapStar(endpoint, beforeTag);
        }
    });
    clearInterval(jsInitCheckTimer);
}

function PredictStarNumberForLeaderboard(jsInitCheckTimer) {
    const leaderboardUrl='https://scoresaber.com/leaderboard';
    const requestUrl='https://scoresaber.com/ranking/request';
    if(!location.href.includes(leaderboardUrl) && !location.href.includes(requestUrl)) return;

    var mapCard = document.querySelector('.media-content.is-clipped');
    var beforeTag = mapCard.querySelector('.tag');
    var rank = beforeTag.textContent;
    console.log("pass?");
    

    if (!rank.includes('★') || rank.includes(')★')) {
        var titleElement = mapCard.querySelector('.title');
        var leaderboardIdElement = titleElement.querySelector('a');
        var leaderboardId = leaderboardIdElement.getAttribute('href').replace('/leaderboard/', '');
        const endpoint = `https://predictstarnumber.herokuapp.com/api/leaderboardId/${leaderboardId}`;
        SwapStar(endpoint, beforeTag);
    }
    clearInterval(jsInitCheckTimer);
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