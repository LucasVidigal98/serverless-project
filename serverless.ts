import type { AWS } from '@serverless/typescript';


const serverlessConfiguration: AWS = {
  service: 'ignitecertificate',
  frameworkVersion: '3',
  plugins: ['serverless-esbuild', 'serverless-dynamodb-local', 'serverless-offline'],
  provider: {
    name: 'aws',
    runtime: 'nodejs14.x',
    region: 'us-east-1',
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      NODE_OPTIONS: '--enable-source-maps --stack-trace-limit=1000',
    },
    iam: {
      role: {
        statements: [
          {
            Effect: "Allow",
            Action: ["dynamodb:*"],
            Resource: ["*"],
            
          },
          {
            Effect: "Allow",
            Action: ["s3:*"],
            Resource: ["*"],
          }
        ]
      }
    }
  },
  package: {
    individually: false,
    include: ['./src/templates/**']
  },
  // import the function via paths
  functions: { 
    generateCertificate: {
      handler: 'src/functions/generateCertificate.handler',
      events: [
        {
          http: {
            path:'generateCertificate',
            method: 'post',
            cors: true
          }
        }
      ]
    },
    verifyCertificate: {
      handler: 'src/functions/verifyCertificate.handler',
      events: [
        {
          http: {
            path:'verifyCertificate/{id}',
            method: 'get',
            cors: true
          }
        }
      ]
    },
    createTodo: {
      handler: 'src/functions/createTodo.handler',
      events: [
        {
          http: {
            path:'createTodo/{user_id}',
            method: 'post',
            cors: true
          }
        }
      ]
    },
    getTodo: {
      handler: 'src/functions/getTodo.handler',
      events: [
        {
          http: {
            path:'getTodo/{user_id}',
            method: 'get',
            cors: true
          }
        }
      ]
    },
  },
  custom: {
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ['aws-sdk'],
      target: 'node14',
      define: { 'require.resolve': undefined },
      platform: 'node',
      concurrency: 10,
      external: ["chrome-aws-lambda"]
    },
    dynamodb: {
      stages: ['dev', 'local'],
      start: {
        port: 3333,
        inMemory: true,
        migrate: true,
      },
    },
  },
  resources: {
    Resources: {
      dbCertificateUsers: {
        Type: "AWS::DynamoDB::Table",
        Properties: {
          TableName: 'users_certificate',
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
          },
          AttributeDefinitions: [
            {
              AttributeName: 'id',
              AttributeType: 'S'
            }
          ],
          KeySchema: [
            {
              AttributeName: 'id',
              KeyType: 'HASH'
            }
          ]
        }
      },
      dbTodosUsers: {
        Type: "AWS::DynamoDB::Table",
        Properties: {
          TableName: 'users_todos',
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
          },
          AttributeDefinitions: [
            {
              AttributeName: 'id',
              AttributeType: 'S'
            }
          ],
          KeySchema: [
            {
              AttributeName: 'id',
              KeyType: 'HASH'
            }
          ]
        }
      }
    }
  }
};

module.exports = serverlessConfiguration;
