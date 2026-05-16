import { useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import ChatWindow from './components/ChatWindow.jsx';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [refreshDocs, setRefreshDocs] = useState(0);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar refreshTrigger={refreshDocs} onDocChange={setDocuments} />
      <ChatWindow documents={documents} onDocUploaded={() => setRefreshDocs(r => r + 1)} />
    </div>
  );
}
