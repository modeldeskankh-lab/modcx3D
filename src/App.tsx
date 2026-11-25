import React, { useState } from 'react';
import { LandingPage } from './components/LandingPage';
import { ModcxHub } from './components/ModcxHub';
import { SceneEditor } from './SceneEditor';
import { EditorSceneData } from './types/editor';

export default function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'hub' | 'editor'>('landing');
  const [activeSceneData, setActiveSceneData] = useState<EditorSceneData | null>(null);

  const handleExploreHub = () => {
    setCurrentView('hub');
  };

  const handleLaunchEditorDirectly = () => {
    setActiveSceneData(null);
    setCurrentView('editor');
  };

  const handleOpenSceneFromHub = (sceneData?: EditorSceneData) => {
    setActiveSceneData(sceneData || null);
    setCurrentView('editor');
  };

  const handleBackToLanding = () => {
    setCurrentView('landing');
  };

  const handleBackToHub = () => {
    setCurrentView('hub');
  };

  if (currentView === 'landing') {
    return (
      <LandingPage
        onExploreHub={handleExploreHub}
        onLaunchEditorDirectly={handleLaunchEditorDirectly}
      />
    );
  }

  if (currentView === 'hub') {
    return (
      <ModcxHub
        onOpenScene={handleOpenSceneFromHub}
        onBackToLanding={handleBackToLanding}
      />
    );
  }

  return (
    <SceneEditor
      key={activeSceneData ? activeSceneData.name + Date.now() : 'default_editor'}
      onBackToHub={handleBackToHub}
      initialSceneData={activeSceneData}
    />
  );
}
