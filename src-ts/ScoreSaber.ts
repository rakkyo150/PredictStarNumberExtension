import { loadModel ,makeHalfBakedData } from "./fetcher";
import init, { StarPredictor, restore_star_predictor } from "../pkg/predict_star_number_extension";

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

async function startScoreSaber() {
    let lastUrl = "";
    console.log(lastUrl);

    let body = document.querySelector("body");

    let predictor;

    let model = await loadModel();
    let data = await makeHalfBakedData();
    console.log("modelとdataのロードが完了しました");
    let a = chrome.runtime.getURL('a405d3b374e5bb213dfb.wasm');
    console.log(a);
    await init(a);
    console.log("wasmのロードが完了しました");
    let value = await chrome.storage.local.get(['model', 'hashmap_string']);
    let cached_model_str = value['model'];
    let hashmap_string: string = value['hashmap_string'];
    if (cached_model_str == null || hashmap_string == null) {
        const startTime = performance.now();
        predictor = new StarPredictor(model, data);
        const endTime = performance.now();
        const executionTime = endTime - startTime;
        console.log("実行時間（ミリ秒）: ", executionTime);
        console.log("predictorを作成しました");
        setStarPredictor(predictor);
    }
    else{
        const cached_model = cached_model_str.split(",") as Uint8Array;
        const startTime = performance.now();
        predictor = restore_star_predictor(cached_model, hashmap_string);
        const endTime = performance.now();
        const executionTime = endTime - startTime;
        console.log("実行時間（ミリ秒）: ", executionTime);
        console.log("predictorを復元しました");
    }

    const mo = new MutationObserver(function () {
        let url = location.href;
        console.log(url);
        if (url == lastUrl) return;

        lastUrl = url;
        main(predictor);
    });
    const config = {
        subtree: true,
        attributes: true,
    };
    mo.observe(body!, config);
}

function main(predictor: StarPredictor) {
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
            SwapForLeaderboard(jsInitCheckTimer, predictor);
        }
        // プレイヤーページのマップ一覧ページorマップ一覧ページ
        else if (document.querySelector(".song-container") != null) {
            SwapForMapList(jsInitCheckTimer, predictor);
        }
    }
}

function SwapForMapList(jsInitCheckTimer: NodeJS.Timeout, predictor: StarPredictor) {
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
        SwapTagName(hash, Characteristic.Standard, beforeTag!, predictor);
    });
    clearInterval(jsInitCheckTimer);
}

function SwapForLeaderboard(jsInitCheckTimer: NodeJS.Timeout, predictor: StarPredictor) {
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
    SwapTagName(hash, characteristic, beforeTag!, predictor);

    clearInterval(jsInitCheckTimer);
}

function SwapTagName(hash: string, characteristic: Characteristic, beforeTag: Element, predictor: StarPredictor) {
    const difficulty = beforeTag.getAttribute("title");
    console.log(hash);
    console.log(characteristic);
    beforeTag.textContent = "...";
    let value = predictor.get_predicted_values_by_hash(hash, characteristic, difficulty!);
    console.log(value);
    beforeTag.textContent = "(" + value.toFixed(2) + "★)";
}

function setStarPredictor(star_predictor: StarPredictor) {
    console.log("setStarPredictorが呼ばれました");
    const model_str = star_predictor.model_getter().join(",");
    console.log("model_str: " + model_str);
    chrome.storage.local.set({'model': model_str}, function () {
    });
    console.log("star_predictor.hashmap_to_string()がはじまります");
    chrome.storage.local.set({'hashmap_string': star_predictor.hashmap_to_string()}, function () {
    });
}
