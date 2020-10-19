const fs = require("fs");
const AWS = require("aws-sdk");

/************* Client Initialisation *************/
// Enter copied or downloaded access ID and secret key here
// for user "Test"
const ID = "AKIAVLL6HVDOX2VU4H5S";
const SECRET = "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";

// The name of the bucket that you have created
const BUCKET_NAME = "favourtown";

// credentials
const s3 = new AWS.S3({
	accessKeyId: ID,
	secretAccessKey: SECRET,
});

// uploading functionalities
const uploadFile = (fileName: any) => {
	// Read content from the file
	const fileContent = fs.readFileSync(fileName);

	// Setting up S3 upload parameters
	const params = {
		Bucket: BUCKET_NAME,
		Key: fileName, // File name you want to save as in S3
		Body: fileContent,
	};

	// Uploading files to the bucket
	s3.upload(params, (err: any, data: any) => {
		if (err) {
			console.log('error in uploading');
			throw err;
		}
		console.log("File uploaded successfully.");
	});
};

uploadFile("cat.jpg");
