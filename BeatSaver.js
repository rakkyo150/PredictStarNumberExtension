window.addEventListener("load", main, false);

function main(){
    const jsInitCheckTimer = setInterval(jsLoaded, 1000);
    function jsLoaded() {
        if (document.querySelector(".color") != null) {
            console.log("ok");
            var rank=document.querySelector(".color");
            console.log(rank)

            console.log("アンランク譜面");
            let oneClickUrl=document.querySelector('a[title="One-Click"]').getAttribute('href');
            let id=oneClickUrl.replace('beatsaver://','')
            if(id==null){
                console.log("idを取得できませんでした");
            }
            else{
                let endpoint=`https://predictstarnumber.herokuapp.com/api/${id}`
                fetch(endpoint,{
                    mode: 'cors',
                    method: 'GET'
                }).then((response)=>{
                    if(response.ok){
                        console.log(response.text);
                        console.log(response.json());
                        return response.json();
                    }
                    throw new Error();
                    console.log(response);
                }).then((json)=>{
                    console.log(key + ": " + obj[key]);
                    var difficultyList =document.querySelectorAll('.list-group-item');
                    if(difficultyList==null){
                        console.log("マップの種類を取得できませんでした");
                    }
                    else{
                        difficultyList.forEach(function (difficultyItem){
                            let starNumber;
                            if(difficultyItem.querySelector('img[title="Expert+"]')!=null){
                                starNumber=json.ExpertPlus;
                            }
                            else if(difficultyItem.querySelector('img[title="Expert"]')!=null){
                                starNumber=json.Expert;
                            }
                            else if(difficultyItem.querySelector('img[title="Hard"]')!=null){
                                starNumber=json.Hard;
                            }else if(difficultyItem.querySelector('img[title="Normal"]')!=null){
                                starNumber=json.Normal;
                            }
                            else if(difficultyItem.querySelector('img[title="easy"]')!=null){
                                starNumber=json.Easy;
                            }else{
                                starNumber="?";
                            }
                            var stats=difficultyItem.querySelector('.stats');
                            var starSpan=document.createElement('span');
                            starSpan.classList.add('diff-stars');
                            var starI=starSpan.createElement('i');
                            starI.classList.add('fas fa-star');
                            starSpan.textContent='('+starNumber+')';
                        })
                    }
                })
            }
            clearInterval(jsInitCheckTimer);
        }
    }
}