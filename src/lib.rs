use std::collections::HashMap;
use std::io::BufReader;
use serde::{Deserialize, Serialize};
use tract_onnx::onnx;
use tract_onnx::prelude::{Framework, InferenceFact, tvec, InferenceModelExt, Tensor, Datum};
use tract_onnx::tract_hir::tract_ndarray::Array2;
use serde_json_any_key::*;

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(PartialEq, Clone, Debug, Deserialize, Serialize)]
pub struct StarPredictor {
    model_buf: Vec<u8>,
    map_data_hash_map: HashMap<MapKey, MapData>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
#[derive(Eq, Hash, PartialEq)]
#[allow(dead_code, non_snake_case)]
#[wasm_bindgen]
pub struct MapKey {
    id: String,
    hash: String,
    name: String,
    characteristic: String,
    difficulty: String,
}

#[derive(Debug, Deserialize, Serialize, Clone, PartialEq)]
#[allow(dead_code, non_snake_case)]
#[wasm_bindgen]
pub struct MapData {
    bpm: f64,
    duration: f64,
    difficulty: String,
    sageScore: u64,
    njs: f64,
    offset: f64,
    notes: u64,
    bombs: u64,
    obstacles: u64,
    nps: f64,
    events: f64,
    chroma: bool,
    errors: u64,
    warns: u64,
    resets: u64,
}

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console, js_name = log)]
    fn js_log(s: &str);
}

#[wasm_bindgen]
impl  StarPredictor {
    #[wasm_bindgen(constructor)]
    pub fn new(model: Vec<u8>) -> StarPredictor {
        let model_buf: Vec<u8> = model;
        let map_data_hash_map: HashMap<MapKey, MapData> = HashMap::new();
        StarPredictor { model_buf, map_data_hash_map }
    }

    pub fn model_getter(&self) -> Vec<u8> {
        self.model_buf.clone()
    }

    pub fn hashmap_to_string(&self) -> String {
        let json = self.map_data_hash_map.to_json_map().unwrap();

        json
    }

    // ScoreSaberとBeatSaverのjsonを受け取ってHashMapを作る
    pub fn set_map_data(&self, beat_saver: &JsValue) -> StarPredictor {
        let beat_saver: serde_json::Value = serde_wasm_bindgen::from_value(beat_saver.clone()).unwrap();
        self.set_map_data_for_serde_json(&beat_saver)
    }

    fn set_map_data_for_serde_json(&self, beat_saver: &serde_json::Value) -> StarPredictor {
        let mut new_predictor = self.clone();
        let version = beat_saver["versions"].as_array().unwrap().last().unwrap();
        let default_sage_score = serde_json::Value::from(0);
        let default_chroma = serde_json::Value::from(true);
        for bs_diff_data in version["diffs"].as_array().unwrap(){
            let map_key: MapKey = MapKey {
                id: beat_saver["id"].as_str().unwrap().to_owned(),
                hash: version["hash"].as_str().unwrap().to_owned(),
                name: beat_saver["name"].as_str().unwrap().to_owned(),
                characteristic: bs_diff_data["characteristic"].as_str().unwrap().to_owned(),
                difficulty: bs_diff_data["difficulty"].as_str().unwrap().to_owned()
            };
            let map_data: MapData = MapData {
                bpm: beat_saver["metadata"]["bpm"].as_f64().unwrap(),
                duration: beat_saver["metadata"]["duration"].as_f64().unwrap(),
                difficulty: bs_diff_data["difficulty"].as_str().unwrap().to_owned(),
                sageScore: version.get("sageScore").unwrap_or_else(|| &default_sage_score).as_u64().unwrap(),
                njs: bs_diff_data["njs"].as_f64().unwrap(),
                offset: bs_diff_data["offset"].as_f64().unwrap(),
                notes: bs_diff_data["notes"].as_u64().unwrap(),
                bombs: bs_diff_data["bombs"].as_u64().unwrap(),
                obstacles: bs_diff_data["obstacles"].as_u64().unwrap(),
                nps: bs_diff_data["nps"].as_f64().unwrap(),
                events: bs_diff_data["events"].as_f64().unwrap(),
                chroma:  bs_diff_data.get("chroma").unwrap_or_else(|| &default_chroma).as_bool().unwrap(),
                errors: bs_diff_data["paritySummary"]["errors"].as_u64().unwrap(),
                warns: bs_diff_data["paritySummary"]["warns"].as_u64().unwrap(),
                resets: bs_diff_data["paritySummary"]["resets"].as_u64().unwrap()
            };
            new_predictor.map_data_hash_map.insert(map_key, map_data);
        }

        new_predictor
    }

    pub fn has_map_data_by_hash(&self, hash: &str, characteristic: &str, difficulty: &str) -> bool {
        self.map_data_hash_map.keys().any(|key| key.hash.to_lowercase() == hash.to_lowercase() && key.characteristic.to_lowercase() == characteristic.to_lowercase() && key.difficulty.to_lowercase() == difficulty.to_lowercase())
    }

    pub fn has_map_data_by_id(&self, id: &str, characteristic: &str, difficulty: &str) -> bool {
        self.map_data_hash_map.keys().any(|key| key.id.to_lowercase() == id.to_lowercase() && key.characteristic.to_lowercase() == characteristic.to_lowercase() && key.difficulty.to_lowercase() == difficulty.to_lowercase())
    }

    pub fn get_predicted_values_by_hash(&self, hash: &str, characteristic: &str, difficulty: &str) -> f64 {
        match self.map_data_hash_map.keys().find(|&key| key.hash.to_lowercase() == hash.to_lowercase() && key.characteristic.to_lowercase() == characteristic.to_lowercase() && key.difficulty.to_lowercase() == difficulty.to_lowercase())
        {
            Some(key) => {
                let record = self.map_data_hash_map.get(key).unwrap();
                get_predicted_values(record, &self.model_buf)
            },
            None => {
                // js_log(format!("No Data on hash({}) {}-{}", hash, characteristic,difficulty).as_str());
                0.0
            },
        }
    }

    pub fn get_predicted_values_by_id(&self, id: &str, characteristic: &str, difficulty: &str) -> f64 {
        match self.map_data_hash_map.keys().find(|&key| key.id.to_lowercase() == id.to_lowercase() && key.characteristic.to_lowercase() == characteristic.to_lowercase() && key.difficulty.to_lowercase() == difficulty.to_lowercase())
        {
            Some(key) => {
                let record = self.map_data_hash_map.get(key).unwrap();
                get_predicted_values(record, &self.model_buf)
            },
            None => {
                // js_log(format!("No Data on id({}) {}-{}", id, characteristic,difficulty).as_str());
                0.0
            },
        }
    }
}

#[wasm_bindgen]
pub fn restore_star_predictor(model: Vec<u8>, hashmap_str: String) -> StarPredictor {
    let hoge: HashMap<MapKey, MapData> = json_to_map(&hashmap_str).unwrap();
    StarPredictor { model_buf: model, map_data_hash_map: hoge }
}

fn get_predicted_values(record: &MapData, model_buf: &Vec<u8> ) -> f64 {
    if model_buf.len() == 0 {
        panic!("no model");
    }
    let model = onnx().model_for_read(&mut BufReader::new(&model_buf[..]))
        .unwrap()
        .with_input_fact(0, InferenceFact::dt_shape(f64::datum_type(), tvec![1, 15]))
        .unwrap()
        .with_output_fact(0, InferenceFact::dt_shape(f64::datum_type(), tvec![1, 1]))
        .unwrap()
        .into_optimized()
        .unwrap()
        .into_runnable()
        .unwrap();

    let difficulties = match record.difficulty.as_str() {
        "Easy" => 0.0,
        "Normal" => 1.0,
        "Hard" => 2.0,
        "Expert" => 3.0,
        "ExpertPlus" => 4.0,
        _ => 0.0
    };

    let chroma = if record.chroma {
        1.0
    } else {
        0.0
    };

    // Create an input Tensor
    let data: Vec<f64> = vec![record.bpm, record.duration, difficulties,  record.sageScore as f64 ,record.njs , record.offset ,record.notes as f64, record.bombs as f64, record.obstacles as f64, record.nps, record.events, chroma, record.errors as f64, record.warns as f64, record.resets as f64];
    let shape = [1, 15];
    let input = Tensor::from(Array2::<f64>::from_shape_vec(shape, data).unwrap());

    // Run the model
    let outputs = model.run(tvec!(input.into())).unwrap();

    // Extract the output tensor
    let output_tensor = &outputs[0];

    // Extract the result values
    let result = output_tensor.to_array_view::<f64>().unwrap();
    let predicted_value = result[[0, 0]];

    predicted_value
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Read;
    use std::sync::Mutex;
    use reqwest::blocking::Client;
    use lazy_static::lazy_static;

    // テストの際はjs_logをコメントアウトすること
    
    lazy_static! {
        static ref HASH: &'static str = "FDA568FC27C20D21F8DC6F3709B49B5CC96723BE";
        static ref ID: &'static str = "1";
        static ref CHARACTERISTIC: &'static str = "Standard";
        static ref DIFFICULTY: &'static str = "Hard";
        static ref PREDICTOR: Mutex<StarPredictor> = Mutex::new(make_predictor_for_test(*HASH, *ID));
    }

    pub fn make_predictor_for_test(hash: &str, id: &str) -> StarPredictor {
        let predictor = StarPredictor::new(load_model().unwrap());
        let beat_saver_by_hash = get_data_from_beat_saver_by_hash(hash).unwrap();
        let beat_saver_by_id = get_data_from_beat_saver_by_id(id).unwrap();
        let new_predictor = predictor.set_map_data_for_serde_json(&beat_saver_by_hash);
        let newer_predictor = new_predictor.set_map_data_for_serde_json(&beat_saver_by_id);
        newer_predictor
    }

    fn load_model() -> Result<Vec<u8>, Box<dyn std::error::Error>> {
        let model_asset_endpoint = "https://raw.githubusercontent.com/rakkyo150/PredictStarNumberHelper/master/model.onnx";
        let client = reqwest::blocking::Client::new();
        let mut model_asset_response= match client.get(model_asset_endpoint).send() {
            Ok(response) => response,
            Err(e) => panic!("Error: {}", e),
        };
        let mut buf = Vec::new();
        model_asset_response.read_to_end(&mut buf)?;

        Ok(buf)
    }

    #[test]
    fn has_map_data_by_hash(){
        println!("{}", (*PREDICTOR).lock().unwrap().hashmap_to_string());
        let has_map_data = (*PREDICTOR).lock().unwrap().has_map_data_by_hash(*HASH, *CHARACTERISTIC, *DIFFICULTY);
        assert_eq!(has_map_data, true);
    }

    #[test]
    fn has_map_data_by_id(){
        println!("{}", (*PREDICTOR).lock().unwrap().hashmap_to_string());
        let has_map_data = (*PREDICTOR).lock().unwrap().has_map_data_by_id(*ID, *CHARACTERISTIC, *DIFFICULTY);
        assert_eq!(has_map_data, true);
    }

    #[test]
    fn restore(){
        let hashmap_string = (*PREDICTOR).lock().unwrap().hashmap_to_string();
        let model = (*PREDICTOR).lock().unwrap().model_getter();
        let restored_predictor = restore_star_predictor(model, hashmap_string);
        assert_eq!(restored_predictor, (*PREDICTOR).lock().unwrap().clone());
    }

    #[test]
    fn non_exisiting_hash() {
        let hash = "-1";
        let predicted_value = (*PREDICTOR).lock().unwrap().get_predicted_values_by_hash(hash, "Standard", "Hard");
        let value = predicted_value;
        println!("predicted_value: {}", value);
        assert_eq!(value, 0.0);
    }

    #[test]
    fn exisiting_hash() {
        let predicted_value = (*PREDICTOR).lock().unwrap().get_predicted_values_by_hash(*HASH, *CHARACTERISTIC, *DIFFICULTY);
        let value = predicted_value;
        println!("predicted_value: {}", value);
        assert_ne!(value, 0.0);
    }

    #[test]
    fn non_exisiting_id() {
        let id = "-1";
        let predicted_value = (*PREDICTOR).lock().unwrap().get_predicted_values_by_id(id, "Standard", "Hard");
        let value = predicted_value;
        println!("predicted_value: {}", value);
        assert_eq!(value, 0.0);
    }

    #[test]
    fn exisiting_id() {
        let id = "1";
        let predicted_value = (*PREDICTOR).lock().unwrap().get_predicted_values_by_id(id, *CHARACTERISTIC, *DIFFICULTY);
        let value = predicted_value;
        println!("predicted_value: {}", value);
        assert_ne!(value, 0.0);
    }

    fn get_data_from_beat_saver_by_hash(hash: &str) -> Result<serde_json::Value, Box<dyn std::error::Error>> {
        let url = format!("https://api.beatsaver.com/maps/hash/{}", hash);

        let client = Client::new();
        let response = client.get(&url).send()?;
        let json: serde_json::Value = response.json()?;

        Ok(json)
    }

    fn get_data_from_beat_saver_by_id(id: &str) -> Result<serde_json::Value, Box<dyn std::error::Error>> {
        let url = format!("https://api.beatsaver.com/maps/id/{}", id);

        let client = Client::new();
        let response = client.get(&url).send()?;
        let json: serde_json::Value = response.json()?;

        Ok(json)
    }
}

