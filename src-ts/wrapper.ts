import {
    StarPredictor,
    restore_star_predictor,
} from "../pkg/predict_star_number_extension";
import { getModel } from "./modelGetter";

export const wasmFilename = "56e1e68ea283e1e243c0.wasm";

export function setStarPredictor(star_predictor: StarPredictor) {
    console.log("Set star predictor");
    const model_str = star_predictor.model_getter().join(",");
    chrome.storage.local.set({ model: model_str }, function () {});
    chrome.storage.local.set(
        { hashmap_string: star_predictor.hashmap_to_string() },
        function () {},
    );
}

export async function generateStarPredictor(): Promise<StarPredictor> {
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

export function fetch_map_data_by_hash(hash: string): Promise<any> {
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