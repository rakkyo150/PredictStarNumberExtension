window.onload = start;

function start() {
    let lastUrl = "";
    console.log(lastUrl);

    let body = document.querySelector("body");

    const mo = new MutationObserver(function () {
        let url = location.href;
        console.log(url);
        if (url == lastUrl) return;

        lastUrl = url;
        main();
    });
    const config = {
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
            if (retryCount != maxRetry) return;

            console.log("５秒間必要な要素が見つからなかったので終了");
            clearInterval(jsInitCheckTimer);
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

    const mapCards = document.querySelectorAll(".song-container");
    mapCards.forEach((mapCard) => {
        console.log("pass");
        console.log(mapCard);
        const beforeTag = mapCard.querySelector(".tag");
        const rank = beforeTag.textContent;

        if (rank.includes("★") && !rank.includes(")★")) return;

        const songInfo = mapCard.querySelector(".song-info");
        const leaderboardIdElement = songInfo.querySelector("a");
        const leaderboardId = leaderboardIdElement
            .getAttribute("href")
            .replace("/leaderboard/", "");
        const endpoint = `https://predictstarnumber.herokuapp.com/api2/leaderboardId/${leaderboardId}`;

        // ScoreSaberもスタンダードがデフォみたいなのでスタンダードにしておきます
        SwapTagName(endpoint, "Standard", beforeTag);
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

    const mapCard = document.querySelector(".media-content.is-clipped");
    const beforeTag = mapCard.querySelector("div.tag");
    const rank = beforeTag.textContent;
    console.log("pass?");

    if (rank.includes("★") && !rank.includes(")★")) {
        clearInterval(jsInitCheckTimer);
        return;
    }

    const titleElement = mapCard.querySelector(".title");
    const leaderboardIdElement = titleElement.querySelector("a");
    const leaderboardId = leaderboardIdElement
        .getAttribute("href")
        .replace("/leaderboard/", "");
    const endpoint = `https://predictstarnumber.herokuapp.com/api2/leaderboardId/${leaderboardId}`;
    SwapTagName(endpoint, characteristic, beforeTag);

    clearInterval(jsInitCheckTimer);
}

function SwapTagName(endpoint, characteristic, beforeTag) {
    const difficulty = beforeTag.getAttribute("title");

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
