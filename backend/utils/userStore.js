const users = new Map();

module.exports = {
  addUser(id, data) {
    users.set(id, { id, ...data });
  },
  removeUser(id) {
    users.delete(id);
  },
  getAllUsers() {
    return Array.from(users.values());
  },
  getUser(id) {
    return users.get(id);
  },
};