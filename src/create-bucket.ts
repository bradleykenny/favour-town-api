// base code from: https://stackabuse.com/uploading-files-to-aws-s3-with-node-js/

const AWS = require('aws-sdk');

// Enter copied or downloaded access ID and secret key here
const ID = 'AKIAVLL6HVDOX2VU4H5S';
const SECRET = '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';

// The name of the bucket that you have created
const BUCKET_NAME = 'favourtown';

// initialise the S3 interface by passing our access keys
const s3 = new AWS.S3({
    accessKeyId: ID,
    secretAccessKey: SECRET
});

const params = {
    Bucket: BUCKET_NAME,
    CreateBucketConfiguration: {
        // Set your region here
        LocationConstraint: "eu-west-1"
    }
};

s3.createBucket(params, function(err, data) {
    if (err) console.log(err, err.stack);
    else console.log('Bucket Created Successfully', data.Location);
});