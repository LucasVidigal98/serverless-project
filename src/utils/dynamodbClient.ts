import { DynamoDB } from 'aws-sdk';

const options = {
  region: 'localhost',
  endpoint: 'http://localhost:3333',
  accessKeyId: 'x',  // needed if you don't have aws credentials at all in env
  secretAccessKey: 'x' // needed if you don't have aws credentials at all in env
};

const isOffline = () => {
  return process.env.IS_OFFLINE;
}

export const document = isOffline() ? new DynamoDB.DocumentClient(options) : new DynamoDB.DocumentClient();