import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AuthPage from "./Pages/Auth";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AuthPage />} />
      </Routes>
    </Router>
  );
}

export default App;
