import API from "../api";

const authConfig = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("adminToken") || ""}`
  }
});

export async function getUsers() {
  const response = await API.get("/admin/users/", authConfig());
  return response.data;
}

export async function createUser(payload) {
  const response = await API.post("/admin/users/", payload, authConfig());
  return response.data;
}

export async function updateUser(userId, payload) {
  const response = await API.put(`/admin/users/${userId}`, payload, authConfig());
  return response.data;
}

export async function deleteUser(userId) {
  await API.delete(`/admin/users/${userId}`, authConfig());
}
