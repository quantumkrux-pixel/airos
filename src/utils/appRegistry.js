import { FileText, Folder, Palette, MessageSquare, Video, Image, Globe, Play, Calendar as CalendarIcon, Terminal as TerminalIcon, Code2, RefreshCw } from 'lucide-react';
import TextEditor from '../components/apps/TextEditor/TextEditor';
import FileManager from '../components/apps/FileManager/FileManager';
import ImageViewer from '../components/apps/ImageViewer/ImageViewer';
import MediaPlayer from '../components/apps/MediaPlayer/MediaPlayer';
import { BrowserApp } from '../components/apps/browser/BrowserApp';
import Calendar from '../components/apps/Calendar/Calendar';
import Terminal from '../components/apps/Terminal/Terminal';
import CodeEditor from '../components/apps/CodeEditor/CodeEditor';
import FileConverter from '../components/apps/FileConverter/FileConverter';
import { SketchApp } from '../components/apps/Sketch/SketchApp';
import AirChat from '../components/apps/AirChat/AirChat';
import ScreenRecorder from '../components/apps/ScreenRipper';


export const appRegistry = {
  code: {
    Component: CodeEditor,
    icon: Code2,
    title: 'Codex | IDE',
    name: 'Codex',
    defaultSize: { minwidth: 1800, minheight: 1600 },
    resizable: true
  },
  canvas: {
    Component: SketchApp,
    icon: Palette,
    title: 'Sketchy | Creator Core',
    name: 'Sketchy',
    defaultSize: { minwidth: 1800, minheight: 1600 },
    resizable: true,
    singleton: false
  },
  text: {
    Component: TextEditor,
    icon: FileText,
    title: 'AirWrite | Rich Text Editing',
    name: 'AirWrite'
  },
  chat: {
    Component: AirChat,
    icon: MessageSquare,
    title: 'AirChat | Messaging and Circles',
    name: 'AirChat'
  },
  files: {
    Component: FileManager,
    icon: Folder,
    title: 'File Manager',
    name: 'File Manager'
  },
  fileswap: {
    Component: FileConverter,
    icon: RefreshCw,
    title: 'AnySwap | File Conversion Tool',
    name: 'AnySwap'
  },
  archive: {
    Component: ScreenRipper,
    icon: Video,
    title: 'Screen Ripper',
    name: 'Screen Ripper'
  },
  image: {
    Component: ImageViewer,
    icon: Image,
    title: 'AfterImage | Photo App & Editor',
    name: 'AfterImage'
  },
  video: {
    Component: MediaPlayer,
    icon: Play,
    title: 'Media Player',
    name: 'Airstream Player'
  },
  browser: {
    Component: BrowserApp,
    icon: Globe,
    title: 'Browse',
    name: 'Browse'
  },
  calendar: {
    Component: Calendar,
    icon: CalendarIcon,
    title: 'Calendar',
    name: 'Calendar'
  },
  terminal: {
    Component: Terminal,
    icon: TerminalIcon,
    title: 'Terminal',
    name: 'Terminal'
  }
};

export const appCategories = {
  productivity: {
    name: 'Productivity',
    icon: '💼',
    apps: ['text', 'archive', 'files', 'fileswap', 'calendar', 'chat']
  },
  creativity: {
    name: 'Creativity',
    icon: '🎨',
    apps: ['image', 'canvas']
  },
  developertools: {
    name: 'Developer Tools',
    icon: '###',
    apps: ['code', 'terminal']
  },
  entertainment: {
    name: 'Entertainment',
    icon: '🎮',
    apps: ['video', 'browser']
  }
};

export const getCategorizedApps = () => {
  const categorized = {};
  
  Object.entries(appCategories).forEach(([key, category]) => {
    categorized[key] = {
      ...category,
      apps: category.apps.map(appKey => ({
        key: appKey,
        ...appRegistry[appKey]
      }))
    };
  });
  
  return categorized;
};

export const desktopApps = [
  { name: 'File Manager', icon: Folder, app: 'files' },
  { name: 'KruxBrowser', icon: Globe, app: 'browser' },
  { name: 'Terminal', icon: TerminalIcon, app: 'terminal' },
  { name: 'Codex', icon: Code2, app: 'code' },
  { name: 'AnySwap', icon: RefreshCw, app: 'fileswap' },
  { name: 'Sketchy', icon: Palette, app: 'canvas' }
];
