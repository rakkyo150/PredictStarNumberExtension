window.onload = start;

function start() {
    console.log("start");
    let lastUrl = "";
    const main = document.querySelector("main");

    const mo = new MutationObserver(function () {
        const url = location.href;
        console.log(url);
        if (url == lastUrl) return;

        lastUrl = url;
        core();
    });
    const config = {
        childList: true,
    };
    mo.observe(main, config);
}

function core() {
    let retryCount = 0;
    const maxRetry = 5;
    const jsInitCheckTimer = setInterval(jsLoaded, 1000);
    function jsLoaded() {
        if (document.querySelector(".stats") == null) {
            retryCount++;
            if (retryCount != maxRetry) return;

            console.log("５秒間必要な要素が見つからなかったので終了");
            clearInterval(jsInitCheckTimer);
            return;
        }

        const oneClickUrl = document
            .querySelector('a[title="One-Click"]')
            .getAttribute("href");
        const id = oneClickUrl.replace("beatsaver://", "");
        if (id == null) {
            console.log("idを取得できませんでした");
            clearInterval(jsInitCheckTimer);
            return;
        }

        const endpoint = `https://predictstarnumber.onrender.com/api2/id/${id}`;
        fetch(endpoint, {
            mode: "cors",
            method: "GET",
        })
            .then((response) => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error();
                }
            })
            .then((json) => {
                const mapStats = document.querySelector(".mapstats");
                const difficultyList =
                    mapStats.querySelectorAll(".list-group-item");

                if (difficultyList == null) {
                    console.log("マップの種類を取得できませんでした");
                    clearInterval(jsInitCheckTimer);
                    return;
                }

                difficultyList.forEach(function (difficultyItem) {
                    if (difficultyItem.querySelector(".diff-stars") != null) {
                        clearInterval(jsInitCheckTimer);
                        return;
                    }

                    let starNumber = "";

                    starNumber = GetStarNumber(difficultyItem, json);

                    const stats = difficultyItem.querySelector(".stats");
                    console.log(stats);

                    const starSpan = document.createElement("span");
                    starSpan.classList.add("diff-stars");
                    starSpan.textContent = "(" + starNumber + ")";

                    SetStyle(starSpan);

                    const starI = document.createElement("i");
                    starI.classList.add("fas");
                    starI.classList.add("fa-star");
                    starSpan.prepend(starI);

                    difficultyItem.insertBefore(starSpan, stats);
                });
            });
        clearInterval(jsInitCheckTimer);
    }
}

function SetStyle(starSpan) {
    starSpan.style.margin = "0px auto";
    starSpan.style.paddingLeft = "5px";
    starSpan.style.paddingRight = "5px";
    starSpan.style.paddingTop = "0px";
    starSpan.style.paddingBottom = "0px";
    starSpan.style.textAlign = "center";
}

function GetStarNumber(difficultyItem, json) {
    let starNumber = "";

    if (difficultyItem.querySelector('img[title~="Expert+"]') != null) {
        starNumber = GetStarNumberHelper(difficultyItem, "Expert+", json);
    } else if (difficultyItem.querySelector('img[title~="Expert"]') != null) {
        starNumber = GetStarNumberHelper(difficultyItem, "Expert", json);
    } else if (difficultyItem.querySelector('img[title~="Hard"]') != null) {
        starNumber = GetStarNumberHelper(difficultyItem, "Hard", json);
    } else if (difficultyItem.querySelector('img[title~="Normal"]') != null) {
        starNumber = GetStarNumberHelper(difficultyItem, "Normal", json);
    } else if (difficultyItem.querySelector('img[title~="Easy"]') != null) {
        starNumber = GetStarNumberHelper(difficultyItem, "Easy", json);
        // 念のため
    } else {
        starNumber = "?";
        console.log(starNumber);
    }
    return starNumber;
}

function GetStarNumberHelper(difficultyItem, difficulty, json) {
    // 変数使うにはCSS.escapeでくくらないと、Uncaught DOMException:
    // Failed to execute 'querySelectorAll' on 'Document'のエラー出てくる
    const characteristicImg = difficultyItem.querySelector(
        `img[title~=${CSS.escape(difficulty)}]`,
    );

    console.log(difficulty);

    const characteristic = characteristicImg
        .getAttribute("title")
        .replace(`${difficulty} `, "");

    if (difficulty == "Expert+") difficulty = "ExpertPlus";

    const starNumber = json[`${characteristic}-${difficulty}`];
    console.log(starNumber);
    return starNumber;
}
