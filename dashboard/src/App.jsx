import { Routes, Route } from 'react-router-dom';
import { useWallet } from './hooks/useWallet';
import Header from './components/Header';
import Home from './pages/Home';
import Project from './pages/Project';
import MyProjects from './pages/MyProjects';
import CreateProject from './pages/CreateProject';
import { CONTRACT_ADDRESS, getContractExplorerUrl } from './utils/contract';

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/project/:projectId" element={<Project />} />
          <Route path="/my-projects" element={<MyProjects />} />
          <Route path="/create" element={<CreateProject />} />
        </Routes>
      </main>
      
      <Footer />
    </div>
  );
}

function Footer() {
  const contractUrl = getContractExplorerUrl();
  
  return (
    <footer className="border-t border-white/5 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="text-zinc-500 text-sm">
            Built with ❤️ by{' '}
            <a 
              href="https://github.com/ishreyasrivastava"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              Shreya Srivastava
            </a>
          </div>
          
          <div className="flex items-center gap-4 text-sm">
            <span className="text-zinc-600">Powered by Polygon</span>
            {contractUrl && (
              <a 
                href={contractUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-500 hover:text-purple-400 transition-colors"
              >
                View Contract
              </a>
            )}
            <a 
              href="https://github.com/ishreyasrivastava/GroupProof"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-500 hover:text-purple-400 transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default App;
