window.onload = start;

function start() {
    console.log("start");
    let lastUrl = "";
    var main = document.querySelector("main");

    var mo = new MutationObserver(function () {
        let url = location.href;
        console.log(url);
        if (url !== lastUrl) {
            lastUrl = url;
            core();
        }
    });
    var config = {
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
            if (retryCount == maxRetry) {
                console.log("５秒間必要な要素が見つからなかったので終了");
                clearInterval(jsInitCheckTimer);
            }
        } else if (document.querySelector(".stats") != null) {
            let oneClickUrl = document
                .querySelector('a[title="One-Click"]')
                .getAttribute("href");
            let id = oneClickUrl.replace("beatsaver://", "");
            if (id == null) {
                console.log("idを取得できませんでした");
            } else {
                let endpoint = `https://predictstarnumber.herokuapp.com/api2/id/${id}`;
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
                        var mapStats = document.querySelector(".mapstats");
                        var difficultyList =
                            mapStats.querySelectorAll(".list-group-item");

                        if (difficultyList == null) {
                            console.log("マップの種類を取得できませんでした");
                        } else {
                            difficultyList.forEach(function (difficultyItem) {
                                if (
                                    difficultyItem.querySelector(
                                        ".diff-stars",
                                    ) == null
                                ) {
                                    let starNumber = "";

                                    if (
                                        difficultyItem.querySelector(
                                            'img[title~="Expert+"]',
                                        ) != null
                                    ) {
                                        const characteristicImg =
                                            difficultyItem.querySelector(
                                                `img[title~="Expert+"]`,
                                            );
                                        const characteristic = characteristicImg
                                            .getAttribute("title")
                                            .replace(`Expert+ `, "");
                                        starNumber =
                                            json[
                                                `${characteristic}-ExpertPlus`
                                            ];
                                        console.log(starNumber);
                                    } else if (
                                        difficultyItem.querySelector(
                                            'img[title~="Expert"]',
                                        ) != null
                                    ) {
                                        const characteristicImg =
                                            difficultyItem.querySelector(
                                                `img[title~="Expert"]`,
                                            );
                                        const characteristic = characteristicImg
                                            .getAttribute("title")
                                            .replace(`Expert `, "");
                                        starNumber =
                                            json[`${characteristic}-Expert`];
                                        console.log(starNumber);
                                    } else if (
                                        difficultyItem.querySelector(
                                            'img[title~="Hard"]',
                                        ) != null
                                    ) {
                                        const characteristicImg =
                                            difficultyItem.querySelector(
                                                `img[title~="Hard"]`,
                                            );
                                        const characteristic = characteristicImg
                                            .getAttribute("title")
                                            .replace(`Hard `, "");
                                        starNumber =
                                            json[`${characteristic}-Hard`];
                                        console.log(starNumber);
                                    } else if (
                                        difficultyItem.querySelector(
                                            'img[title~="Normal"]',
                                        ) != null
                                    ) {
                                        const characteristicImg =
                                            difficultyItem.querySelector(
                                                `img[title~="Normal"]`,
                                            );
                                        const characteristic = characteristicImg
                                            .getAttribute("title")
                                            .replace(`Normal `, "");
                                        starNumber =
                                            json[`${characteristic}-Normal`];
                                        console.log(starNumber);
                                    } else if (
                                        difficultyItem.querySelector(
                                            'img[title~="Easy"]',
                                        ) != null
                                    ) {
                                        const characteristicImg =
                                            difficultyItem.querySelector(
                                                `img[title~="Easy"]`,
                                            );
                                        const characteristic = characteristicImg
                                            .getAttribute("title")
                                            .replace(`Easy `, "");
                                        starNumber =
                                            json[`${characteristic}-Easy`];
                                        console.log(starNumber);
                                        // 念のため
                                    } else {
                                        starNumber = "?";
                                        console.log(starNumber);
                                    }
                                    var stats =
                                        difficultyItem.querySelector(".stats");
                                    console.log(stats);

                                    var starSpan =
                                        document.createElement("span");
                                    starSpan.classList.add("diff-stars");
                                    starSpan.textContent =
                                        "(" + starNumber + ")";
                                    starSpan.style.margin = "0px auto";
                                    starSpan.style.paddingLeft = "5px";
                                    starSpan.style.paddingRight = "5px";
                                    starSpan.style.paddingTop = "0px";
                                    starSpan.style.paddingBottom = "0px";
                                    starSpan.style.textAlign = "center";

                                    var starI = document.createElement("i");
                                    starI.classList.add("fas");
                                    starI.classList.add("fa-star");
                                    starSpan.prepend(starI);

                                    difficultyItem.insertBefore(
                                        starSpan,
                                        stats,
                                    );
                                }
                            });
                        }
                    });
            }
            clearInterval(jsInitCheckTimer);
        }
    }
}

/*
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
*/

/*
function GetStarNumberHelper(difficultyItem, difficulty, json) {
    const characteristicImg = difficultyItem.querySelector(
        `img[title~=${difficulty}]`,
    );
    const characteristic = characteristicImg
        .getAttribute("title")
        .replace(`${difficulty} `, "");
    const starNumber = json[`${characteristic}-${difficulty}`];
    console.log(starNumber);
    return starNumber;
}
*/
