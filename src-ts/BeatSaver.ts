import { Difficulty, getDifficultyString } from "./Difficulty";
import {
    generateStarPredictor,
    fetch_map_data_by_id,
    setStarPredictor,
    wasmFilename,
    test,
} from "./wrapper";
import init, { StarPredictor } from "../pkg/predict_star_number_extension";
import { Characteristic } from './Characteristic';

window.onload = startBeatSaver;

function startBeatSaver() {
    console.log("start");
    let lastUrl = "";
    const main = document.querySelector("main");

    test().then((response) => {
        console.log("Finish loading wasm file");
        console.log(response.star_predictor);
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
        mo.observe(main!, config);
    }).catch((error) => {
        console.log(error);
    });
}

async function core() {
    console.log("Start core function");
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

        clearInterval(jsInitCheckTimer);
        const oneClickUrl = document!
            .querySelector('a[title="One-Click"]')!
            .getAttribute("href");
        const id = oneClickUrl!.replace("beatsaver://", "");
        if (id == null) {
            console.log("idを取得できませんでした");
            return;
        }

        swap(id);
    }
}

async function swap(id: string) {
    const mapStats = document.querySelector(".mapstats");
    const difficultyList =
        mapStats!.querySelectorAll(".list-group-item");

    if (difficultyList == null) {
        console.log("マップの種類を取得できませんでした");
        return;
    }

    for (const difficultyItem of difficultyList) {
        if (difficultyItem.querySelector(".diff-stars") != null) {
            return;
        }

        let difficulty: Difficulty;
        let characteristic: Characteristic;
        if (difficultyItem.querySelector('img[title~="Expert+"]') != null) {
            difficulty = Difficulty.ExpertPlus;
        }else if (difficultyItem.querySelector('img[title~="Expert"]') != null) {
            difficulty = Difficulty.Expert;
        }else if (difficultyItem.querySelector('img[title~="Hard"]') != null) {
            difficulty = Difficulty.Hard;
        }else if (difficultyItem.querySelector('img[title~="Normal"]') != null) {
            difficulty = Difficulty.Normal;
        }else if (difficultyItem.querySelector('img[title~="Easy"]') != null) {
            difficulty = Difficulty.Easy;
        }

        let characteristicImg: Element;
        if (difficulty == Difficulty.ExpertPlus) {
            characteristicImg = difficultyItem.querySelector(
                `img[title~=${CSS.escape("Expert+")}]`,
            );
        }
        else{
            characteristicImg = difficultyItem.querySelector(
                `img[title~=${CSS.escape(getDifficultyString(difficulty))}]`,
            );
        }

        characteristic = characteristicImg!
        .getAttribute("title")!
        .replace(`${difficulty} `, "") as Characteristic;

        let predictor = await generateStarPredictor();
        let value;
        if (predictor.has_map_data_by_id(id, characteristic, getDifficultyString(difficulty))) {
            let value = predictor.get_predicted_values_by_id(
                id,
                characteristic,
                getDifficultyString(difficulty),
            );
            console.log(
                `No update map data cache: ${id} ${characteristic} ${difficulty} ${value}`,
            );
            setValue(value, difficultyItem);
            return;
        }

        let data = await fetch_map_data_by_id(id);
        if (data == null) {
            return;
        } else if (data.status != null && !data.status) return;
        let new_predictor = predictor.set_map_data(data);
        value = new_predictor.get_predicted_values_by_id(id, characteristic, getDifficultyString(difficulty));
        if (value == 0) return;
        else setValue(value, difficultyItem);
        setStarPredictor(new_predictor);
    };
}

function setValue(value: number, difficultyItem: Element) {
    const stats = difficultyItem.querySelector(".stats");
    console.log(stats);

    const starSpan = document.createElement("span");
    starSpan.classList.add("diff-stars");
    starSpan.textContent = `( ${value} )`;

    SetStyle(starSpan);

    const starI = document.createElement("i");
    starI.classList.add("fas");
    starI.classList.add("fa-star");
    starSpan.prepend(starI);

    difficultyItem.insertBefore(starSpan, stats);
}

function SetStyle(starSpan: HTMLSpanElement) {
    starSpan.style.margin = "0px auto";
    starSpan.style.paddingLeft = "5px";
    starSpan.style.paddingRight = "5px";
    starSpan.style.paddingTop = "0px";
    starSpan.style.paddingBottom = "0px";
    starSpan.style.textAlign = "center";
}

