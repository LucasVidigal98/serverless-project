import { APIGatewayProxyHandler } from "aws-lambda";

import { document } from "../utils/dynamodbClient";

export const handler: APIGatewayProxyHandler = async (event) => {
  const { user_id } = event.pathParameters;

  const todos = await document.query({
    TableName: 'users_todos',
    KeyConditionExpression: "user_id = :id",
    ExpressionAttributeValues: {
      ":id": user_id,
    }
  }).promise();

  if(!todos) {
    return {
      statusCode: 400,
      body: JSON.stringify({ todos: 'Not Found' })
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ todos: todos.Items })
  }
}