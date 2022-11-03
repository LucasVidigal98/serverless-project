import { APIGatewayProxyHandler } from "aws-lambda"
import { document } from "../utils/dynamodbClient";
import * as handlebars from 'handlebars';
import { DateTime } from 'luxon';
import chromium from 'chrome-aws-lambda';
import { S3 } from 'aws-sdk';

import { join } from 'path';
import { readFileSync } from "fs";

interface ICreateCertificate {
  id: string,
  name: string,
  grade: string,
}

interface ITemplate extends ICreateCertificate {
  medal: string;
  date: string
}

const compile = async (data: ITemplate) => {
  const filePath = join(process.cwd(), 'src', 'templates', 'certificate.hbs');

  const html = readFileSync(filePath, 'utf-8');

  return handlebars.compile(html)(data);
};

export const handler: APIGatewayProxyHandler = async (event) => {
  const { id, name, grade } = JSON.parse(event.body) as ICreateCertificate;

  const response = await document.query({
    TableName: 'users_certificate',
    KeyConditionExpression: "id = :id",
    ExpressionAttributeValues: {
      ":id": id,
    }
  }).promise();

  const userAlreadyExists = response.Items[0];

  if(!userAlreadyExists) {
    await document.put({
      TableName: 'users_certificate',
      Item: {
        id,
        name,
        grade,
        created_at: new Date().getTime(),
      }
    }).promise();
  
    const medalPath = join(process.cwd(), 'src', 'templates', 'selo.png');
    const medal = readFileSync(medalPath, 'base64');
  
    const data: ITemplate = {
      name,
      id,
      grade,
      date: DateTime.now().toFormat('DD/MM/YYYY'),
      medal
    };
  
    const content = await compile(data);
  
    const browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      // headless: chromium.headless,
    });
  
    const page = await browser.newPage();
  
    await page.setContent(content);
  
    const pdf = await page.pdf({
      format: 'a4',
      landscape: true,
      printBackground: true,
      preferCSSPageSize: true,
      path: process.env.IS_OFFLINE ? './cerfiticate.pdf' : null
    });
  
    await browser.close();
  
    const s3 = new S3();
  
    await s3.putObject({
      Bucket: 'iginitecertificate',
      Key: `${id}.pdf`,
      ACL: 'public-read',
      Body: pdf,
      ContentType: 'application/pdf'
    }).promise();
  
    return {
      statusCode: 201,
      body: JSON.stringify({
        message: 'Certificado Criado com sucesso',
        url: `https://iginitecertificate.s3.amazonaws.com/${id}.pdf`
      })
    }
  }

  return {
    statusCode: 400,
    body: JSON.stringify({message: 'User Already Exists!'})
  }
}