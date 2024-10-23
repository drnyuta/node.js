import http from "node:http";
import { handleRequests } from "./requestHandler.js";
import { loadUsers } from "./utils.js";

const server = http.createServer(handleRequests);

await loadUsers();

const HOST = "127.0.0.1";
const PORT = 3000;

server.listen(PORT, HOST, () => {
  console.log(`Server is running on http://${HOST}:${PORT}`);
});
