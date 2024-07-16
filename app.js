const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { promisify } = require("util");
const axios = require("axios");
const { URL } = require("url");
const pdf2img = require("pdf-img-convert");
const { uploadToTheBucket } = require("./storage");
const app = express();
const port = 3002;

app.use(express.json());

// Set up multer for file upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Define a route for PDF to Images conversion
app.post("/convert", async (req, res) => {
  try {
    const { pdfUrl } = req.body || {};

    if (!pdfUrl) {
      return res.status(400).send("Please provide a PDF file URL.");
    }

    // Create a temporary directory to store images
    const tmpDir = "./tmp";
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir);
    }

    // Extract the filename from the URL
    const url = new URL(pdfUrl);
    const pdfFileName = url.pathname.split("/").pop();
    //download the pdf file
    const response = await axios.get(pdfUrl, { responseType: "arraybuffer" });
    //save the pdf file in the tmp directory
    const pdfPath = `${tmpDir}/${pdfFileName}`;
    await promisify(fs.writeFile)(pdfPath, response.data);
    console.log("PDF file saved successfully.");

    // Convert PDF to images
    let outputImages = pdf2img.convert(pdfUrl);

    outputImages.then(function (outputImages) {
      // Create the "output" directory
      fs.mkdir(
        `output_${pdfFileName}`,
        { recursive: true },
        function (mkdirError) {
          if (mkdirError) {
            console.error('Error creating "output" directory: ' + mkdirError);
            return;
          }

          // Loop through the outputImages and save them in the "output" directory
          for (let i = 0; i < outputImages.length; i++) {
            const imagePath = path.join(
              `output_${pdfFileName}`,
              "output" + i + ".png"
            );
            fs.writeFile(
              imagePath,
              outputImages[i],
              async function (writeError) {
                if (writeError) {
                  console.error("Error writing image " + i + ": " + writeError);
                } else {
                  console.log(
                    "Image " + i + " generated successfully." + outputImages[i]
                  );
                  // Upload the image to the bucket
                  // let publicUrl = await uploadToTheBucket(imagePath);
                  // console.log("Public URL for image " + i + ": " + publicUrl);
                }
              }
            );
          }

          res
            .status(200)
            .send("PDF to image conversion completed successfully.");
        }
      );
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred during PDF to image conversion.");
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
