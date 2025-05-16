export const logoutUser = (navigate: (path: string) => void) => {
  localStorage.removeItem("accessToken");
  navigate("/login");
};
