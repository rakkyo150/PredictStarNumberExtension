import { Difficulty, getDifficultyString } from "./Difficulty";
import init from "../pkg/predict_star_number_extension";
import {
    get_predicted_value_by_hash,
} from "./wrapper";
import { Characteristic } from "./Characteristic";

// webpackのoutputでwebassemblyModuleFilenameを指定してもファイル名が変わらないので手動で対応してください
const wasmFilename = "3ed46334d96f8f639b9c.wasm";

window.onload = startScoreSaber;

let start_already_called = false;

function startScoreSaber() {
    if (start_already_called) return;
    start_already_called = true;
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

    clearInterval(jsInitCheckTimer);
    const mapCards = document.querySelectorAll(".song-container");
    for (const mapCard of mapCards) {
        console.log("Start swap tag name");
        const beforeTag = mapCard.querySelector(".tag");
        const rank = beforeTag!.textContent;

        if (rank!.includes("★") && !rank!.includes(")★")) continue;

        const songInfo = mapCard.querySelector(".song-image");
        const hash = songInfo!
            .getAttribute("src")!
            .replace("https://cdn.scoresaber.com/covers/", "")
            .replace(".png", "");

        clearInterval(jsInitCheckTimer);
        // ScoreSaberもスタンダードがデフォみたいなのでスタンダードにしておきます
        await SwapTagName(hash, Characteristic.Standard, beforeTag!);
    }
}

async function SwapForLeaderboard(jsInitCheckTimer: NodeJS.Timeout) {
    const leaderboardUrl = "https://scoresaber.com/leaderboard";
    const requestUrl = "https://scoresaber.com/ranking/request";
    if (
        !location.href.includes(leaderboardUrl) &&
        !location.href.includes(requestUrl)
    )
        return;

    clearInterval(jsInitCheckTimer);

    let characteristic: Characteristic = Characteristic.Standard;
    let cardContent = document.querySelector(".window.card-content");

    // ランク譜面でLawlessは今までないので（そういう決まり？）
    if (location.href.includes(requestUrl))
        characteristic = Characteristic.Standard;
    else {
        let content = cardContent!.querySelector(".content");
        let bs = content!.querySelectorAll("b");
        bs.forEach((b) => {
            characteristic = b
                .textContent!.replace("Solo", "")
                .replace("HD", "") as Characteristic;
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
}

async function SwapTagName(
    hash: string,
    characteristic: Characteristic,
    beforeTag: Element,
) {
    let difficulty: Difficulty;
    const difficultyStr = beforeTag.getAttribute("title");
    if (difficultyStr! == "Expert+") difficulty = Difficulty.ExpertPlus;
    else difficulty = Difficulty[difficultyStr! as keyof typeof Difficulty];
    console.log(`Start swap tag name: ${hash} ${characteristic} ${difficulty}`);
    beforeTag.textContent = "...";

    let value = await get_predicted_value_by_hash(hash, characteristic, difficulty);
    beforeTag.textContent = value;
}
