import React, { useState, useEffect } from 'react';
import { X, Save, FolderDown, Download, FileCode, Check, HardDrive, Info, Layers } from 'lucide-react';
import { EditorEngine } from '../three/EditorEngine';
import { SceneSerializer } from '../utils/sceneSerializer';

interface SaveSceneModalProps {
  isOpen: boolean;
  onClose: () => void;
  sceneName: string;
  onUpdateSceneName: (name: string) => void;
  engine: EditorEngine | null;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
  onSaveSuccess?: (fileName: string) => void;
}

export const SaveSceneModal: React.FC<SaveSceneModalProps> = ({
  isOpen,
  onClose,
  sceneName,
  onUpdateSceneName,
  engine,
  onShowToast,
  onSaveSuccess
}) => {
  const [name, setName] = useState(sceneName);
  const [fileName, setFileName] = useState('');
  const [isManualFileName, setIsManualFileName] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      setName(sceneName);
      const slug = sceneName.trim().toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '_') || 'scene';
      setFileName(`${slug}.json`);
      setIsManualFileName(false);
      setIsSaving(false);
      setShowJsonPreview(false);
    }
  }, [isOpen, sceneName]);

  if (!isOpen) return null;

  // Handle scene name change and auto-slugify filename if not manually customized
  const handleNameChange = (val: string) => {
    setName(val);
    if (!isManualFileName) {
      const slug = val.trim().toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '_') || 'scene';
      setFileName(`${slug}.json`);
    }
  };

  const handleFileNameChange = (val: string) => {
    setFileName(val);
    setIsManualFileName(true);
  };

  // Generate serialized JSON
  const getSceneData = () => {
    if (!engine) return null;
    const finalSceneName = name.trim() || 'Untitled Scene';
    return SceneSerializer.serialize(engine, finalSceneName);
  };

  const getCleanFileName = () => {
    let clean = fileName.trim();
    if (!clean) {
      const slug = name.trim().toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '_') || 'scene';
      clean = `${slug}.json`;
    }
    if (!clean.toLowerCase().endsWith('.json')) {
      clean += '.json';
    }
    return clean;
  };

  // Helper to persist saved 3D scene into browser cache localStorage
  const persistToBrowserCache = (savedSceneName: string, sceneDataObj: any) => {
    try {
      const stored = localStorage.getItem('modcx3d_saved_projects');
      let projects: any[] = stored ? JSON.parse(stored) : [];
      
      // Clean out legacy/dummy items
      projects = projects.filter((p: any) =>
        p.id !== 'proj_default' &&
        !['Blank 3D Canvas', 'Untitled 3D Scene', 'Main 3D Workspace Scene'].includes(p.name)
      );

      const existingIndex = projects.findIndex((p: any) => p.name === savedSceneName);
      const newProj = {
        id: existingIndex >= 0 ? projects[existingIndex].id : `proj_${Date.now()}`,
        name: savedSceneName,
        updatedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        objectCount: sceneDataObj.objects?.length || 0,
        filePath: `Browser Cache / Local Storage`,
        data: sceneDataObj
      };

      if (existingIndex >= 0) {
        projects[existingIndex] = newProj;
      } else {
        projects.unshift(newProj);
      }

      localStorage.setItem('modcx3d_saved_projects', JSON.stringify(projects));
      localStorage.setItem('modcx3d_last_saved_scene', JSON.stringify(newProj));
    } catch (err) {
      console.warn('Could not save project to browser cache localStorage:', err);
    }
  };

  // Save via Native Computer File Picker (Select Folder + Choose Name)
  const handleSaveWithPicker = async () => {
    if (!engine) return;
    setIsSaving(true);
    const finalSceneName = name.trim() || 'Untitled Scene';
    const finalFileName = getCleanFileName();
    onUpdateSceneName(finalSceneName);

    try {
      const sceneData = await SceneSerializer.serializeAsync(engine, finalSceneName);
      persistToBrowserCache(finalSceneName, sceneData);
      const jsonStr = JSON.stringify(sceneData, null, 2);

      // Check if the browser supports window.showSaveFilePicker (Chrome, Edge, Opera, etc.)
      if (typeof (window as any).showSaveFilePicker === 'function') {
        try {
          const handle = await (window as any).showSaveFilePicker({
            suggestedName: finalFileName,
            types: [
              {
                description: 'JSON 3D Scene File (*.json)',
                accept: {
                  'application/json': ['.json']
                }
              }
            ]
          });

          const writable = await handle.createWritable();
          await writable.write(jsonStr);
          await writable.close();

          const savedName = handle.name || finalFileName;
          onShowToast(`Scene & GLB model metadata saved to computer as "${savedName}"`, 'success');
          onSaveSuccess?.(savedName);
          onClose();
          return;
        } catch (err: any) {
          if (err.name === 'AbortError') {
            // User canceled the file dialog
            setIsSaving(false);
            return;
          }
          console.warn('Native file picker not allowed or failed, falling back to download:', err);
        }
      }

      // Fallback if showSaveFilePicker is not supported or restricted in iframe
      fallbackDownload(jsonStr, finalFileName, finalSceneName);
    } catch (err: any) {
      onShowToast('Error serializing scene: ' + err.message, 'error');
      setIsSaving(false);
    }
  };

  // Standard direct download
  const handleDirectDownload = async () => {
    if (!engine) return;
    setIsSaving(true);
    const finalSceneName = name.trim() || 'Untitled Scene';
    const finalFileName = getCleanFileName();
    onUpdateSceneName(finalSceneName);

    try {
      const sceneData = await SceneSerializer.serializeAsync(engine, finalSceneName);
      persistToBrowserCache(finalSceneName, sceneData);
      const jsonStr = JSON.stringify(sceneData, null, 2);
      fallbackDownload(jsonStr, finalFileName, finalSceneName);
    } catch (err: any) {
      onShowToast('Error generating scene file: ' + err.message, 'error');
      setIsSaving(false);
    }
  };

  const fallbackDownload = (jsonStr: string, downloadFileName: string, savedSceneName: string) => {
    try {
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = downloadFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      onShowToast(`Saved "${savedSceneName}" as ${downloadFileName}`, 'success');
      onSaveSuccess?.(downloadFileName);
      onClose();
    } catch (err: any) {
      onShowToast('Failed to save file: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate object stats
  const sceneData = getSceneData();
  const objectCount = sceneData?.objects?.length || 0;
  const jsonString = sceneData ? JSON.stringify(sceneData, null, 2) : '{}';
  const sizeInKb = (new Blob([jsonString]).size / 1024).toFixed(1);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#181a20] border border-[#333842] rounded-xl shadow-2xl max-w-md w-full overflow-hidden text-xs text-gray-200">
        {/* Header */}
        <div className="px-4 py-3 bg-[#15171d] border-b border-[#282b33] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Save size={14} />
            </div>
            <div>
              <h2 className="font-semibold text-white text-sm">Save Scene JSON</h2>
              <p className="text-[10px] text-gray-400">Choose scene name, destination folder and file name</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#282c35] rounded text-gray-400 hover:text-white transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-4">
          {/* Scene Name */}
          <div>
            <label className="block text-[11px] font-medium text-gray-300 mb-1">
              Scene Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. My Horror Scene"
              className="w-full px-3 py-2 bg-[#101216] border border-[#2d313b] focus:border-cyan-500 rounded text-gray-200 text-xs outline-none transition-colors"
              autoFocus
            />
            <p className="text-[10px] text-gray-400 mt-1">
              This name is saved into the scene metadata and displayed in the editor.
            </p>
          </div>

          {/* File Name */}
          <div>
            <label className="block text-[11px] font-medium text-gray-300 mb-1">
              File Name
            </label>
            <div className="flex items-center bg-[#101216] border border-[#2d313b] focus-within:border-cyan-500 rounded px-2">
              <FileCode size={14} className="text-cyan-400 mr-2 shrink-0" />
              <input
                type="text"
                value={fileName}
                onChange={(e) => handleFileNameChange(e.target.value)}
                placeholder="scene_name.json"
                className="w-full py-2 bg-transparent text-gray-200 text-xs outline-none"
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              Must end with <code className="text-cyan-400">.json</code>
            </p>
          </div>

          {/* Scene Summary Badge */}
          <div className="bg-[#121419] border border-[#242831] rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers size={14} className="text-cyan-400" />
              <span className="text-gray-300 text-[11px]">Scene Objects:</span>
              <span className="font-semibold text-white">{objectCount} items</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400 text-[11px]">
              <HardDrive size={13} />
              <span>Est. Size: <strong className="text-gray-200">{sizeInKb} KB</strong></span>
            </div>
          </div>

          {/* Informational tip on folder selection */}
          <div className="bg-cyan-950/30 border border-cyan-800/40 rounded-lg p-2.5 flex items-start gap-2 text-[11px] text-cyan-200/90">
            <Info size={14} className="text-cyan-400 shrink-0 mt-0.5" />
            <span>
              Clicking <strong>Select Folder & Save</strong> opens your computer's native Save file dialog, letting you choose any folder on your hard drive and confirm the filename.
            </span>
          </div>

          {/* Collapsible JSON Preview */}
          <div>
            <button
              type="button"
              onClick={() => setShowJsonPreview(!showJsonPreview)}
              className="text-[11px] text-gray-400 hover:text-cyan-400 flex items-center gap-1 transition-colors"
            >
              <span>{showJsonPreview ? 'Hide' : 'View'} raw JSON structure</span>
            </button>
            {showJsonPreview && (
              <div className="mt-2 relative">
                <pre className="bg-[#0e1014] border border-[#242831] p-2.5 rounded-lg text-[10px] font-mono text-gray-300 max-h-36 overflow-y-auto whitespace-pre-wrap select-text">
                  {jsonString}
                </pre>
                <button
                  type="button"
                  onClick={handleCopyJson}
                  className="absolute top-2 right-2 px-2 py-1 bg-[#20242e] hover:bg-[#2c3240] rounded text-[10px] text-gray-300 flex items-center gap-1 transition-colors"
                >
                  {copied ? <Check size={11} className="text-emerald-400" /> : <Save size={11} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-3 bg-[#15171d] border-t border-[#282b33] flex items-center justify-between gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 hover:bg-[#282c35] text-gray-300 rounded font-medium transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            {/* Direct browser download */}
            <button
              onClick={handleDirectDownload}
              disabled={isSaving}
              className="px-3 py-1.5 bg-[#20242e] hover:bg-[#2c3240] text-gray-200 rounded font-medium flex items-center gap-1.5 transition-colors"
              title="Download directly to your default browser downloads folder"
            >
              <Download size={13} />
              <span>Direct Download</span>
            </button>

            {/* Save to Computer Folder (Native File Picker) */}
            <button
              onClick={handleSaveWithPicker}
              disabled={isSaving}
              className="px-4 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded font-medium flex items-center gap-1.5 shadow-md transition-all"
            >
              <FolderDown size={14} />
              <span>{isSaving ? 'Saving...' : 'Select Folder & Save'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
