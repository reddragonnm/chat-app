import { AuthProvider } from "@/AuthContext";
import { Routes, Route, HashRouter } from "react-router";

import Home from "@/routes/Home";
import Chat from "@/routes/Chat";
import Login from "@/routes/Login";
import Register from "@/routes/Register";

const App = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route index element={<Home />}></Route>
          <Route path="/chat" element={<Chat />}></Route>
          <Route path="/login" element={<Login />}></Route>
          <Route path="/register" element={<Register />}></Route>
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;
