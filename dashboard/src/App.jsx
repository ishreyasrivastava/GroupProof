import { Routes, Route } from 'react-router-dom';
import { useWallet } from './hooks/useWallet';
import Header from './components/Header';
import Home from './pages/Home';
import Project from './pages/Project';
import MyProjects from './pages/MyProjects';
import CreateProject from './pages/CreateProject';
import { CONTRACT_ADDRESS } from './utils/contract';

function App() {
  const { isConnected } = useWallet();

  if (!CONTRACT_ADDRESS) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass rounded-2xl p-8 max-w-md text-center">
          <div className="text-6xl mb-4">⚙️</div>
          <h1 className="text-2xl font-bold mb-2">Configuration Required</h1>
          <p className="text-slate-400">
            Contract address not set. Please configure <code className="hash">VITE_CONTRACT_ADDRESS</code> in your environment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/project/:projectId" element={<Project />} />
          <Route path="/my-projects" element={<MyProjects />} />
          <Route path="/create" element={<CreateProject />} />
        </Routes>
      </main>
      <footer className="border-t border-slate-800 py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-slate-500">
          <p className="mb-2">
            Built with ❤️ by <span className="text-polygon-light">Shreya Srivastava</span>
          </p>
          <p className="text-sm">
            Powered by Polygon • {' '}
            <a 
              href={`https://amoy.polygonscan.com/address/${CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-polygon-light hover:underline"
            >
              View Contract
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
