import { URL } from "node:url";
import { parseRequestBody } from "./parser.js";
import { saveUsers, users } from "./utils.js";

export async function handleRequests(req, res) {
  const { method, url: requestUrl, headers } = req;
  const url = new URL(requestUrl, `http://${headers.host}`);
  const pathname = url.pathname;
  const searchParams = url.searchParams;
  const route = pathname.split("/").filter(Boolean);

  res.setHeader("Content-Type", "application/json");

  // get user list by query
  if (method === "GET" && pathname === "/users") {
    let filteredUsers = users;

    const name = searchParams.get("name");
    const minAge = searchParams.get("minAge");
    const maxAge = searchParams.get("maxAge");

    if (name) {
      filteredUsers = filteredUsers.filter((user) => user.name.includes(name));
    }
    if (minAge) {
      filteredUsers = filteredUsers.filter(
        (user) => user.age >= Number(minAge)
      );
    }
    if (maxAge) {
      filteredUsers = filteredUsers.filter(
        (user) => user.age <= Number(maxAge)
      );
    }

    if (filteredUsers.length === 0) {
      res.statusCode = 404;
      res.end(JSON.stringify({ message: "Users not found" }));
      return;
    }

    res.statusCode = 200;
    res.end(JSON.stringify(filteredUsers));
    return;
  }

  // get user by id
  if (method === "GET" && route[0] === "users" && route[1]) {
    const userId = route[1];
    const user = users.find((u) => u.id === userId);

    if (user) {
      res.statusCode = 200;
      res.end(JSON.stringify(user));
    } else {
      res.statusCode = 404;
      res.end(JSON.stringify({ message: "User not found" }));
    }
    return;
  }

  // create new user
  if (method === "POST" && pathname === "/users") {
    try {
      const newUser = await parseRequestBody(req);
      newUser.id = Date.now().toString();
      users.push(newUser);
      await saveUsers();

      res.statusCode = 201;
      res.end(JSON.stringify(newUser));
    } catch (error) {
      res.statusCode = 400;
      res.end(JSON.stringify({ message: "Invalid request body" }));
    }
    return;
  }

  // upsert (update or insert) user by id
  if (method === "PUT" && route[0] === "users" && route[1]) {
    const userId = route[1];

    try {
      const updatedUser = await parseRequestBody(req);
      let userIndex = users.findIndex((u) => u.id === userId);

      if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], ...updatedUser, id: userId };
        res.statusCode = 200;
      } else {
        updatedUser.id = userId;
        users.push(updatedUser);
        res.statusCode = 201;
      }

      await saveUsers();
      res.end(JSON.stringify(updatedUser));
    } catch (error) {
      res.statusCode = 400;
      res.end(JSON.stringify({ message: "Invalid request body" }));
    }
    return;
  }

  // patch (partial update) user by id
  if (method === "PATCH" && route[0] === "users" && route[1]) {
    const userId = route[1];

    try {
      const partialUpdate = await parseRequestBody(req);
      let user = users.find((u) => u.id === userId);

      if (user) {
        Object.assign(user, partialUpdate);
        await saveUsers();
        res.statusCode = 200;
        res.end(JSON.stringify(user));
      } else {
        res.statusCode = 404;
        res.end(JSON.stringify({ message: "User not found" }));
      }
    } catch (error) {
      res.statusCode = 400;
      res.end(JSON.stringify({ message: "Invalid request body" }));
    }
    return;
  }

  // delete user by id
  if (method === "DELETE" && route[0] === "users" && route[1]) {
    const userId = route[1];
    const userIndex = users.findIndex((u) => u.id === userId);

    if (userIndex !== -1) {
      users.splice(userIndex, 1);
      await saveUsers();
      res.statusCode = 204;
      res.end();
    } else {
      res.statusCode = 404;
      res.end(JSON.stringify({ message: "User not found" }));
    }
    return;
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ message: "Not Found" }));
}
