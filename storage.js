const { Storage } = require("@google-cloud/storage");

// Initialize storage
const storage = new Storage({
  keyFilename: `./key-file-from-service-account.json`,
});

const bucketName = "my-test-bucket";
const bucket = storage.bucket(bucketName);

// Sending the upload request
const uploadToTheBucket = async (imagePath) => {
  bucket.upload(
    imagePath,
    {
      destination: `someFolderInBucket/image_to_upload.jpeg`,
    },
    function (err, file) {
      if (err) {
        console.error(`Error uploading image image_to_upload.jpeg: ${err}`);
      } else {
        console.log(`Image image_to_upload.jpeg uploaded to ${bucketName}.`);

        // Making file public to the internet
        file.makePublic(async function (err) {
          if (err) {
            console.error(`Error making file public: ${err}`);
          } else {
            console.log(`File ${file.name} is now public.`);
            const publicUrl = file.publicUrl();
            console.log(`Public URL for ${file.name}: ${publicUrl}`);
            return publicUrl;
          }
        });
      }
    }
  );
};

module.exports = {
  uploadToTheBucket,
};
