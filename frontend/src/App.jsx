import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Leaderboard from './components/Leaderboard';
import FunStats from './components/FunStats';
import ProgressChart from './components/ProgressChart';
import AdminPage from './components/AdminPage';
import './App.css';

function Dashboard() {
  return (
    <div className="dashboard">
      <Leaderboard />
      <FunStats />
      <ProgressChart />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <header>
          <h1>Fitness Challenge</h1>
          <nav>
            <Link to="/">Dashboard</Link>
            <Link to="/admin">Admin</Link>
          </nav>
        </header>

        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
