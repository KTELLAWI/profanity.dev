import { Index } from '@upstash/vector'
import csv from 'csv-parser'
import fs from 'fs'
import { Transform } from 'stream'
import "dotenv/config"
import OpenAI from "openai"
const tf = require('@tensorflow/tfjs');
// require('@tensorflow-models/universal-sentence-encoder');
const use = require('@tensorflow-models/universal-sentence-encoder');
import { LlamaIndex } from 'llama-index-ts';
import { Document, VectorStoreIndex } from "llamaindex";
import fetch from 'node-fetch';


const index = new Index({
  url:process.env.VECTOR_URL,
  token:process.env.VECTOR_TOKEN,
})
const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
})

interface Row {
  text: string
}

// async function getEmbedding(text:string) {
//   // Load the Universal Sentence Encoder
//   // const model = await tf.loadLayersModel('https://tfhub.dev/tensorflow/tfjs-model/universal-sentence-encoder-large/5/model.json');
//    //let model = await use.load();

//   // // Encode the text
//  //  const embeddings = await model.embed(text);

//   // // Extract the embedding vector

// const index = await VectorStoreIndex.fromDocuments(text);

//  // const vector = embeddings.arraySync()[0];

//    return index;
//       // Load the Universal Sentence Encoder
//      // const model = await use.load();

//       // Encode the text
//       //const embeddings = await model.embed(text);
  
//       // Extract the embedding vector
//      // const vector = await embeddings.array();
  
//       //return vector;
// }
const texts = ["This is an example sentence.", "Another example sentence here."];

async function embedText(text:string): Promise<number[][]> {
  try {
      // Send API request to Hugging Face model hub
      const response = await fetch("https://api-inference.huggingface.co/models/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2", {
          method: 'POST',
          headers: {
            "Authorization": "Bearer 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",// Replace with your API token
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({"inputs": {
            "source_sentence": "",
            "sentences": [text]
          }})
      });

      // Extract embeddings from response
      const data = await response.json();
      const embeddings = data.outputs;
console.log(data);
      return data;
  } catch (error) {
      console.error('Error:', error);
      return null;
  }
}

// async function embedAllTexts(texts: string[]): Promise<number[][][]> {
//   const embeddedTexts = [];
//   for (const text of texts) {
//       const embedding = await embedText(text);
//       if (embedding) {
//           embeddedTexts.push(embedding);
//       }
//   }
//   return embeddedTexts;
// }

// // Usage
// embedAllTexts(texts).then(embeddedTexts => {
//   console.log(embeddedTexts);
// });


function createLineRangeStream(startLine: number, endLine: number) {
  let currentLine = 0
  return new Transform({
    transform(chunk, _, callback) {
      if (currentLine >= startLine && currentLine < endLine) {
        this.push(chunk)
      }
      currentLine++
      if (currentLine >= endLine) {
        this.push(null)
      }
      callback()
    },
    objectMode: true,
  })
}

async function parseCSV(
  filePath: string,
  startLine: number,
  endLine: number
): Promise<Row[]> {
  return new Promise((resolve, reject) => {
    const rows: Row[] = []

    fs.createReadStream(filePath)
      .pipe(csv({ separator: ',' }))
      .pipe(createLineRangeStream(startLine, endLine))
      .on('data', (row) => {
        rows.push(row)
      })
      .on('error', (error) => {
        reject(error)
      })
      .on('end', () => {
        resolve(rows)
      })
  })
}

const STEP = 30

const seed = async () => {
  const arabicwords = ["كلب", "عاهرة", "ابن-كلبة", "ابن-عاهرة", "ابن-شرموطة", "فذر", "قذر", "حقير", "حجش", "ابن-كلب", "مومس", "زنديق", "معفن", "حجش", "عرصة", "قحبة", "لص", "متفلسف"]

  for (let i = 0; i < 35; i += STEP) {
    const start = i
    const end = i + STEP

    //const data = await parseCSV('training_data.csv', start, end)
    const formatted = [];

    for (let j = 0; j < arabicwords.length; j++) {
      const row = arabicwords[j];
     // const embedding = await embedText(row.text);
    //  console.log("hsaaaaaaaaaaaaaaaaaaaaaaaaa", embedding);
      formatted.push({
          data: row,
          id:i+j, // Assuming you want to use i + batchIndex here
          metadata: { text: row },
      });
  }
  
      // return {
      //     data: row.text,
      //     id: batchIndex, // Assuming you want batchIndex here
      //     metadata: { text: row.text },
      // };
  //}//);
  
  //)
 // console.log("hsaaaaaaaaaaaaaaaaaaaaaaaaa",formatted);
 // console.log("hsaaaaaaaaaaaaaaaaaaaaaaaaa",vectorWord);


    await index.upsert(formatted)
  }
}

seed()
