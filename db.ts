import pg from "pg";

const DATABASE_URL = process.env.DATABASE_URL;
const PORT = process.env.PORT;

if (DATABASE_URL === undefined) {
throw new Error("DATABASE URL NOT DEFINED");
}

if (PORT === undefined) {
throw new Error("PORT NUMBER NOT DEFINED");
}

