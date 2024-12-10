const vision = require('@google-cloud/vision');
const {VertexAI} = require('@google-cloud/vertexai');

const path = require('path');
const fs = require('fs');
  

/**
 * TODO(developer): Update these variables before running the sample.
 */
export async function createNonStreamingMultipartContent(
  projectId :string,
  location:string,
  model :string,
  imageBase64 :string,
  instruction = 'Extract text from an image'
) {
  // Initialize Vertex with your Cloud project and location
  const vertexAI = new VertexAI({project: projectId, location: location});

  // Instantiate the model
  const generativeVisionModel = vertexAI.getGenerativeModel({
    model: model,
  });

  const filePart = {inline_data: {data: imageBase64, mimeType: 'image/jpeg'}};

  const textPart1 = {
      text: instruction,
    };
  
    const request = {
      contents: [{role: 'user', parts: [filePart, textPart1]}],
    };
  
    console.log('Prompt Text:');
    const textPart2 = request.contents[0].parts[1];
  if ('text' in textPart2) {
    console.log(textPart1.text);
  }

  console.log('AI Response:');

  // Generate a response
  const response = await generativeVisionModel.generateContent(request);

  if (response && response.response && response.response.candidates && response.response.candidates[0] && response.response.candidates[0].content && response.response.candidates[0].content.parts && response.response.candidates[0].content.parts[0]) {
    // Select the text from the response
    const fullTextResponse = response.response.candidates[0].content.parts[0].text;
    console.log(fullTextResponse);
    return fullTextResponse;
  } else {
    console.error('Invalid response format:', response);
  }

}

//testAI();

// testing function
async function testAI() {

  try {

    const projectId = process.env.GOOGLE_PROJECT_ID;
    const location = process.env.GOOGLE_LOCATION;
    const model = process.env.GOOGLE_MODEL;

    if (!projectId || !location || !model) {
        throw new Error('Google Cloud environment variables are not set');
    }

    const imagePath = path.join(__dirname, 'screenshot.png');
    const imageFile = fs.readFileSync(imagePath);
    var encoded = Buffer.from(imageFile).toString('base64');

    console.log("imageBase64:", encoded);

    const response =await createNonStreamingMultipartContent(projectId,location,model,encoded,'write me test cases to functional testin in specfic formate, and return in json formate');
     // const response = await processImageAndQuery(imagePath, query);
      console.log("AI Response:", response);
    } catch (error) {
      console.error("Error processing the image or query:", error);
    } 
  
  }
    