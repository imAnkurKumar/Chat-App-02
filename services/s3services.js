const AWS = require("aws-sdk");

const s3 = new AWS.S3({
  accessKeyId: process.env.IAM_USER_KEY,
  secretAccessKey: process.env.IAM_USER_SECRET,
});

exports.uploadToS3 = (fileData, fileName) => {
  const params = {
    Bucket: process.env.BUCKET_NAME,
    Key: fileName,
    Body: fileData,
    ContentType: fileData.mimetype,
    ACL: "public-read",
  };

  return new Promise((resolve, reject) => {
    s3.upload(params, (err, data) => {
      if (err) reject(err);
      resolve(data.Location); // File URL
    });
  });
};
