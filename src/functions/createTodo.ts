import { APIGatewayProxyHandler } from "aws-lambda";
import { v4 as uuidV4 } from 'uuid';

import { document } from "../utils/dynamodbClient";


interface IRequest {
  title: string;
  deadline: string;
}

interface ICreateTODO {
  id: string;
  user_id: string;
  done: boolean;
  deadline: Date;
  title: string;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  const { user_id } = event.pathParameters;

  const { title, deadline } = event.body as unknown as IRequest;

  const newTodo: ICreateTODO = {
    id: uuidV4(),
    title,
    user_id,
    done: false,
    deadline: new Date(deadline),
  }

  await document.put({
    TableName: 'users_todos',
    Item: newTodo
  }).promise();

  const todos = await document.query({
    TableName: 'users_todos',
    KeyConditionExpression: "id = :id",
    ExpressionAttributeValues: {
      ":id": newTodo.id,
    }
  }).promise();

  return {
    statusCode: 201,
    body: JSON.stringify({ message: 'TODO Created!', todo: todos.Items[0] })
  }
}