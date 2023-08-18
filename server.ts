import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();
const express = require("express");
const axios = require("axios");
const cron = require("node-cron");
const bodyParser = require("body-parser");
const app = express();
const port = 3000;
app.use(bodyParser.json());

type RequestBody = {
  url: string
  min: number
}

app.post("/", (req: Request, res: { send: (arg0: string) => Response }) => {
  postUrl(req.body);
});

async function postUrl (body: RequestBody) {
  const urlCreated = await prisma.url.create({
    data: {
      url: body.url,
      timer: {
        create: {
          min: body.min
        },
      },
    },
  });
  console.log("urlCreated:", urlCreated)
}

async function schedule() {
  const registeredUrls = await prisma.url.findMany(
    {include: { timer: true }} // Include the related timer model
  );
  console.log("registeredUrls:", registeredUrls);

  registeredUrls.forEach((url) => {
    // Send request every 15 minutes
    url.timer && url.timer.min &&
      cron.schedule(`*/${url.timer.min} * * * *`, async () => {
        console.log("Sending request to ...", url.url);
        try {
          const response = await axios.get(url.url);
          console.log("Response received:", response.status);
        } catch (error: any) {
          console.error("Error during request:", error.message);
        }
      });
  })
  
}

// run when starting the server
schedule()

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});