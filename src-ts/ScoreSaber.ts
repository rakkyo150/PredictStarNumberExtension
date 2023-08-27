import { loadModel ,makeHalfBakedData } from "./fetcher";
import init, { StarPredictor } from "../pkg/predict_star_number_extension";

window.onload = startScoreSaber;

const Characteristic = {
    Standard: "Standard",
    Lawless: "Lawless",
    Lightshow: "Lightshow",
    NoArrows: "NoArrows",
    OneSaber: "OneSaber",
    "90Degree": "90Degree",
    "360Degree": "360Degree",
} as const;

type Characteristic = (typeof Characteristic)[keyof typeof Characteristic];

function startScoreSaber() {
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
    mo.observe(body!, config);
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

function SwapForMapList(jsInitCheckTimer: NodeJS.Timeout) {
    const mapListUrl = "https://scoresaber.com/leaderboards";
    const usersMapListUrl = "https://scoresaber.com/u";
    if (
        !location.href.includes(mapListUrl) &&
        !location.href.includes(usersMapListUrl)
    )
        return;

    const mapCards = document.querySelectorAll(".song-container");
    mapCards.forEach((mapCard) => {
        const beforeTag = mapCard.querySelector(".tag");
        const rank = beforeTag!.textContent;

        if (rank!.includes("★") && !rank!.includes(")★")) return;

        const songInfo = mapCard.querySelector(".song-image");
        const hash = songInfo!
            .getAttribute("src")!
            .replace("https://cdn.scoresaber.com/covers/", "")
            .replace(".png", "");

        // ScoreSaberもスタンダードがデフォみたいなのでスタンダードにしておきます
        SwapTagName(hash, Characteristic.Standard, beforeTag!);
    });
    clearInterval(jsInitCheckTimer);
}

function SwapForLeaderboard(jsInitCheckTimer: NodeJS.Timeout) {
    const leaderboardUrl = "https://scoresaber.com/leaderboard";
    const requestUrl = "https://scoresaber.com/ranking/request";
    if (
        !location.href.includes(leaderboardUrl) &&
        !location.href.includes(requestUrl)
    )
        return;

    let characteristic: Characteristic = Characteristic.Standard;
    let cardContent = document.querySelector(".window.card-content");

    // ランク譜面でLawlessは今までないので（そういう決まり？）
    if (location.href.includes(requestUrl)) characteristic = Characteristic.Standard;
    else {
        let content = cardContent!.querySelector(".content");
        let bs = content!.querySelectorAll("b");
        bs.forEach((b) => {
            characteristic = b.textContent!.replace("Solo", "").replace("HD","") as Characteristic;
        });
    }

    const mapCard = document.querySelector(".media-content.is-clipped");
    const beforeTag = mapCard!.querySelector("div.tag");
    const rank = beforeTag!.textContent;

    if (rank!.includes("★") && !rank!.includes(")★")) {
        clearInterval(jsInitCheckTimer);
        return;
    }

    const imageElement = cardContent!.querySelector(".image");
    const hash = imageElement!
        .querySelector("img")!
        .getAttribute("src")!
        .replace("https://cdn.scoresaber.com/covers/", "")
        .replace(".png", "");
    SwapTagName(hash, characteristic, beforeTag!);

    clearInterval(jsInitCheckTimer);
}

function SwapTagName(hash: string, characteristic: Characteristic, beforeTag: Element) {
    const difficulty = beforeTag.getAttribute("title");
    console.log(hash);
    console.log(characteristic);

    console.log("predictorがnullです");

    loadModel().then((model) => {
        makeHalfBakedData().then((data) => {
            console.log("modelとdataのロードが完了しました");
            let a = chrome.runtime.getURL('6916493a189316cf15dc.wasm');
            console.log(a);
            init(a).then(() => {
                console.log("wasmのロードが完了しました");
                let predictor = new StarPredictor(model, data);
                console.log("predictorを作成しました");
                let value = predictor!.get_predicted_values_by_hash(hash, characteristic, difficulty!);
                console.log(value);
                beforeTag.textContent = value + "★";
            });
        }).catch((err) => console.log(err.message));
    }).catch((err) => console.log(err.message));
}
