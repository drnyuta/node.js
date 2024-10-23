import fs from "node:fs/promises";

let users = [];

const USERS_DB_PATH = "./users.json";

export async function loadUsers() {
  try {
    const data = await fs.readFile(USERS_DB_PATH, "utf8");
    users = JSON.parse(data);
  } catch (error) {
    console.error(
      "Could not load users from file, initializing with an empty array",
      error
    );
    users = [];
  }
}

export async function saveUsers() {
  try {
    await fs.writeFile(USERS_DB_PATH, JSON.stringify(users, null, 2));
    console.log("Users saved successfully");
  } catch (error) {
    console.error("Failed to save users", error);
  }
}

export { users };
