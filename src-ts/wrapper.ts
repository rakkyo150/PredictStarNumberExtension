import { Characteristic } from "./Characteristic";
import { Difficulty, getDifficultyString } from "./Difficulty";
import {
    StarPredictor,
    restore_star_predictor,
} from "../pkg/predict_star_number_extension";
import { getModel } from "./modelGetter";

// called by content script for ScoreSaber
export async function get_predicted_value_by_hash(hash: string, characteristic: Characteristic, difficulty: Difficulty): Promise<string> {
    let predictor = await generateStarPredictor();
    let value;
    if (
        predictor.has_map_data_by_hash(
            hash,
            characteristic,
            getDifficultyString(difficulty),
        )
    ) {
        value = predictor.get_predicted_values_by_hash(
            hash,
            characteristic,
            getDifficultyString(difficulty),
        );
        console.log(
            `No update map data cache: ${hash} ${characteristic} ${difficulty} ${value}`,
        );
        return "(" + value.toFixed(2).toString() + "★)";
    }
    
    let data = await fetch_map_data_by_hash(hash);
    if (data == null) {
        return "Fetch Error";
    } else if (data.status != null && !data.status) {
        console.log(data.reason);
        return "No Data";
    }
    let new_predictor = predictor.set_map_data(data);
    value = new_predictor.get_predicted_values_by_hash(
        hash,
        characteristic,
        getDifficultyString(difficulty),
    );
    updateMapDataCache(new_predictor)
    if (value == 0) return "No Data";
    return "(" + value.toFixed(2) + "★)";
}

// called by content script for BeatSaver
export function request_predicted_value_by_id(id: string, characteristic: Characteristic, difficulty: Difficulty): Promise<any> {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
            {
                contentScriptQuery: "predict_by_id",
                id: id,
                characteristic: characteristic,
                difficulty: difficulty,
            },
            function (response) {
                resolve(response);
            },
        );
    });
}

// called by background called by content script for BeatSaver
export async function get_predicted_value_by_id(id: string, characteristic: Characteristic, difficulty: Difficulty): Promise<number> {
    let predictor = await generateStarPredictor();
    let value;
    if (
        predictor.has_map_data_by_id(
            id,
            characteristic,
            getDifficultyString(difficulty),
        )
    ) {
        value = predictor.get_predicted_values_by_id(
            id,
            characteristic,
            getDifficultyString(difficulty),
        );
        console.log(
            `No update map data cache: ${id} ${characteristic} ${difficulty} ${value}`,
        );
        return value.toFixed(2);
    }
    
    let data = await fetch_map_data_by_id(id);
    console.log(data);
    if (data == null) {
        return -1;
    } 

    let new_predictor = predictor.set_map_data(data);
    console.log(`${id} ${characteristic} ${getDifficultyString(difficulty)}`)
    value = new_predictor.get_predicted_values_by_id(
        id,
        characteristic,
        getDifficultyString(difficulty),
    );
    updateMapDataCache(new_predictor)
    if (value == 0) return -1;
    return value.toFixed(2);
}

function updateMapDataCache(new_predictor: StarPredictor) {
    console.log("Update map data cache");
    const model_str = new_predictor.model_getter().join(",");
    chrome.storage.local.set({ model: model_str }, function () {});
    chrome.storage.local.set(
        { hashmap_string: new_predictor.hashmap_to_string() },
        function () {},
    );
}

async function generateStarPredictor(): Promise<StarPredictor> {
    let predictor;
    let value = await chrome.storage.local.get(["model", "hashmap_string"]);
    let cached_model_str = value["model"];
    let hashmap_string: string = value["hashmap_string"];
    if (cached_model_str == null || hashmap_string == null) {
        let model = await getModel();
        predictor = new StarPredictor(model);
    } else {
        const cached_model = cached_model_str.split(",") as Uint8Array;
        predictor = restore_star_predictor(cached_model, hashmap_string);
    }
    console.log("Finish generating model");
    return predictor;
}

function fetch_map_data_by_hash(hash: string): Promise<any> {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
            {
                contentScriptQuery: "post",
                endpoint: `https://api.beatsaver.com/maps/hash/${hash}`,
            },
            function (response) {
                resolve(response);
            },
        );
    });
}

async function fetch_map_data_by_id(id: string): Promise<any> {
    const endpoint = `https://api.beatsaver.com/maps/id/${id}`;
    let response = await fetch(endpoint)
    if (response?.ok) {
        return await response.json();
    }
}