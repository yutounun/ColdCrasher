"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const express = require("express");
const axios = require("axios");
const cron = require("node-cron");
const bodyParser = require("body-parser");
const app = express();
const port = 3000;
app.use(bodyParser.json());
app.post("/", (req, res) => {
    const urlCreated = postUrl(req.body);
    res.send(JSON.stringify(urlCreated));
});
function postUrl(body) {
    return __awaiter(this, void 0, void 0, function* () {
        const urlCreated = yield prisma.url.create({
            data: {
                url: body.url,
                timer: {
                    create: {
                        min: body.min
                    },
                },
            },
        });
        console.log("urlCreated:", urlCreated);
        return urlCreated;
    });
}
function schedule() {
    return __awaiter(this, void 0, void 0, function* () {
        const registeredUrls = yield prisma.url.findMany({ include: { timer: true } } // Include the related timer model
        );
        console.log("registeredUrls:", registeredUrls);
        registeredUrls.forEach((url) => {
            // Send request every 15 minutes
            url.timer && url.timer.min &&
                cron.schedule(`*/${url.timer.min} * * * *`, () => __awaiter(this, void 0, void 0, function* () {
                    url.timer && url.timer.min &&
                        console.log("Sending request to ", url.url, "as it's been ", url.timer.min, " minutes since the last request");
                    try {
                        const response = yield axios.get(url.url);
                        console.log("Response received:", response.status);
                    }
                    catch (error) {
                        console.error("Error during request:", error.message);
                    }
                }));
        });
    });
}
// run when starting the server
schedule();
app.listen(3000, () => {
    console.log("Server is running on port 3000");
});
