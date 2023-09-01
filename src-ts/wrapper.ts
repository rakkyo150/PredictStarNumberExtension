import { Characteristic } from "./Characteristic";
import { Difficulty, getDifficultyString } from "./Difficulty";
import {
    StarPredictor,
    restore_star_predictor,
} from "../pkg/predict_star_number_extension";
import { getModel } from "./modelGetter";

export const wasmFilename = "56e1e68ea283e1e243c0.wasm";

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
    setStarPredictor(new_predictor)
    if (value == 0) return "No Data";
    return "(" + value.toFixed(2) + "★)";
}

function setStarPredictor(star_predictor: StarPredictor) {
    console.log("Set star predictor");
    const model_str = star_predictor.model_getter().join(",");
    chrome.storage.local.set({ model: model_str }, function () {});
    chrome.storage.local.set(
        { hashmap_string: star_predictor.hashmap_to_string() },
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

export function fetch_map_data_by_id(id: string): Promise<any> {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
            {
                contentScriptQuery: "post",
                endpoint: `https://api.beatsaver.com/maps/id/${id}`,
            },
            function (response) {
                resolve(response);
            },
        );
    });
}

export function test(): Promise<any> {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
            {
                contentScriptQuery: "test",
            },
            function (response) {
                resolve(response);
            },
        );
    });
}