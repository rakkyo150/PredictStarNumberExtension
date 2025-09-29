import { Difficulty, getDifficultyString } from "./Difficulty";
import { Characteristic } from './Characteristic';
import { request_predicted_value_by_id } from './wrapper';

window.onload = startBeatSaver;

function startBeatSaver() {
    console.log("start");
    let lastUrl = "";
    const main = document.querySelector("main");
    const mo = new MutationObserver(async function () {
        const url = location.href;
        console.log(url);
        if (url == lastUrl) return;

        lastUrl = url;
        await core();
    });
    const config = {
        childList: true,
    };
    mo.observe(main!, config);
}

async function core() {
    console.log("Start core function");
    let retryCount = 0;
    const maxRetry = 5;
    const jsInitCheckTimer = setInterval(async () => await jsLoaded(), 1000);
    async function jsLoaded() {
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

        await swap(id);
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
            characteristic = characteristicImg!
            .getAttribute("title")!
            .replace("Expert+ ", "") as Characteristic;
        }
        else{
            characteristicImg = difficultyItem.querySelector(
                `img[title~=${CSS.escape(getDifficultyString(difficulty))}]`,
            );
            characteristic = characteristicImg!
            .getAttribute("title")!
            .replace(`${getDifficultyString(difficulty)} `, "") as Characteristic;
        }

        let response = await request_predicted_value_by_id(id, characteristic, difficulty);
        if (!response.status) {
            console.error(response.reason);
            return;
        }
        if (response.value == -1) {
            console.warn("Fetch Error");
            return;
        }

        setValue(response.value, difficultyItem);
    };
}

function setValue(value: number, difficultyItem: Element) {
    // なぜか二回呼ばれることがあるので、ここでもう一度チェックする必要がある
    if (difficultyItem.querySelector(".diff-stars") != null) {
        return;
    }
    const stats = difficultyItem.querySelector(".stats");

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

