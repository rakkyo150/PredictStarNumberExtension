use std::collections::HashMap;
use std::io::{BufReader, Read};
use serde::Deserialize;
use tract_onnx::onnx;
use tract_onnx::prelude::{Framework, InferenceFact, tvec, InferenceModelExt, Tensor, Datum};
use tract_onnx::tract_hir::tract_ndarray::Array2;

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct StarPredictor {
    model_buf: Vec<u8>,
    map_data_hash_map: HashMap<MapKey, MapData>,
}

#[wasm_bindgen]
impl  StarPredictor {
    #[wasm_bindgen(constructor)]
    pub fn new() -> StarPredictor {
        let model_buf: Vec<u8> = load_model().unwrap();
        let map_data_hash_map = make_half_baked_data();
        StarPredictor { model_buf, map_data_hash_map }
    }

    pub fn get_predicted_values_by_hash(&mut self, hash: &str, characteristic: &str, difficulty: &str) -> f64 {
        match self.map_data_hash_map.keys().find(|&key| key.hash == hash && key.characteristic == characteristic && key.difficulty == difficulty)
        {
            Some(key) => {
                let record = self.map_data_hash_map.get(key).unwrap();
                get_predicted_values(record, &mut self.model_buf)
            },
            None => {
                println!("hash not found");
                0.0
            },
        }
    }

    pub fn get_predicted_values_by_id(&mut self, id: &str, characteristic: &str, difficulty: &str) -> f64 {
        match self.map_data_hash_map.keys().find(|&key| key.id == id && key.characteristic == characteristic && key.difficulty == difficulty)
        {
            Some(key) => {
                let record = self.map_data_hash_map.get(key).unwrap();
                get_predicted_values(record, &mut self.model_buf)
            },
            None => {
                println!("id not found");
                0.0
            },
        }
    }
}

fn make_half_baked_data() ->  HashMap<MapKey, MapData> {
    let endpoint = "https://github.com/andruzzzhka/BeatSaberScrappedData/raw/master/combinedScrappedData.zip";
    let client = reqwest::blocking::Client::new();
    // endpointからzipを取得して展開して中にあるjsonファイルを読み込む
    let mut response = match client.get(endpoint).send() {
        Ok(response) => response,
        Err(e) => panic!("Error: {}", e),
    };
    let mut buf = Vec::new();
    response.read_to_end(&mut buf).unwrap();
    println!("buf.len(): {}", buf.len());
    let mut archive = zip::ZipArchive::new(std::io::Cursor::new(buf)).unwrap();
    let mut json_file = archive.by_name("combinedScrappedData.json").unwrap();
    let mut json_buf = Vec::new();
    json_file.read_to_end(&mut json_buf).unwrap();
    let json_str = String::from_utf8(json_buf).unwrap();
    // json_strをjsonオブジェクトに変換
    let json: serde_json::Value = serde_json::from_str(&json_str).unwrap();

    make_map_data_hash_map(json)
}

fn make_map_data_hash_map(json: serde_json::Value) -> HashMap<MapKey,MapData> {
    let mut map_data_hash_map: HashMap<MapKey,MapData> = HashMap::new();
    for map_data in json.as_array().unwrap() {
        for diff in map_data["Diffs"].as_array().unwrap() {
            let map_key: MapKey = MapKey { id: map_data["Key"].as_str().unwrap().to_owned(), hash: map_data["Hash"].as_str().unwrap().to_owned(), name: map_data["SongName"].as_str().unwrap().to_owned(), characteristic: diff["Char"].as_str().unwrap().to_owned(), difficulty: diff["Diff"].as_str().unwrap().to_owned() };
            let map_data: MapData = MapData { bpm: map_data["Bpm"].as_f64().unwrap(), duration: map_data["Duration"].as_f64().unwrap(), difficulty: diff["Diff"].as_str().unwrap().to_owned(), sageScore: String::new(), njs: diff["Njs"].as_f64().unwrap(), offset: 0.0, notes: diff["Notes"].as_u64().unwrap(), bombs: diff["Bombs"].as_u64().unwrap(), obstacles: diff["Obstacles"].as_u64().unwrap(), nps: 0.0, events: 0.0, chroma: String::new(), errors: 0, warns: 0, resets: 0 };
            map_data_hash_map.insert(map_key, map_data);
        }
    }
    map_data_hash_map
}

fn load_model() -> Result<Vec<u8>, Box<dyn std::error::Error>> {
    let model_asset_endpoint = "https://github.com/rakkyo150/PredictStarNumberHelper/releases/latest/download/model.onnx";
    let client = reqwest::blocking::Client::new();
    let mut model_asset_response= match client.get(model_asset_endpoint).send() {
        Ok(response) => response,
        Err(e) => panic!("Error: {}", e),
    };
    let mut buf = Vec::new();
    model_asset_response.read_to_end(&mut buf)?;

    /*
    let model_file_path = Path::new("model.pickle");
    let mut model_file = File::create(model_file_path)?;
    model_file.write_all(&buf)?;
    */

    Ok(buf)
}

fn get_predicted_values(record: &MapData, model_buf: &mut Vec<u8> ) -> f64 {
    if model_buf.len() == 0 {
        println!("load model");
        *model_buf = load_model().unwrap();
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
    let sage_score = record.sageScore.parse().unwrap_or_else(|_err| {
        0.0
    });
    let chroma = if record.chroma == "True" {
        1.0
    } else {
        0.0
    };

    // Create an input Tensor
    let data: Vec<f64> = vec![record.bpm, record.duration, difficulties, sage_score ,record.njs , record.offset ,record.notes as f64, record.bombs as f64, record.obstacles as f64, record.nps, record.events, chroma, record.errors as f64, record.warns as f64, record.resets as f64];
    let shape = [1, 15];
    let input = Tensor::from(Array2::<f64>::from_shape_vec(shape, data).unwrap());

    // Run the model
    let outputs = model.run(tvec!(input.into())).unwrap();

    // Extract the output tensor
    let output_tensor = &outputs[0];

    // Extract the result values
    let result = output_tensor.to_array_view::<f64>().unwrap();
    println!("result: {:?}", result);
    let predicted_value = result[[0, 0]];
    println!("predicted_value: {}", predicted_value);

    predicted_value
}

#[derive(Debug, Deserialize)]
#[derive(Eq, Hash, PartialEq)]
#[allow(dead_code, non_snake_case)]
struct MapKey {
    id: String,
    hash: String,
    name: String,
    characteristic: String,
    difficulty: String,
}

#[derive(Debug, Deserialize)]
#[allow(dead_code, non_snake_case)]
struct MapData {
    bpm: f64,
    duration: f64,
    difficulty: String,
    // sageScoreはempty stringの場合があるので
    sageScore: String,
    njs: f64,
    offset: f64,
    notes: u64,
    bombs: u64,
    obstacles: u64,
    nps: f64,
    events: f64,
    chroma: String,
    errors: u64,
    warns: u64,
    resets: u64,
}


#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::Mutex;
    use lazy_static::lazy_static;

    lazy_static! {
        static ref PREDICTOR: Mutex<StarPredictor> = Mutex::new(StarPredictor::new());
    }

    #[test]
    fn non_exisiting_hash() {
        let hash = "-1";
        let predicted_value = (*PREDICTOR).lock().unwrap().get_predicted_values_by_hash(hash, "Standard", "Hard");
        println!("predicted_value: {}", predicted_value);
        assert_eq!(predicted_value, 0.0);
    }

    #[test]
    fn exisiting_hash() {
        let hash = "FDA568FC27C20D21F8DC6F3709B49B5CC96723BE";
        let predicted_value = (*PREDICTOR).lock().unwrap().get_predicted_values_by_hash(hash, "Standard", "Hard");
        println!("predicted_value: {}", predicted_value);
        assert_ne!(predicted_value, 0.0);
    }

    #[test]
    fn non_exisiting_id() {
        let id = "-1";
        let predicted_value = (*PREDICTOR).lock().unwrap().get_predicted_values_by_id(id, "Standard", "Hard");
        println!("predicted_value: {}", predicted_value);
        assert_eq!(predicted_value, 0.0);
    }

    #[test]
    fn exisiting_id() {
        let id = "1";
        let predicted_value = (*PREDICTOR).lock().unwrap().get_predicted_values_by_id(id, "Standard", "Hard");
        println!("predicted_value: {}", predicted_value);
        assert_ne!(predicted_value, 0.0);
    }
}
