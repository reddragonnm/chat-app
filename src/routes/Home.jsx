import { Link } from "react-router";

const Home = () => {
  return (
    <div>
      <h1>Home Page</h1>
      <Link to="/chat">Chat</Link> <br />
      <Link to="/login">Login</Link> <br />
      <Link to="/register">Register</Link> <br />
    </div>
  );
};

export default Home;
