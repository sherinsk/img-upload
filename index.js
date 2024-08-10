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

    // Read image using Jimp
    const image = await Jimp.read(buffer);
    

    // Enhance the image quality
    // image
    //   .brightness(0.2)  // Adjust brightness
    //   .contrast(0.2)    // Adjust contrast
    //   .sharpen();       // Apply sharpening

    return image;
  } catch (error) {
    throw new Error('Error removing background: ' + error.message);
  }
}

async function addSolidBackground(image, outputFilePath, color = '#ffffff') {
  try {
    const { width, height } = image.bitmap;

    image.brightness(0.2);
    image.contrast(0.2);

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

// Serve static files from the 'result' directory
app.use('/result', express.static(path.join('result')));

// Endpoint to remove background from an uploaded image
app.post('/remove-background', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    // Path to the uploaded file
    const inputFilePath = path.join('uploads', req.file.filename);

    // Remove background and enhance the image
    const image = await removeImageBackground(inputFilePath);

    // Create result file path
    const resultFilePath = path.join('result', `result-${Date.now()}.jpeg`);

    // Add solid background to the image and save it
    await addSolidBackground(image, resultFilePath);

    // Extract filename from resultFilePath
    const filename = path.basename(resultFilePath);

    // Construct the URL to access the result image
    const resultUrl = `http://localhost:${port}/result/${filename}`;

    // Return the URL
    res.status(200).json({ message: "Image processed successfully", resultUrl });

    // Clean up: Remove the uploaded file
    fs.unlinkSync(inputFilePath);
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Error processing image' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
