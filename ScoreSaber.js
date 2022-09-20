window.onload = start;

function start() {
    let lastUrl = "";
    console.log(lastUrl);

    var body = document.querySelector("body");

    var mo = new MutationObserver(function () {
        let url = location.href;
        console.log(url);
        if (url !== lastUrl) {
            lastUrl = url;
            main();
        }
    });
    var config = {
        subtree: true,
        attributes: true,
    };
    mo.observe(body, config);
}

function main() {
    console.log("main fired");
    let retryCount = 0;
    const maxRetry = 5;
    const jsInitCheckTimer = setInterval(jsLoaded, 1000);
    function jsLoaded() {
        if (
            document.querySelector(".media-content.is-clipped") == null &&
            document.querySelector(".song-container") == null
        ) {
            retryCount++;
            if (retryCount == maxRetry) {
                console.log("５秒間必要な要素が見つからなかったので終了");
                clearInterval(jsInitCheckTimer);
            }
        }
        // マップのリーダーボードorランクリクエストの譜面の固有のページ
        else if (document.querySelector(".media-content.is-clipped") != null) {
            SwapForLeaderboard(jsInitCheckTimer);
        }
        // プレイヤーページのマップ一覧ページorマップ一覧ページ
        else if (document.querySelector(".song-container") != null) {
            SwapForMapList(jsInitCheckTimer);
        }
    }
}

function SwapForMapList(jsInitCheckTimer) {
    const mapListUrl = "https://scoresaber.com/leaderboards";
    const usersMapListUrl = "https://scoresaber.com/u";
    if (
        !location.href.includes(mapListUrl) &&
        !location.href.includes(usersMapListUrl)
    )
        return;

    var mapCards = document.querySelectorAll(".song-container");
    mapCards.forEach((mapCard) => {
        console.log("pass");
        console.log(mapCard);
        var beforeTag = mapCard.querySelector(".tag");
        var rank = beforeTag.textContent;

        if (!rank.includes("★") || rank.includes(")★")) {
            var songInfo = mapCard.querySelector(".song-info");
            var leaderboardIdElement = songInfo.querySelector("a");
            var leaderboardId = leaderboardIdElement
                .getAttribute("href")
                .replace("/leaderboard/", "");
            const endpoint = `https://predictstarnumber.herokuapp.com/api2/leaderboardId/${leaderboardId}`;

            // ScoreSaberもスタンダードがデフォみたいなのでスタンダードにしておきます
            SwapTagName(endpoint, "Standard", beforeTag);
        }
    });
    clearInterval(jsInitCheckTimer);
}

function SwapForLeaderboard(jsInitCheckTimer) {
    const leaderboardUrl = "https://scoresaber.com/leaderboard";
    const requestUrl = "https://scoresaber.com/ranking/request";
    if (
        !location.href.includes(leaderboardUrl) &&
        !location.href.includes(requestUrl)
    )
        return;

    let characteristic = "";

    // ランク譜面でLawlessは今までないので（そういう決まり？）
    if (location.href.includes(requestUrl)) characteristic = "Standard";
    else {
        let cardContent = document.querySelector(".window.card-content");
        let content = cardContent.querySelector("div.content");
        let bs = content.querySelectorAll("b");
        bs.forEach((b) => {
            if (b.textContent.includes("Standard")) {
                characteristic = "Standard";
            } else if (b.textContent.includes("Lawless")) {
                characteristic = "Lawless";
            } else if (b.textContent.includes("Lightshow")) {
                characteristic = "Lightshow";
            } else if (b.textContent.includes("NoArrows")) {
                characteristic = "NoArrows";
            } else if (b.textContent.includes("OneSaber")) {
                characteristic = "OneSaber";
            } else if (b.textContent.includes("90Degree")) {
                characteristic = "90Degree";
            } else if (b.textContent.includes("360Degree")) {
                characteristic = "360Degree";
            }
        });
    }

    var mapCard = document.querySelector(".media-content.is-clipped");
    var beforeTag = mapCard.querySelector("div.tag");
    var rank = beforeTag.textContent;
    console.log("pass?");

    if (!rank.includes("★") || rank.includes(")★")) {
        var titleElement = mapCard.querySelector(".title");
        var leaderboardIdElement = titleElement.querySelector("a");
        var leaderboardId = leaderboardIdElement
            .getAttribute("href")
            .replace("/leaderboard/", "");
        const endpoint = `https://predictstarnumber.herokuapp.com/api2/leaderboardId/${leaderboardId}`;
        SwapTagName(endpoint, characteristic, beforeTag);
    }
    clearInterval(jsInitCheckTimer);
}

function SwapTagName(endpoint, characteristic, beforeTag) {
    var difficulty = beforeTag.getAttribute("title");

    fetch(endpoint, {
        mode: "cors",
        method: "GET",
    })
        .then((response) => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error(response.statusText);
            }
        })
        .then((json) => {
            let predictStar;
            console.log(json);
            if (difficulty == "Easy") {
                predictStar = "(" + json[`${characteristic}-Easy`] + ")★";
            } else if (difficulty == "Normal") {
                predictStar = "(" + json[`${characteristic}-Normal`] + ")★";
            } else if (difficulty == "Hard") {
                predictStar = "(" + json[`${characteristic}-Hard`] + ")★";
            } else if (difficulty == "Expert") {
                predictStar = "(" + json[`${characteristic}-Expert`] + ")★";
            } else if (difficulty == "Expert+") {
                predictStar = "(" + json[`${characteristic}-ExpertPlus`] + ")★";
            }
            // 念のため
            else {
                predictStar = "?";
            }
            beforeTag.textContent = predictStar;
        })
        .catch((err) => {
            console.log(err.message);
            beforeTag.textContent = "?";
        });
}
