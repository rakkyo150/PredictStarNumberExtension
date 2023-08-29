import { loadModel, Difficulty, getDifficultyString } from './fetcher';
import init, { StarPredictor, restore_star_predictor } from "../pkg/predict_star_number_extension";

window.onload = startScoreSaber;

const wasmFilename = "56e1e68ea283e1e243c0.wasm";

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

let star_already_called = false;

function startScoreSaber() {
    if (star_already_called) return;
    star_already_called = true;
    let lastUrl = "";
    console.log("Start startScoreSaber function");
    
    let body = document.querySelector("body");

    let a = chrome.runtime.getURL(wasmFilename);
    console.log(a);
    init(a).then(() => {
        console.log("Finish loading wasm file");

        const mo = new MutationObserver(function () {
            let url = location.href;
            if (url == lastUrl) return;

            lastUrl = url;
            main();
        });
        const config = {
            subtree: true,
            attributes: true,
        };
        mo.observe(body!, config);
    });
}

async function main() {
    console.log("Start main function");
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

async function SwapForMapList(jsInitCheckTimer: NodeJS.Timeout) {
    const mapListUrl = "https://scoresaber.com/leaderboards";
    const usersMapListUrl = "https://scoresaber.com/u";
    if (
        !location.href.includes(mapListUrl) &&
        !location.href.includes(usersMapListUrl)
    )
        return;

    const mapCards = document.querySelectorAll(".song-container");
    for (const mapCard of mapCards) {
        console.log("Start swap tag name");
        const beforeTag = mapCard.querySelector(".tag");
        const rank = beforeTag!.textContent;

        if (rank!.includes("★") && !rank!.includes(")★")) return;

        const songInfo = mapCard.querySelector(".song-image");
        const hash = songInfo!
            .getAttribute("src")!
            .replace("https://cdn.scoresaber.com/covers/", "")
            .replace(".png", "");

        // ScoreSaberもスタンダードがデフォみたいなのでスタンダードにしておきます
        await SwapTagName(hash, Characteristic.Standard, beforeTag!);
    };
    clearInterval(jsInitCheckTimer);
}

async function SwapForLeaderboard(jsInitCheckTimer: NodeJS.Timeout) {
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
    await SwapTagName(hash, characteristic, beforeTag!);

    clearInterval(jsInitCheckTimer);
}

async function SwapTagName(hash: string, characteristic: Characteristic, beforeTag: Element) {
    let difficulty: Difficulty;
    const difficultyStr = beforeTag.getAttribute("title");
    if (difficultyStr! == "Expert+") difficulty = Difficulty.ExpertPlus;
    else difficulty = Difficulty[difficultyStr! as keyof typeof Difficulty];
    console.log(`Start swap tag name: ${hash} ${characteristic} ${difficulty}`);
    beforeTag.textContent = "...";

    let predictor = await generateStarPredictor();
    if(predictor.has_map_data_by_hash(hash, characteristic, getDifficultyString(difficulty))){
        let value = predictor.get_predicted_values_by_hash(hash, characteristic, getDifficultyString(difficulty));
        console.log(`No update map data cache: ${hash} ${characteristic} ${difficulty} ${value}`);
        beforeTag.textContent = "(" + value.toFixed(2) + "★)";
        return;
    }

    chrome.runtime.sendMessage(
        {
            contentScriptQuery: 'post',
            endpoint: `https://api.beatsaver.com/maps/hash/${hash}`
        },
        (data) => {
        if (data == null) {
            beforeTag.textContent = "Fetch Error";
            return;
        }
        let new_predictor = predictor.set_map_data(data);
        let value = new_predictor.get_predicted_values_by_hash(hash, characteristic, getDifficultyString(difficulty));
        if (value == 0) beforeTag.textContent = "No Data";
        else beforeTag.textContent = "(" + value.toFixed(2) + "★)";
        console.log(`Update map data cache: ${hash} ${characteristic} ${getDifficultyString(difficulty)} ${value}`);
        setStarPredictor(new_predictor);
    });
}

function setStarPredictor(star_predictor: StarPredictor) {
    console.log("Set star predictor");
    const model_str = star_predictor.model_getter().join(",");
    chrome.storage.local.set({'model': model_str}, function () {
    });
    chrome.storage.local.set({'hashmap_string': star_predictor.hashmap_to_string()}, function () {
    });
}

async function generateStarPredictor(): Promise<StarPredictor>{
    let predictor
    let value = await chrome.storage.local.get(['model', 'hashmap_string'])
    let cached_model_str = value['model'];
    let hashmap_string: string = value['hashmap_string'];
    if (cached_model_str == null || hashmap_string == null) {
        let model = await loadModel();
        predictor = new StarPredictor(model);
    }
    else{
        const cached_model = cached_model_str.split(",") as Uint8Array;
        predictor = restore_star_predictor(cached_model, hashmap_string);
    }
    console.log("Finish generating model");
    return predictor;
}