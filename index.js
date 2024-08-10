const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const Jimp = require('jimp');
const { removeBackground } = require('@imgly/background-removal-node');

const app = express();
const port = 3000;

// Set up multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Directory to store uploaded files
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Original file name
  }
});

const upload = multer({ storage });

// Function to remove background from an image file
async function removeImageBackground(imgSource) {
  try {
      // Removing background
      const blob = await removeBackground(imgSource);

      // Converting Blob to buffer
      const buffer = Buffer.from(await blob.arrayBuffer());

      const image = await Jimp.read(buffer);
      
      return image;

      // // Generating data URL
      // const dataURL = `data:image/png;base64,${buffer.toString("base64")}`;
      
      // // Returning the data URL
      // return dataURL;
  } catch (error) {
      // Handling errors
      throw new Error('Error removing background: ' + error);
  }
}

async function addSolidBackground(image, outputFilePath, color = '#ff0000') {
  try {
    const { width, height } = image.bitmap;

    // Create a new image with the background color
    const background = new Jimp(width, height, color);

    // Composite the image with the solid background
    background.composite(image, 0, 0);

    // Write the result to a file
    await background.writeAsync(outputFilePath);
  } catch (error) {
    throw new Error('Error adding solid background: ' + error.message);
  }
}

// Endpoint to remove background from an uploaded image
app.post('/remove-background', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    // Path to the uploaded file
    const inputFilePath = `./uploads/${req.file.filename}`
    console.log(typeof(inputFilePath))

    // Remove background
    const image = await removeImageBackground(inputFilePath);

    // fs.writeFileSync(`./result/output.png`, imageWithNoBackground.split(';base64,').pop(), { encoding: 'base64' });

    const resultFilePath = `./result/result-${Date.now()}.jpeg`;

    await addSolidBackground(image, resultFilePath);

    // Return the data URL
    res.status(200).json({message:"Updated"});

    // Clean up: Remove the uploaded file
    fs.unlinkSync(inputFilePath);
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Error removing background' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
